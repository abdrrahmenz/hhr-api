"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exchangeRateConfig = exports.xenditConfig = exports.otaConfig = exports.jwtConfig = exports.appConfig = void 0;
var app_config_1 = require("./app.config");
Object.defineProperty(exports, "appConfig", { enumerable: true, get: function () { return __importDefault(app_config_1).default; } });
var jwt_config_1 = require("./jwt.config");
Object.defineProperty(exports, "jwtConfig", { enumerable: true, get: function () { return __importDefault(jwt_config_1).default; } });
var ota_config_1 = require("./ota.config");
Object.defineProperty(exports, "otaConfig", { enumerable: true, get: function () { return __importDefault(ota_config_1).default; } });
var xendit_config_1 = require("./xendit.config");
Object.defineProperty(exports, "xenditConfig", { enumerable: true, get: function () { return __importDefault(xendit_config_1).default; } });
var exchange_rate_config_1 = require("./exchange-rate.config");
Object.defineProperty(exports, "exchangeRateConfig", { enumerable: true, get: function () { return __importDefault(exchange_rate_config_1).default; } });
//# sourceMappingURL=index.js.map