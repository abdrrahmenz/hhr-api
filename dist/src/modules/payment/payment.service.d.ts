import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma';
import { CreateQrisPaymentDto, PaymentWebhookDto } from './dto';
export declare class PaymentService {
    private prisma;
    private configService;
    private readonly logger;
    private xendit;
    private callbackUrl;
    constructor(prisma: PrismaService, configService: ConfigService);
    createQrisPayment(dto: CreateQrisPaymentDto, userId: string): Promise<{
        id: string;
        externalId: string;
        qrString: string | null;
        amount: number;
        status: import("@prisma/client").$Enums.PaymentStatus;
        expiresAt: Date;
    }>;
    handleWebhook(payload: PaymentWebhookDto, callbackToken: string): Promise<{
        success: boolean;
    }>;
    getPaymentStatus(paymentId: string, userId: string): Promise<{
        id: string;
        externalId: string;
        amount: number;
        status: import("@prisma/client").$Enums.PaymentStatus;
        paidAt: Date | null;
        expiresAt: Date;
        booking: {
            id: string;
            bookingCode: string;
            status: import("@prisma/client").$Enums.BookingStatus;
        };
    }>;
    refundPayment(paymentId: string, amount?: number, reason?: string): Promise<{
        success: boolean;
        refundAmount: number;
    }>;
    getPaymentsByBooking(bookingId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.PaymentStatus;
        bookingId: string;
        xenditPaymentId: string | null;
        externalId: string;
        qrString: string | null;
        amount: import("@prisma/client-runtime-utils").Decimal;
        currency: string;
        paymentMethod: string;
        expiresAt: Date;
        paidAt: Date | null;
        webhookPayload: import("@prisma/client/runtime/client").JsonValue | null;
        callbackUrl: string | null;
        metadata: import("@prisma/client/runtime/client").JsonValue | null;
    }[]>;
}
