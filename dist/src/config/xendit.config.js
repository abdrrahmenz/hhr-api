"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('xendit', () => ({
    secretKey: process.env.XENDIT_SECRET_KEY,
    webhookToken: process.env.XENDIT_WEBHOOK_TOKEN,
    callbackUrl: process.env.XENDIT_CALLBACK_URL,
}));
//# sourceMappingURL=xendit.config.js.map