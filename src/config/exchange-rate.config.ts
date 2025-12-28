import { registerAs } from '@nestjs/config';

export default registerAs('exchangeRate', () => ({
    scrapeUrl: process.env.EXCHANGE_RATE_SCRAPE_URL || 'https://www.bankmandiri.co.id/kurs',
    cron: process.env.EXCHANGE_RATE_CRON || '0 */30 * * * *',
}));
