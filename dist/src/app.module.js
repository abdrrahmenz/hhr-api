"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const prisma_1 = require("./prisma");
const auth_module_1 = require("./modules/auth/auth.module");
const ota_module_1 = require("./modules/ota/ota.module");
const payment_module_1 = require("./modules/payment/payment.module");
const exchange_rate_module_1 = require("./modules/exchange-rate/exchange-rate.module");
const users_module_1 = require("./modules/users/users.module");
const organizations_module_1 = require("./modules/organizations/organizations.module");
const config_2 = require("./config");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [config_2.appConfig, config_2.jwtConfig, config_2.otaConfig, config_2.xenditConfig, config_2.exchangeRateConfig],
            }),
            schedule_1.ScheduleModule.forRoot(),
            prisma_1.PrismaModule,
            auth_module_1.AuthModule,
            ota_module_1.OtaModule,
            payment_module_1.PaymentModule,
            exchange_rate_module_1.ExchangeRateModule,
            users_module_1.UsersModule,
            organizations_module_1.OrganizationsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map