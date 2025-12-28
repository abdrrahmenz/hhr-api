import { PaymentService } from './payment.service';
import { CreateQrisPaymentDto, PaymentWebhookDto, RefundPaymentDto } from './dto';
export declare class PaymentController {
    private paymentService;
    constructor(paymentService: PaymentService);
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
    refundPayment(dto: RefundPaymentDto): Promise<{
        success: boolean;
        refundAmount: number;
    }>;
}
