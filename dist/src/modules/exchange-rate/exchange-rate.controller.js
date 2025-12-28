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
exports.ExchangeRateController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const passport_1 = require("@nestjs/passport");
const exchange_rate_service_1 = require("./exchange-rate.service");
const decorators_1 = require("../../common/decorators");
const guards_1 = require("../../common/guards");
const client_1 = require("@prisma/client");
let ExchangeRateController = class ExchangeRateController {
    exchangeRateService;
    constructor(exchangeRateService) {
        this.exchangeRateService = exchangeRateService;
    }
    async getCurrentRate(currency) {
        return this.exchangeRateService.getCurrentRate(currency || 'SAR');
    }
    async getRateHistory(currency, limit) {
        return this.exchangeRateService.getRateHistory(currency || 'SAR', limit ? parseInt(limit, 10) : 50);
    }
    async manualSync() {
        return this.exchangeRateService.manualSync();
    }
    async createManualRate(body) {
        return this.exchangeRateService.createManualRate(body.buyRate, body.sellRate, body.currency);
    }
};
exports.ExchangeRateController = ExchangeRateController;
__decorate([
    (0, common_1.Get)('current'),
    (0, swagger_1.ApiOperation)({ summary: 'Get current IDR/SAR exchange rate' }),
    (0, swagger_1.ApiQuery)({ name: 'currency', required: false, example: 'SAR' }),
    __param(0, (0, common_1.Query)('currency')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ExchangeRateController.prototype, "getCurrentRate", null);
__decorate([
    (0, common_1.Get)('history'),
    (0, swagger_1.ApiOperation)({ summary: 'Get exchange rate history' }),
    (0, swagger_1.ApiQuery)({ name: 'currency', required: false, example: 'SAR' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, example: 50 }),
    __param(0, (0, common_1.Query)('currency')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ExchangeRateController.prototype, "getRateHistory", null);
__decorate([
    (0, common_1.Post)('sync'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), guards_1.RolesGuard),
    (0, decorators_1.Roles)(client_1.UserRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Manually trigger exchange rate sync (Admin only)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ExchangeRateController.prototype, "manualSync", null);
__decorate([
    (0, common_1.Post)('manual'),
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), guards_1.RolesGuard),
    (0, decorators_1.Roles)(client_1.UserRole.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create manual exchange rate entry (Admin only)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExchangeRateController.prototype, "createManualRate", null);
exports.ExchangeRateController = ExchangeRateController = __decorate([
    (0, swagger_1.ApiTags)('Exchange Rate'),
    (0, common_1.Controller)('exchange-rate'),
    __metadata("design:paramtypes", [exchange_rate_service_1.ExchangeRateService])
], ExchangeRateController);
//# sourceMappingURL=exchange-rate.controller.js.map