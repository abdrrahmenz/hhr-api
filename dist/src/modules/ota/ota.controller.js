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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtaController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const passport_1 = require("@nestjs/passport");
const ota_service_1 = require("./ota.service");
const dto_1 = require("./dto");
const decorators_1 = require("../../common/decorators");
let OtaController = class OtaController {
    otaService;
    constructor(otaService) {
        this.otaService = otaService;
    }
    async getRoutes() {
        return this.otaService.getRoutes();
    }
    async searchTrains(dto) {
        return this.otaService.searchTrains(dto);
    }
    async createBooking(dto, user) {
        return this.otaService.createBooking(dto, user);
    }
    async getUserBookings(userId, page, limit) {
        return this.otaService.getUserBookings(userId, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 10);
    }
    async getBooking(bookingId, userId) {
        return this.otaService.getBooking(bookingId, userId);
    }
    async cancelBooking(bookingId, userId) {
        return this.otaService.cancelBooking(bookingId, userId);
    }
    async downloadTickets(bookingId, userId, res) {
        const ticketBuffer = await this.otaService.downloadTickets(bookingId, userId);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=tickets-${bookingId}.pdf`);
        res.send(ticketBuffer);
    }
};
exports.OtaController = OtaController;
__decorate([
    (0, common_1.Get)('routes'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available train routes' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], OtaController.prototype, "getRoutes", null);
__decorate([
    (0, common_1.Post)('search'),
    (0, swagger_1.ApiOperation)({ summary: 'Search for trains (low fare search)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.SearchTrainDto]),
    __metadata("design:returntype", Promise)
], OtaController.prototype, "searchTrains", null);
__decorate([
    (0, common_1.Post)('book'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new booking' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, decorators_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateBookingDto, Object]),
    __metadata("design:returntype", Promise)
], OtaController.prototype, "createBooking", null);
__decorate([
    (0, common_1.Get)('bookings'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user bookings' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    __param(0, (0, decorators_1.CurrentUser)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], OtaController.prototype, "getUserBookings", null);
__decorate([
    (0, common_1.Get)('bookings/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get booking details' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], OtaController.prototype, "getBooking", null);
__decorate([
    (0, common_1.Post)('bookings/:id/cancel'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel a booking' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], OtaController.prototype, "cancelBooking", null);
__decorate([
    (0, common_1.Get)('bookings/:id/tickets'),
    (0, swagger_1.ApiOperation)({ summary: 'Download tickets for a booking' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, decorators_1.CurrentUser)('id')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], OtaController.prototype, "downloadTickets", null);
exports.OtaController = OtaController = __decorate([
    (0, swagger_1.ApiTags)('OTA - Train Booking'),
    (0, common_1.Controller)('ota'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [ota_service_1.OtaService])
], OtaController);
//# sourceMappingURL=ota.controller.js.map