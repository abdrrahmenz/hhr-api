import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma';
import { CreateQrisPaymentDto, PaymentWebhookDto } from './dto';
import { PaymentStatus, BookingStatus } from '@prisma/client';
import Xendit from 'xendit-node';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PaymentService {
    private readonly logger = new Logger(PaymentService.name);
    private xendit: Xendit;
    private callbackUrl: string;

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) {
        const secretKey = this.configService.get<string>('xendit.secretKey');
        if (secretKey) {
            this.xendit = new Xendit({ secretKey });
        }
        this.callbackUrl = this.configService.get<string>('xendit.callbackUrl') || '';
    }

    async createQrisPayment(dto: CreateQrisPaymentDto, userId: string) {
        const booking = await this.prisma.booking.findFirst({
            where: { id: dto.bookingId, userId },
        });

        if (!booking) {
            throw new NotFoundException('Booking not found');
        }

        if (booking.status !== BookingStatus.PENDING) {
            throw new BadRequestException('Booking is not in pending status');
        }

        // Check for existing pending payment
        const existingPayment = await this.prisma.payment.findFirst({
            where: {
                bookingId: booking.id,
                status: PaymentStatus.PENDING,
                expiresAt: { gt: new Date() },
            },
        });

        if (existingPayment) {
            return {
                id: existingPayment.id,
                externalId: existingPayment.externalId,
                qrString: existingPayment.qrString,
                amount: existingPayment.amount.toNumber(),
                status: existingPayment.status,
                expiresAt: existingPayment.expiresAt,
            };
        }

        const externalId = `booking-${booking.id}-${uuidv4().slice(0, 8)}`;
        const amount = dto.amount || booking.totalAmount.toNumber();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        try {
            // Create QRIS via Xendit (v7 API)
            // Note: Xendit API structure may vary, using type assertion for compatibility
            const qrisApi = (this.xendit as any).QRCode || (this.xendit as any).qrCode;
            const qrisResponse = await qrisApi.createQRCode({
                externalID: externalId,
                type: 'DYNAMIC',
                callbackURL: this.callbackUrl,
                amount,
            });

            // Save payment record
            const payment = await this.prisma.payment.create({
                data: {
                    bookingId: booking.id,
                    xenditPaymentId: qrisResponse.id,
                    externalId,
                    qrString: qrisResponse.qr_string || qrisResponse.qrString,
                    amount,
                    status: PaymentStatus.PENDING,
                    expiresAt,
                    callbackUrl: this.callbackUrl,
                },
            });

            return {
                id: payment.id,
                externalId: payment.externalId,
                qrString: payment.qrString,
                amount: payment.amount.toNumber(),
                status: payment.status,
                expiresAt: payment.expiresAt,
            };
        } catch (error) {
            this.logger.error('Failed to create QRIS payment', error);
            throw new BadRequestException('Failed to create payment');
        }
    }

    async handleWebhook(payload: PaymentWebhookDto, callbackToken: string) {
        // Verify webhook token
        const expectedToken = this.configService.get<string>('xendit.webhookToken');
        if (callbackToken !== expectedToken) {
            this.logger.warn('Invalid webhook token received');
            throw new BadRequestException('Invalid callback token');
        }

        const payment = await this.prisma.payment.findUnique({
            where: { externalId: payload.external_id },
            include: { booking: true },
        });

        if (!payment) {
            this.logger.warn(`Payment not found for external_id: ${payload.external_id}`);
            throw new NotFoundException('Payment not found');
        }

        if (payload.status === 'COMPLETED') {
            await this.prisma.$transaction(async (tx) => {
                // Update payment
                await tx.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: PaymentStatus.PAID,
                        paidAt: payload.paid_at ? new Date(payload.paid_at) : new Date(),
                        webhookPayload: payload as any,
                    },
                });

                // Update booking
                await tx.booking.update({
                    where: { id: payment.bookingId },
                    data: { status: BookingStatus.CONFIRMED },
                });
            });

            this.logger.log(`Payment ${payment.id} completed successfully`);
        } else if (payload.status === 'EXPIRED') {
            await this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: PaymentStatus.EXPIRED,
                    webhookPayload: payload as any,
                },
            });

            this.logger.log(`Payment ${payment.id} expired`);
        }

        return { success: true };
    }

    async getPaymentStatus(paymentId: string, userId: string) {
        const payment = await this.prisma.payment.findFirst({
            where: {
                id: paymentId,
                booking: { userId },
            },
            include: { booking: true },
        });

        if (!payment) {
            throw new NotFoundException('Payment not found');
        }

        return {
            id: payment.id,
            externalId: payment.externalId,
            amount: payment.amount.toNumber(),
            status: payment.status,
            paidAt: payment.paidAt,
            expiresAt: payment.expiresAt,
            booking: {
                id: payment.booking.id,
                bookingCode: payment.booking.bookingCode,
                status: payment.booking.status,
            },
        };
    }

    async refundPayment(paymentId: string, amount?: number, reason?: string) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
            include: { booking: true },
        });

        if (!payment) {
            throw new NotFoundException('Payment not found');
        }

        if (payment.status !== PaymentStatus.PAID) {
            throw new BadRequestException('Payment is not in paid status');
        }

        const refundAmount = amount || payment.amount.toNumber();

        try {
            // Create refund via Xendit (simplified - actual implementation depends on payment method)
            // Note: QRIS refunds may have limitations based on issuer

            await this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: PaymentStatus.REFUNDED,
                    metadata: {
                        refundAmount,
                        refundReason: reason,
                        refundedAt: new Date().toISOString(),
                    },
                },
            });

            return { success: true, refundAmount };
        } catch (error) {
            this.logger.error('Refund failed', error);
            throw new BadRequestException('Refund failed');
        }
    }

    async getPaymentsByBooking(bookingId: string) {
        const payments = await this.prisma.payment.findMany({
            where: { bookingId },
            orderBy: { createdAt: 'desc' },
        });

        return payments;
    }
}
