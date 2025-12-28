"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OtaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtaService = void 0;
const common_1 = require("@nestjs/common");
const prisma_1 = require("../../prisma");
const ota_client_service_1 = require("./ota-client.service");
const client_1 = require("@prisma/client");
let OtaService = OtaService_1 = class OtaService {
    prisma;
    otaClient;
    logger = new common_1.Logger(OtaService_1.name);
    constructor(prisma, otaClient) {
        this.prisma = prisma;
        this.otaClient = otaClient;
    }
    async getRoutes() {
        return this.otaClient.getAvailableRoutes();
    }
    async searchTrains(dto) {
        const result = await this.otaClient.searchLowFare({
            origin: dto.origin,
            destination: dto.destination,
            departureDate: dto.departureDate,
            returnDate: dto.returnDate,
            passengerCount: dto.passengerCount,
            tripType: dto.tripType,
        });
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
    async createBooking(dto, user) {
        const exchangeRate = await this.prisma.exchangeRate.findFirst({
            where: { isActive: true },
            orderBy: { fetchedAt: 'desc' },
        });
        if (!exchangeRate) {
            throw new common_1.NotFoundException('Exchange rate not available');
        }
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
        const basePriceSAR = new client_1.Prisma.Decimal(100);
        const priceIDR = basePriceSAR.mul(exchangeRate.sellRate);
        let markupAmount = new client_1.Prisma.Decimal(0);
        if (user.organization) {
            if (user.organization.markupType === 'PERCENTAGE') {
                markupAmount = priceIDR.mul(user.organization.markupValue).div(100);
            }
            else {
                markupAmount = user.organization.markupValue;
            }
        }
        const totalAmount = priceIDR.add(markupAmount);
        const booking = await this.prisma.booking.create({
            data: {
                userId: user.id,
                organizationId: user.organizationId,
                otaBookingRef: otaResult.bookingRef,
                pnr: otaResult.pnr,
                status: client_1.BookingStatus.PENDING,
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
    async getBooking(bookingId, userId) {
        const booking = await this.prisma.booking.findFirst({
            where: { id: bookingId, userId },
            include: {
                payments: true,
                exchangeRate: true,
            },
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        return booking;
    }
    async getUserBookings(userId, page = 1, limit = 10) {
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
    async cancelBooking(bookingId, userId) {
        const booking = await this.prisma.booking.findFirst({
            where: { id: bookingId, userId },
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        if (booking.status === client_1.BookingStatus.CANCELLED) {
            throw new Error('Booking already cancelled');
        }
        if (booking.otaBookingRef) {
            await this.otaClient.cancelBooking(booking.otaBookingRef);
        }
        const updated = await this.prisma.booking.update({
            where: { id: bookingId },
            data: { status: client_1.BookingStatus.CANCELLED },
        });
        return updated;
    }
    async processTicketing(bookingId) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: { payments: { where: { status: 'PAID' } } },
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        if (!booking.payments.length) {
            throw new Error('No confirmed payment found');
        }
        if (!booking.otaBookingRef) {
            throw new Error('No OTA booking reference');
        }
        const result = await this.otaClient.processPaymentAndTicketing(booking.otaBookingRef, {
            amount: booking.priceSAR.toNumber(),
            currency: 'SAR',
        });
        if (result.success) {
            await this.prisma.booking.update({
                where: { id: bookingId },
                data: { status: client_1.BookingStatus.TICKETED },
            });
        }
        return result;
    }
    async downloadTickets(bookingId, userId) {
        const booking = await this.prisma.booking.findFirst({
            where: { id: bookingId, userId },
        });
        if (!booking || !booking.otaBookingRef) {
            throw new common_1.NotFoundException('Booking not found');
        }
        if (booking.status !== client_1.BookingStatus.TICKETED) {
            throw new Error('Booking not ticketed yet');
        }
        return this.otaClient.downloadTickets(booking.otaBookingRef);
    }
};
exports.OtaService = OtaService;
exports.OtaService = OtaService = OtaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService,
        ota_client_service_1.OtaClientService])
], OtaService);
//# sourceMappingURL=ota.service.js.map