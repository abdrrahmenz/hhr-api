# HHR Ticketing MVP

A NestJS backend for train ticketing integrating:
- **Go7 WorldTicket OTA API** - Train reservation system
- **Xendit QRIS** - Indonesian QR payment
- **Bank Mandiri** - IDR/SAR exchange rate scraping

## Quick Start

```bash
# 1. Copy environment variables
cp .env.example .env

# 2. Update .env with your credentials
# - DATABASE_URL (PostgreSQL)
# - OTA_* (Go7 WorldTicket credentials)
# - XENDIT_* (Xendit credentials)

# 3. Setup database
npm run db:setup

# 4. Start development server
npm run start:dev
```

## API Documentation

Access Swagger UI at: `http://localhost:3000/api`

## Test Credentials (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@hhr.com | admin123 |
| B2B | agent@sampletravelagency.com | b2b123 |
| B2C | customer@example.com | user123 |

## Features

### Authentication
- JWT-based auth with role guards (ADMIN, B2B, B2C)
- Registration, login, profile endpoints

### Train Booking (OTA)
- Route search
- Low fare search (one-way/round-trip)
- Create, read, cancel bookings
- Ticket download

### Payments
- QRIS code generation via Xendit
- Webhook handling
- Payment status tracking
- Refunds (Admin only)

### Exchange Rates
- Auto-scrape Bank Mandiri every 30 minutes
- Manual sync endpoint
- Rate history

### Admin Panel
- User management (CRUD)
- Organization management (B2B markup settings)
- Statistics endpoints

## Project Structure

```
src/
├── config/          # Environment configuration
├── common/          # Guards, decorators
├── prisma/          # Database service
└── modules/
    ├── auth/        # JWT authentication
    ├── ota/         # Go7 WorldTicket integration
    ├── payment/     # Xendit QRIS
    ├── exchange-rate/# Bank Mandiri scraping
    ├── users/       # User management
    └── organizations/# B2B management
```

## Scripts

```bash
npm run start:dev     # Development
npm run build         # Build
npm run prisma:push   # Sync schema to DB
npm run prisma:seed   # Seed test data
```
