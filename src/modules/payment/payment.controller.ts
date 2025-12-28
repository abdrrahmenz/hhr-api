import { Controller, Post, Get, Body, Param, Headers, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PaymentService } from './payment.service';
import { CreateQrisPaymentDto, PaymentWebhookDto, RefundPaymentDto } from './dto';
import { CurrentUser, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { UserRole } from '@prisma/client';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
    constructor(private paymentService: PaymentService) { }

    @Post('qris/create')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create QRIS payment for a booking' })
    async createQrisPayment(
        @Body() dto: CreateQrisPaymentDto,
        @CurrentUser('id') userId: string,
    ) {
        return this.paymentService.createQrisPayment(dto, userId);
    }

    @Post('webhook')
    @ApiOperation({ summary: 'Xendit webhook endpoint' })
    @ApiHeader({ name: 'x-callback-token', description: 'Xendit callback token' })
    async handleWebhook(
        @Body() payload: PaymentWebhookDto,
        @Headers('x-callback-token') callbackToken: string,
    ) {
        return this.paymentService.handleWebhook(payload, callbackToken);
    }

    @Get(':id/status')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get payment status' })
    async getPaymentStatus(
        @Param('id') paymentId: string,
        @CurrentUser('id') userId: string,
    ) {
        return this.paymentService.getPaymentStatus(paymentId, userId);
    }

    @Post(':id/refund')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Refund a payment (Admin only)' })
    async refundPayment(@Body() dto: RefundPaymentDto) {
        return this.paymentService.refundPayment(dto.paymentId, dto.amount, dto.reason);
    }
}
