import { Controller, Get, Post, Body, Param, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { OtaService } from './ota.service';
import { SearchTrainDto, CreateBookingDto } from './dto';
import { CurrentUser } from '../../common/decorators';

@ApiTags('OTA - Train Booking')
@Controller('ota')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class OtaController {
    constructor(private otaService: OtaService) { }

    @Get('routes')
    @ApiOperation({ summary: 'Get available train routes' })
    async getRoutes() {
        return this.otaService.getRoutes();
    }

    @Post('search')
    @ApiOperation({ summary: 'Search for trains (low fare search)' })
    async searchTrains(@Body() dto: SearchTrainDto) {
        return this.otaService.searchTrains(dto);
    }

    @Post('book')
    @ApiOperation({ summary: 'Create a new booking' })
    async createBooking(
        @Body() dto: CreateBookingDto,
        @CurrentUser() user: any,
    ) {
        return this.otaService.createBooking(dto, user);
    }

    @Get('bookings')
    @ApiOperation({ summary: 'Get user bookings' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getUserBookings(
        @CurrentUser('id') userId: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.otaService.getUserBookings(
            userId,
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 10,
        );
    }

    @Get('bookings/:id')
    @ApiOperation({ summary: 'Get booking details' })
    async getBooking(
        @Param('id') bookingId: string,
        @CurrentUser('id') userId: string,
    ) {
        return this.otaService.getBooking(bookingId, userId);
    }

    @Post('bookings/:id/cancel')
    @ApiOperation({ summary: 'Cancel a booking' })
    async cancelBooking(
        @Param('id') bookingId: string,
        @CurrentUser('id') userId: string,
    ) {
        return this.otaService.cancelBooking(bookingId, userId);
    }

    @Get('bookings/:id/tickets')
    @ApiOperation({ summary: 'Download tickets for a booking' })
    async downloadTickets(
        @Param('id') bookingId: string,
        @CurrentUser('id') userId: string,
        @Res() res: Response,
    ) {
        const ticketBuffer = await this.otaService.downloadTickets(bookingId, userId);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=tickets-${bookingId}.pdf`);
        res.send(ticketBuffer);
    }
}
