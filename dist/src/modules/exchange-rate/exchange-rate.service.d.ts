import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma';
interface ExchangeRateData {
    currency: string;
    buyRate: number;
    sellRate: number;
}
export declare class ExchangeRateService {
    private prisma;
    private configService;
    private readonly logger;
    private scrapeUrl;
    constructor(prisma: PrismaService, configService: ConfigService);
    syncExchangeRates(): Promise<void>;
    scrapeRates(): Promise<ExchangeRateData[]>;
    private parseRate;
    getCurrentRate(toCurrency?: string): Promise<{
        id: string;
        fromCurrency: string;
        toCurrency: string;
        buyRate: number;
        sellRate: number;
        midRate: number | undefined;
        source: string;
        fetchedAt: Date;
    } | null>;
    getRateHistory(toCurrency?: string, limit?: number): Promise<{
        id: string;
        buyRate: number;
        sellRate: number;
        fetchedAt: Date;
    }[]>;
    manualSync(): Promise<{
        success: boolean;
        message: string;
    }>;
    createManualRate(buyRate: number, sellRate: number, toCurrency?: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        fromCurrency: string;
        toCurrency: string;
        buyRate: import("@prisma/client-runtime-utils").Decimal;
        sellRate: import("@prisma/client-runtime-utils").Decimal;
        midRate: import("@prisma/client-runtime-utils").Decimal | null;
        source: string;
        fetchedAt: Date;
    }>;
}
export {};
