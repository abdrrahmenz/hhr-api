import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma';
import { AuthModule } from './modules/auth/auth.module';
import { OtaModule } from './modules/ota/ota.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ExchangeRateModule } from './modules/exchange-rate/exchange-rate.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import {
  appConfig,
  jwtConfig,
  otaConfig,
  xenditConfig,
  exchangeRateConfig,
} from './config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, jwtConfig, otaConfig, xenditConfig, exchangeRateConfig],
    }),

    // Scheduler for cron jobs
    ScheduleModule.forRoot(),

    // Database
    PrismaModule,

    // Feature Modules
    AuthModule,
    OtaModule,
    PaymentModule,
    ExchangeRateModule,
    UsersModule,
    OrganizationsModule,
  ],
})
export class AppModule { }
