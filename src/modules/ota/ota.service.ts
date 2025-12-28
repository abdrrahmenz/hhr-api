import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { OtaClientService } from './ota-client.service';
import { SearchTrainDto, CreateBookingDto, TripType } from './dto';
import { BookingStatus, Prisma } from '@prisma/client';

interface AuthenticatedUser {
    id: string;
    email: string;
    role: string;
    organizationId?: string;
    organization?: {
        markupType: string;
        markupValue: Prisma.Decimal;
    };
}

@Injectable()
export class OtaService {
    private readonly logger = new Logger(OtaService.name);

    constructor(
        private prisma: PrismaService,
        private otaClient: OtaClientService,
    ) { }

    async getRoutes() {
        return this.otaClient.getAvailableRoutes();
    }

    async searchTrains(dto: SearchTrainDto) {
        const result = await this.otaClient.searchLowFare({
            origin: dto.origin,
            destination: dto.destination,
            departureDate: dto.departureDate,
            returnDate: dto.returnDate,
            passengerCount: dto.passengerCount,
            tripType: dto.tripType,
        });

        // Get current exchange rate for price display
        const exchangeRate = await this.prisma.exchangeRate.findFirst({
            where: { isActive: true },
            orderBy: { fetchedAt: 'desc' },
        });

        return {
            ...result,
            exchangeRate: exchangeRate ? {
                buyRate: exchangeRate.buyRate,
                sellRate: exchangeRate.sellRate,
                fetchedAt: exchangeRate.fetchedAt,
            } : null,
        };
    }

    async createBooking(dto: CreateBookingDto, user: AuthenticatedUser) {
        // Get current exchange rate
        const exchangeRate = await this.prisma.exchangeRate.findFirst({
            where: { isActive: true },
            orderBy: { fetchedAt: 'desc' },
        });

        if (!exchangeRate) {
            throw new NotFoundException('Exchange rate not available');
        }

        // Call OTA to create booking
        const otaResult = await this.otaClient.createBooking({
            fareId: dto.fareId,
            passengers: dto.passengers,
            tripType: dto.tripType,
            origin: dto.origin,
            destination: dto.destination,
            departureDate: dto.departureDate,
            returnDate: dto.returnDate,
            returnFareId: dto.returnFareId,
        });

        // Calculate prices (placeholder - get actual price from OTA response)
        const basePriceSAR = new Prisma.Decimal(100); // Replace with actual price from OTA
        const priceIDR = basePriceSAR.mul(exchangeRate.sellRate);

        // Calculate markup for B2B
        let markupAmount = new Prisma.Decimal(0);
        if (user.organization) {
            if (user.organization.markupType === 'PERCENTAGE') {
                markupAmount = priceIDR.mul(user.organization.markupValue).div(100);
            } else {
                markupAmount = user.organization.markupValue;
            }
        }

        const totalAmount = priceIDR.add(markupAmount);

        // Create local booking record
        const booking = await this.prisma.booking.create({
            data: {
                userId: user.id,
                organizationId: user.organizationId,
                otaBookingRef: otaResult.bookingRef,
                pnr: otaResult.pnr,
                status: BookingStatus.PENDING,
                tripType: dto.tripType,
                departureDate: new Date(dto.departureDate),
                returnDate: dto.returnDate ? new Date(dto.returnDate) : null,
                origin: dto.origin,
                destination: dto.destination,
                passengers: JSON.parse(JSON.stringify(dto.passengers)),
                passengerCount: dto.passengers.length,
                priceIDR,
                priceSAR: basePriceSAR,
                markupAmount,
                totalAmount,
                exchangeRateId: exchangeRate.id,
                otaResponse: JSON.parse(JSON.stringify(otaResult)),
            },
        });

        return {
            id: booking.id,
            bookingCode: booking.bookingCode,
            otaBookingRef: booking.otaBookingRef,
            status: booking.status,
            priceIDR: booking.priceIDR.toNumber(),
            priceSAR: booking.priceSAR.toNumber(),
            markupAmount: booking.markupAmount.toNumber(),
            totalAmount: booking.totalAmount.toNumber(),
        };
    }

    async getBooking(bookingId: string, userId: string) {
        const booking = await this.prisma.booking.findFirst({
            where: { id: bookingId, userId },
            include: {
                payments: true,
                exchangeRate: true,
            },
        });

        if (!booking) {
            throw new NotFoundException('Booking not found');
        }

        return booking;
    }

    async getUserBookings(userId: string, page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        const [bookings, total] = await Promise.all([
            this.prisma.booking.findMany({
                where: { userId },
                include: { payments: true },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.booking.count({ where: { userId } }),
        ]);

        return {
            data: bookings,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async cancelBooking(bookingId: string, userId: string) {
        const booking = await this.prisma.booking.findFirst({
            where: { id: bookingId, userId },
        });

        if (!booking) {
            throw new NotFoundException('Booking not found');
        }

        if (booking.status === BookingStatus.CANCELLED) {
            throw new Error('Booking already cancelled');
        }

        // Cancel in OTA
        if (booking.otaBookingRef) {
            await this.otaClient.cancelBooking(booking.otaBookingRef);
        }

        // Update local record
        const updated = await this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: BookingStatus.CANCELLED },
        });

        return updated;
    }

    async processTicketing(bookingId: string) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { payments: { where: { status: 'PAID' } } },
        });

        if (!booking) {
            throw new NotFoundException('Booking not found');
        }

        if (!booking.payments.length) {
            throw new Error('No confirmed payment found');
        }

        if (!booking.otaBookingRef) {
            throw new Error('No OTA booking reference');
        }

        // Process payment and ticketing in OTA
        const result = await this.otaClient.processPaymentAndTicketing(
            booking.otaBookingRef,
            {
                amount: booking.priceSAR.toNumber(),
                currency: 'SAR',
            },
        );

        if (result.success) {
            await this.prisma.booking.update({
                where: { id: bookingId },
                data: { status: BookingStatus.TICKETED },
            });
        }

        return result;
    }

    async downloadTickets(bookingId: string, userId: string) {
        const booking = await this.prisma.booking.findFirst({
            where: { id: bookingId, userId },
        });

        if (!booking || !booking.otaBookingRef) {
            throw new NotFoundException('Booking not found');
        }

        if (booking.status !== BookingStatus.TICKETED) {
            throw new Error('Booking not ticketed yet');
        }

        return this.otaClient.downloadTickets(booking.otaBookingRef);
    }
}
