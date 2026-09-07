# Frontend Dockerfile - Multi-stage build
# Stage 1: Builder
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

# Copy package files
COPY package*.json pnpm-lock.yaml ./

# Install dependencies with cache
RUN pnpm install --no-frozen-lockfile --prefer-offline

# Copy source code
COPY . .

# Build arguments for environment variables
ARG VITE_STRAPI_URL
ARG VITE_CLOUDINARY_CLOUD_NAME
ARG VITE_SENTRY_DSN

ENV VITE_STRAPI_URL=${VITE_STRAPI_URL}
ENV VITE_CLOUDINARY_CLOUD_NAME=${VITE_CLOUDINARY_CLOUD_NAME}
ENV VITE_SENTRY_DSN=${VITE_SENTRY_DSN}

# Build for production
RUN pnpm run build

# Stage 2: Production - Nginx
FROM nginx:alpine AS production

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Add health check endpoint
RUN apk add --no-cache openssl && echo 'server { listen 80; location /health { return 200 "healthy\n"; add_header Content-Type text/plain; } }' > /etc/nginx/conf.d/health.conf

# TLS bootstrap entrypoint (placeholder cert until certbot issues the real one)
COPY entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose port
EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]