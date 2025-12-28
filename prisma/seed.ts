import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';

// Prisma v7 requires adapter for direct database connection
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Seeding database...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@hhr.com' },
        update: {},
        create: {
            email: 'admin@hhr.com',
            password: adminPassword,
            name: 'System Admin',
            role: UserRole.ADMIN,
        },
    });
    console.log(`✅ Admin user created: ${admin.email}`);

    // Create sample B2B organization
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
            markupValue: 5, // 5% markup
        },
    });
    console.log(`✅ Organization created: ${organization.name}`);

    // Create B2B user
    const b2bPassword = await bcrypt.hash('b2b123', 10);
    const b2bUser = await prisma.user.upsert({
        where: { email: 'agent@sampletravelagency.com' },
        update: {},
        create: {
            email: 'agent@sampletravelagency.com',
            password: b2bPassword,
            name: 'Travel Agent',
            role: UserRole.B2B,
            organizationId: organization.id,
        },
    });
    console.log(`✅ B2B user created: ${b2bUser.email}`);

    // Create B2C user
    const b2cPassword = await bcrypt.hash('user123', 10);
    const b2cUser = await prisma.user.upsert({
        where: { email: 'customer@example.com' },
        update: {},
        create: {
            email: 'customer@example.com',
            password: b2cPassword,
            name: 'Test Customer',
            role: UserRole.B2C,
        },
    });
    console.log(`✅ B2C user created: ${b2cUser.email}`);

    // Create initial exchange rate
    const exchangeRate = await prisma.exchangeRate.create({
        data: {
            fromCurrency: 'IDR',
            toCurrency: 'SAR',
            buyRate: 4200, // Approx IDR per SAR
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
