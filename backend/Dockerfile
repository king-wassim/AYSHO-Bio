# Backend Dockerfile - Multi-stage build for Strapi v5
# Stage 1: Base dependencies
FROM node:22-alpine AS base

RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

# Install system dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    vips-dev

# Copy package files
COPY package*.json pnpm-lock.yaml ./

# Stage 2: Builder - Install all dependencies and build
FROM base AS builder

# Install all dependencies (including devDependencies)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build Strapi admin panel and application
RUN pnpm run build

# Stage 3: Production dependencies only
FROM base AS production-deps

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile \
    && pnpm store prune

# Stage 4: Production runtime
FROM node:22-alpine AS production

RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    vips \
    curl \
    && addgroup -g 1000 -S nodejs \
    && adduser -S strapi -u 1000 -G nodejs

# Copy production dependencies
COPY --from=production-deps --chown=strapi:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=strapi:nodejs /app/dist ./dist
COPY --from=builder --chown=strapi:nodejs /app/package.json ./package.json
COPY --from=builder --chown=strapi:nodejs /app/config ./config
COPY --from=builder --chown=strapi:nodejs /app/src ./src
COPY --from=builder --chown=strapi:nodejs /app/public ./public
COPY --from=builder --chown=strapi:nodejs /app/node_modules/.pnpm ./node_modules/.pnpm
COPY --from=builder --chown=strapi:nodejs /app/node_modules/.modules.yaml ./node_modules/.modules.yaml

# Create necessary directories
RUN mkdir -p .tmp public/uploads \
    && chown -R strapi:nodejs .tmp public/uploads

# Switch to non-root user
USER strapi

# Expose port
EXPOSE 1337

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:1337/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start Strapi
CMD ["pnpm", "start"]