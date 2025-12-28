"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var ExchangeRateService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExchangeRateService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const cheerio = __importStar(require("cheerio"));
const axios_1 = __importDefault(require("axios"));
const prisma_1 = require("../../prisma");
let ExchangeRateService = ExchangeRateService_1 = class ExchangeRateService {
    prisma;
    configService;
    logger = new common_1.Logger(ExchangeRateService_1.name);
    scrapeUrl;
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
        this.scrapeUrl = this.configService.get('exchangeRate.scrapeUrl') || 'https://www.bankmandiri.co.id/kurs';
    }
    async syncExchangeRates() {
        this.logger.log('Starting exchange rate sync...');
        try {
            const rates = await this.scrapeRates();
            const sarRate = rates.find(r => r.currency === 'SAR');
            if (sarRate) {
                await this.prisma.exchangeRate.updateMany({
                    where: { isActive: true, toCurrency: 'SAR' },
                    data: { isActive: false },
                });
                await this.prisma.exchangeRate.create({
                    data: {
                        fromCurrency: 'IDR',
                        toCurrency: 'SAR',
                        buyRate: sarRate.buyRate,
                        sellRate: sarRate.sellRate,
                        midRate: (sarRate.buyRate + sarRate.sellRate) / 2,
                        source: 'BANK_MANDIRI',
                        isActive: true,
                    },
                });
                this.logger.log(`Exchange rate updated: SAR Buy=${sarRate.buyRate}, Sell=${sarRate.sellRate}`);
            }
            else {
                this.logger.warn('SAR rate not found in scraped data');
            }
        }
        catch (error) {
            this.logger.error('Failed to sync exchange rates', error);
        }
    }
    async scrapeRates() {
        try {
            const response = await axios_1.default.get(this.scrapeUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml',
                    'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
                },
                timeout: 30000,
            });
            const $ = cheerio.load(response.data);
            const rates = [];
            $('table tbody tr').each((_, row) => {
                const columns = $(row).find('td');
                if (columns.length >= 3) {
                    const currency = $(columns[0]).text().trim().toUpperCase();
                    const buyRate = this.parseRate($(columns[1]).text());
                    const sellRate = this.parseRate($(columns[2]).text());
                    if (currency && buyRate && sellRate) {
                        rates.push({ currency, buyRate, sellRate });
                    }
                }
            });
            if (rates.length === 0) {
                $('.kurs-row, .exchange-row, [data-currency]').each((_, row) => {
                    const currency = $(row).find('[data-field="currency"], .currency').text().trim().toUpperCase()
                        || $(row).attr('data-currency')?.toUpperCase();
                    const buyRate = this.parseRate($(row).find('[data-field="buy"], .buy-rate').text());
                    const sellRate = this.parseRate($(row).find('[data-field="sell"], .sell-rate').text());
                    if (currency && buyRate && sellRate) {
                        rates.push({ currency, buyRate, sellRate });
                    }
                });
            }
            this.logger.log(`Scraped ${rates.length} exchange rates`);
            return rates;
        }
        catch (error) {
            this.logger.error('Scraping failed', error);
            throw error;
        }
    }
    parseRate(value) {
        const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    }
    async getCurrentRate(toCurrency = 'SAR') {
        const rate = await this.prisma.exchangeRate.findFirst({
            where: { toCurrency, isActive: true },
            orderBy: { fetchedAt: 'desc' },
        });
        if (!rate) {
            return null;
        }
        return {
            id: rate.id,
            fromCurrency: rate.fromCurrency,
            toCurrency: rate.toCurrency,
            buyRate: rate.buyRate.toNumber(),
            sellRate: rate.sellRate.toNumber(),
            midRate: rate.midRate?.toNumber(),
            source: rate.source,
            fetchedAt: rate.fetchedAt,
        };
    }
    async getRateHistory(toCurrency = 'SAR', limit = 50) {
        const rates = await this.prisma.exchangeRate.findMany({
            where: { toCurrency },
            orderBy: { fetchedAt: 'desc' },
            take: limit,
        });
        return rates.map(r => ({
            id: r.id,
            buyRate: r.buyRate.toNumber(),
            sellRate: r.sellRate.toNumber(),
            fetchedAt: r.fetchedAt,
        }));
    }
    async manualSync() {
        await this.syncExchangeRates();
        return { success: true, message: 'Exchange rates synced successfully' };
    }
    async createManualRate(buyRate, sellRate, toCurrency = 'SAR') {
        await this.prisma.exchangeRate.updateMany({
            where: { isActive: true, toCurrency },
            data: { isActive: false },
        });
        const rate = await this.prisma.exchangeRate.create({
            data: {
                fromCurrency: 'IDR',
                toCurrency,
                buyRate,
                sellRate,
                midRate: (buyRate + sellRate) / 2,
                source: 'MANUAL',
                isActive: true,
            },
        });
        return rate;
    }
};
exports.ExchangeRateService = ExchangeRateService;
__decorate([
    (0, schedule_1.Cron)('0 */30 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ExchangeRateService.prototype, "syncExchangeRates", null);
exports.ExchangeRateService = ExchangeRateService = ExchangeRateService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_1.PrismaService,
        config_1.ConfigService])
], ExchangeRateService);
//# sourceMappingURL=exchange-rate.service.js.map