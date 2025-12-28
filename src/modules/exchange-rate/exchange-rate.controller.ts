import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ExchangeRateService } from './exchange-rate.service';
import { Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { UserRole } from '@prisma/client';

@ApiTags('Exchange Rate')
@Controller('exchange-rate')
export class ExchangeRateController {
    constructor(private exchangeRateService: ExchangeRateService) { }

    @Get('current')
    @ApiOperation({ summary: 'Get current IDR/SAR exchange rate' })
    @ApiQuery({ name: 'currency', required: false, example: 'SAR' })
    async getCurrentRate(@Query('currency') currency?: string) {
        return this.exchangeRateService.getCurrentRate(currency || 'SAR');
    }

    @Get('history')
    @ApiOperation({ summary: 'Get exchange rate history' })
    @ApiQuery({ name: 'currency', required: false, example: 'SAR' })
    @ApiQuery({ name: 'limit', required: false, example: 50 })
    async getRateHistory(
        @Query('currency') currency?: string,
        @Query('limit') limit?: string,
    ) {
        return this.exchangeRateService.getRateHistory(
            currency || 'SAR',
            limit ? parseInt(limit, 10) : 50,
        );
    }

    @Post('sync')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Manually trigger exchange rate sync (Admin only)' })
    async manualSync() {
        return this.exchangeRateService.manualSync();
    }

    @Post('manual')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create manual exchange rate entry (Admin only)' })
    async createManualRate(
        @Body() body: { buyRate: number; sellRate: number; currency?: string },
    ) {
        return this.exchangeRateService.createManualRate(
            body.buyRate,
            body.sellRate,
            body.currency,
        );
    }
}
