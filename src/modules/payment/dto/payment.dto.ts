import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateQrisPaymentDto {
    @ApiProperty({ description: 'Booking ID to pay for' })
    @IsString()
    bookingId: string;

    @ApiPropertyOptional({ description: 'Override amount (admin only)' })
    @IsOptional()
    @IsNumber()
    @Min(1000)
    amount?: number;
}

export class PaymentWebhookDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    external_id: string;

    @ApiProperty()
    qr_code: string;

    @ApiProperty()
    type: string;

    @ApiProperty()
    callback_url: string;

    @ApiProperty()
    status: string;

    @ApiProperty()
    amount: number;

    @ApiProperty()
    created: string;

    @ApiProperty()
    updated: string;

    @ApiPropertyOptional()
    paid_at?: string;

    @ApiPropertyOptional()
    paid_amount?: number;

    @ApiPropertyOptional()
    payment_method?: string;
}

export class RefundPaymentDto {
    @ApiProperty()
    @IsString()
    paymentId: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @Min(1000)
    amount?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    reason?: string;
}
