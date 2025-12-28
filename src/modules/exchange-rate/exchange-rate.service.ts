import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import * as cheerio from 'cheerio';
import axios from 'axios';
import { PrismaService } from '../../prisma';

interface ExchangeRateData {
    currency: string;
    buyRate: number;
    sellRate: number;
}

@Injectable()
export class ExchangeRateService {
    private readonly logger = new Logger(ExchangeRateService.name);
    private scrapeUrl: string;

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) {
        this.scrapeUrl = this.configService.get<string>('exchangeRate.scrapeUrl') || 'https://www.bankmandiri.co.id/kurs';
    }

    @Cron('0 */30 * * * *') // Every 30 minutes
    async syncExchangeRates() {
        this.logger.log('Starting exchange rate sync...');

        try {
            const rates = await this.scrapeRates();
            const sarRate = rates.find(r => r.currency === 'SAR');

            if (sarRate) {
                // Deactivate old rates
                await this.prisma.exchangeRate.updateMany({
                    where: { isActive: true, toCurrency: 'SAR' },
                    data: { isActive: false },
                });

                // Create new rate
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
            } else {
                this.logger.warn('SAR rate not found in scraped data');
            }
        } catch (error) {
            this.logger.error('Failed to sync exchange rates', error);
        }
    }

    async scrapeRates(): Promise<ExchangeRateData[]> {
        try {
            // Fetch the page with proper headers
            const response = await axios.get(this.scrapeUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml',
                    'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
                },
                timeout: 30000,
            });

            const $ = cheerio.load(response.data);
            const rates: ExchangeRateData[] = [];

            // Bank Mandiri kurs table structure - adjust selectors as needed
            // The exact selectors depend on the current page structure
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

            // Fallback: Try alternate structure
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
        } catch (error) {
            this.logger.error('Scraping failed', error);
            throw error;
        }
    }

    private parseRate(value: string): number {
        // Remove non-numeric characters except decimal point/comma
        const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    }

    async getCurrentRate(toCurrency: string = 'SAR') {
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

    async getRateHistory(toCurrency: string = 'SAR', limit: number = 50) {
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

    // Fallback: Create manual rate entry
    async createManualRate(buyRate: number, sellRate: number, toCurrency: string = 'SAR') {
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
}
