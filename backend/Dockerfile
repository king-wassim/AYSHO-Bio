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
RUN pnpm install --no-frozen-lockfile

# Copy source code
COPY . .

# Build Strapi admin panel and application
RUN pnpm run build

# Stage 3: Production dependencies only
FROM base AS production-deps

# Install only production dependencies
RUN pnpm install --prod --no-frozen-lockfile \
    && pnpm store prune

# Stage 4: Production runtime
FROM node:22-alpine AS production

RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    vips \
    curl \
    && addgroup -S strapi \
    && adduser -S strapi -G strapi

# Copy production dependencies
COPY --from=production-deps --chown=strapi:strapi /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=strapi:strapi /app/dist ./dist
COPY --from=builder --chown=strapi:strapi /app/package.json ./package.json
COPY --from=builder --chown=strapi:strapi /app/dist/config ./config
COPY --from=builder --chown=strapi:strapi /app/dist/src ./src
COPY --from=builder --chown=strapi:strapi /app/public ./public
COPY --from=builder --chown=strapi:strapi /app/node_modules/.pnpm ./node_modules/.pnpm
COPY --from=builder --chown=strapi:strapi /app/node_modules/.modules.yaml ./node_modules/.modules.yaml

# Strapi serves the generated admin entrypoint from its package runtime path.
RUN admin_dir="$(find node_modules/.pnpm -type d -path '*/node_modules/@strapi/admin' | head -n 1)" \
    && mkdir -p "$admin_dir/dist/server/server/build" \
    && cp -R dist/build/. "$admin_dir/dist/server/server/build/"

# Create necessary directories
RUN mkdir -p database/migrations .tmp public/uploads \
    && chown -R strapi:strapi database .tmp public/uploads

# Switch to non-root user
USER strapi

# Expose port
EXPOSE 1337

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:1337/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start Strapi
CMD ["node", "node_modules/@strapi/strapi/bin/strapi.js", "start"]