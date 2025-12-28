# Easypanel Deployment Guide

## Method 1: Deploy from GitHub (Recommended)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/tickecting-hhr.git
git push -u origin main
```

### Step 2: Create PostgreSQL Service in Easypanel
1. Go to your Easypanel dashboard
2. Click **Create Service** → **Postgres**
3. Name: `hhr-postgres`
4. Note the connection details

### Step 3: Create App Service
1. Click **Create Service** → **App**
2. Select **GitHub** as source
3. Connect your GitHub account
4. Select the `tickecting-hhr` repository
5. Build settings:
   - **Build Command**: `npm ci && npx prisma generate && npm run build`
   - **Start Command**: `node dist/main.js`
   - **Port**: `3000`

### Step 4: Add Environment Variables
In Easypanel, add these environment variables:

```
NODE_ENV=production
APP_PORT=3000

# Database (use Easypanel Postgres connection)
DATABASE_URL=postgresql://postgres:PASSWORD@hhr-postgres.internal:5432/postgres?schema=public

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# Go7 WorldTicket OTA API
OTA_BASE_URL=https://api.go7worldticket.com
OTA_API_KEY=your-go7-api-key
OTA_TENANT=your-tenant
OTA_AGENT_ID=your-agent-id
OTA_AGENT_NAME=your-agent-name
OTA_CLIENT_SECRET=your-client-secret
OTA_USERNAME=your-username
OTA_PASSWORD=your-password

# Xendit
XENDIT_SECRET_KEY=xnd_production_your_secret_key
XENDIT_WEBHOOK_TOKEN=your-webhook-verification-token
XENDIT_CALLBACK_URL=https://your-domain.com/api/payment/webhook

# Exchange Rate
EXCHANGE_RATE_SCRAPE_URL=https://www.bankmandiri.co.id/kurs
```

### Step 5: Setup Database
After deployment, go to **Terminal** in Easypanel and run:
```bash
npx prisma db push
npx prisma db seed
```

### Step 6: Configure Domain
1. Go to **Domains** in your app settings
2. Add your domain (e.g., `api.yourdomain.com`)
3. Easypanel will auto-configure SSL

---

## Method 2: Deploy via Dockerfile

### Step 1: Create Postgres in Easypanel
Same as above

### Step 2: Create App from Dockerfile
1. Click **Create Service** → **App**
2. Select **GitHub** as source
3. Enable **Use Dockerfile** option
4. Easypanel will use the `Dockerfile` in your repo

### Step 3: Add Environment Variables
Same as Method 1

---

## Quick Reference

| Setting | Value |
|---------|-------|
| Build Command | `npm ci && npx prisma generate && npm run build` |
| Start Command | `node dist/main.js` |
| Port | `3000` |
| Health Check | `/api` |

---

## Troubleshooting

### Database Connection Error
- Use `hhr-postgres.internal` as database host (Easypanel internal DNS)
- Check the DATABASE_URL format

### Build Fails
- Ensure all dependencies in `package.json`
- Check Prisma schema is valid

### App Not Starting
- Check environment variables are set
- View logs in Easypanel dashboard
