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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var PaymentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_1 = require("../../prisma");
const client_1 = require("@prisma/client");
const xendit_node_1 = __importDefault(require("xendit-node"));
const uuid_1 = require("uuid");
let PaymentService = PaymentService_1 = class PaymentService {
    prisma;
    configService;
    logger = new common_1.Logger(PaymentService_1.name);
    xendit;
    callbackUrl;
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        const secretKey = this.configService.get('xendit.secretKey');
        if (secretKey) {
            this.xendit = new xendit_node_1.default({ secretKey });
        }
        this.callbackUrl = this.configService.get('xendit.callbackUrl') || '';
    }
    async createQrisPayment(dto, userId) {
        const booking = await this.prisma.booking.findFirst({
            where: { id: dto.bookingId, userId },
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        if (booking.status !== client_1.BookingStatus.PENDING) {
            throw new common_1.BadRequestException('Booking is not in pending status');
        }
        const existingPayment = await this.prisma.payment.findFirst({
            where: {
                bookingId: booking.id,
                status: client_1.PaymentStatus.PENDING,
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
        const externalId = `booking-${booking.id}-${(0, uuid_1.v4)().slice(0, 8)}`;
        const amount = dto.amount || booking.totalAmount.toNumber();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        try {
            const qrisApi = this.xendit.QRCode || this.xendit.qrCode;
            const qrisResponse = await qrisApi.createQRCode({
                externalID: externalId,
                type: 'DYNAMIC',
                callbackURL: this.callbackUrl,
                amount,
            });
            const payment = await this.prisma.payment.create({
                data: {
                    bookingId: booking.id,
                    xenditPaymentId: qrisResponse.id,
                    externalId,
                    qrString: qrisResponse.qr_string || qrisResponse.qrString,
                    amount,
                    status: client_1.PaymentStatus.PENDING,
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
        }
        catch (error) {
            this.logger.error('Failed to create QRIS payment', error);
            throw new common_1.BadRequestException('Failed to create payment');
        }
    }
    async handleWebhook(payload, callbackToken) {
        const expectedToken = this.configService.get('xendit.webhookToken');
        if (callbackToken !== expectedToken) {
            this.logger.warn('Invalid webhook token received');
            throw new common_1.BadRequestException('Invalid callback token');
        }
        const payment = await this.prisma.payment.findUnique({
            where: { externalId: payload.external_id },
            include: { booking: true },
        });
        if (!payment) {
            this.logger.warn(`Payment not found for external_id: ${payload.external_id}`);
            throw new common_1.NotFoundException('Payment not found');
        }
        if (payload.status === 'COMPLETED') {
            await this.prisma.$transaction(async (tx) => {
                await tx.payment.update({
                    where: { id: payment.id },
                    data: {
                        status: client_1.PaymentStatus.PAID,
                        paidAt: payload.paid_at ? new Date(payload.paid_at) : new Date(),
                        webhookPayload: payload,
                    },
                });
                await tx.booking.update({
                    where: { id: payment.bookingId },
                    data: { status: client_1.BookingStatus.CONFIRMED },
                });
            });
            this.logger.log(`Payment ${payment.id} completed successfully`);
        }
        else if (payload.status === 'EXPIRED') {
            await this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: client_1.PaymentStatus.EXPIRED,
                    webhookPayload: payload,
                },
            });
            this.logger.log(`Payment ${payment.id} expired`);
        }
        return { success: true };
    }
    async getPaymentStatus(paymentId, userId) {
        const payment = await this.prisma.payment.findFirst({
            where: {
                id: paymentId,
                booking: { userId },
            },
            include: { booking: true },
        });
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
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
    async refundPayment(paymentId, amount, reason) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
            include: { booking: true },
        });
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
        }
        if (payment.status !== client_1.PaymentStatus.PAID) {
            throw new common_1.BadRequestException('Payment is not in paid status');
        }
        const refundAmount = amount || payment.amount.toNumber();
        try {
            await this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: client_1.PaymentStatus.REFUNDED,
                    metadata: {
                        refundAmount,
                        refundReason: reason,
                        refundedAt: new Date().toISOString(),
                    },
                },
            });
            return { success: true, refundAmount };
        }
        catch (error) {
            this.logger.error('Refund failed', error);
            throw new common_1.BadRequestException('Refund failed');
        }
    }
    async getPaymentsByBooking(bookingId) {
        const payments = await this.prisma.payment.findMany({
            where: { bookingId },
            orderBy: { createdAt: 'desc' },
        });
        return payments;
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = PaymentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService,
        config_1.ConfigService])
], PaymentService);
//# sourceMappingURL=payment.service.js.map