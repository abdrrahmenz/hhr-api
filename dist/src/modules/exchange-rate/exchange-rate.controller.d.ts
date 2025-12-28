import { ExchangeRateService } from './exchange-rate.service';
export declare class ExchangeRateController {
    private exchangeRateService;
    constructor(exchangeRateService: ExchangeRateService);
    getCurrentRate(currency?: string): Promise<{
        id: string;
        fromCurrency: string;
        toCurrency: string;
        buyRate: number;
        sellRate: number;
        midRate: number | undefined;
        source: string;
        fetchedAt: Date;
    } | null>;
    getRateHistory(currency?: string, limit?: string): Promise<{
        id: string;
        buyRate: number;
        sellRate: number;
        fetchedAt: Date;
    }[]>;
    manualSync(): Promise<{
        success: boolean;
        message: string;
    }>;
    createManualRate(body: {
        buyRate: number;
        sellRate: number;
        currency?: string;
    }): Promise<{
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
