# Multi-stage build for OGZ Prime Trading Bot
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Production stage
FROM node:18-alpine

# Install PM2 globally
RUN npm install pm2 -g

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built application
COPY --from=builder /app .

# Create volume for persistent data
VOLUME ["/app/data"]

# Expose ports
EXPOSE 3010 3011 3012 3013 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3010/health', (r) => {r.statusCode === 200 ? process.exit(0) : process.exit(1)})"

# Start with PM2 runtime
CMD ["pm2-runtime", "start", "ecosystem.config.js"]