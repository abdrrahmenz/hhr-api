# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Copy prisma schema and generate client
COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN npx prisma generate

# Copy all source files
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src/

# Build the application
RUN npm run build || (echo "Build failed" && exit 1)

# Verify build output exists and show structure
RUN ls -la dist/ && ls -la dist/main.js || (echo "main.js not found in dist" && exit 1)

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy prisma files for client
COPY prisma ./prisma/
COPY prisma.config.ts ./

# Re-generate Prisma client in production context
RUN npx prisma generate

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Verify dist exists
RUN ls -la dist/

# Expose port
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production

# Start the application
CMD ["node", "dist/main.js"]
