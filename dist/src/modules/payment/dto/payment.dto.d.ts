export declare class CreateQrisPaymentDto {
    bookingId: string;
    amount?: number;
}
export declare class PaymentWebhookDto {
    id: string;
    external_id: string;
    qr_code: string;
    type: string;
    callback_url: string;
    status: string;
    amount: number;
    created: string;
    updated: string;
    paid_at?: string;
    paid_amount?: number;
    payment_method?: string;
}
export declare class RefundPaymentDto {
    paymentId: string;
    amount?: number;
    reason?: string;
}
