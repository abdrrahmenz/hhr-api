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
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const bcrypt = __importStar(require("bcrypt"));
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('🌱 Seeding database...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@hhr.com' },
        update: {},
        create: {
            email: 'admin@hhr.com',
            password: adminPassword,
            name: 'System Admin',
            role: client_1.UserRole.ADMIN,
        },
    });
    console.log(`✅ Admin user created: ${admin.email}`);
    const organization = await prisma.organization.upsert({
        where: { code: 'TRAVEL-001' },
        update: {},
        create: {
            name: 'Sample Travel Agency',
            code: 'TRAVEL-001',
            address: 'Jl. Sample No. 123',
            phone: '+62812345678',
            email: 'contact@sampletravelagency.com',
            markupType: 'PERCENTAGE',
            markupValue: 5,
        },
    });
    console.log(`✅ Organization created: ${organization.name}`);
    const b2bPassword = await bcrypt.hash('b2b123', 10);
    const b2bUser = await prisma.user.upsert({
        where: { email: 'agent@sampletravelagency.com' },
        update: {},
        create: {
            email: 'agent@sampletravelagency.com',
            password: b2bPassword,
            name: 'Travel Agent',
            role: client_1.UserRole.B2B,
            organizationId: organization.id,
        },
    });
    console.log(`✅ B2B user created: ${b2bUser.email}`);
    const b2cPassword = await bcrypt.hash('user123', 10);
    const b2cUser = await prisma.user.upsert({
        where: { email: 'customer@example.com' },
        update: {},
        create: {
            email: 'customer@example.com',
            password: b2cPassword,
            name: 'Test Customer',
            role: client_1.UserRole.B2C,
        },
    });
    console.log(`✅ B2C user created: ${b2cUser.email}`);
    const exchangeRate = await prisma.exchangeRate.create({
        data: {
            fromCurrency: 'IDR',
            toCurrency: 'SAR',
            buyRate: 4200,
            sellRate: 4250,
            midRate: 4225,
            source: 'SEED',
            isActive: true,
        },
    });
    console.log(`✅ Exchange rate created: 1 SAR = ${exchangeRate.sellRate} IDR`);
    console.log('');
    console.log('🎉 Database seeded successfully!');
    console.log('');
    console.log('📝 Test Credentials:');
    console.log('   Admin: admin@hhr.com / admin123');
    console.log('   B2B:   agent@sampletravelagency.com / b2b123');
    console.log('   B2C:   customer@example.com / user123');
}
main()
    .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
});
//# sourceMappingURL=seed.js.map