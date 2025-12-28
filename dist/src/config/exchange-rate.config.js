"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('exchangeRate', () => ({
    scrapeUrl: process.env.EXCHANGE_RATE_SCRAPE_URL || 'https://www.bankmandiri.co.id/kurs',
    cron: process.env.EXCHANGE_RATE_CRON || '0 */30 * * * *',
}));
//# sourceMappingURL=exchange-rate.config.js.map