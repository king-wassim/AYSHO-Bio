# Environment Configuration Guide

## Overview

All configuration uses environment variables. Never commit secrets to Git.

### File Structure
```
backend/
├── .env.example          # Template (committed)
├── .env.development      # Local dev (gitignored)
├── .env.production       # Prod template (gitignored)
└── .env.test             # Test env (gitignored)

frontend/
├── .env.example          # Template (committed)
├── .env.development      # Local dev (gitignored)
└── .env.production       # Prod template (gitignored)
```

---

## Backend Variables (`backend/.env.example`)

### Required for All Environments
```bash
# Application
NODE_ENV=development|production|test
APP_KEYS=key1,key2,key3,key4          # 4+ random strings (32+ chars each)
API_TOKEN_SALT=random-string          # For API token hashing
ADMIN_JWT_SECRET=random-string        # Admin panel JWT
JWT_SECRET=random-string              # User JWT
TRANSFER_TOKEN_SALT=random-string     # Data transfer

# Database
DATABASE_CLIENT=postgres
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require

# Server
HOST=0.0.0.0
PORT=1337
```

### Required for Production
```bash
# Frontend URL (for CORS, webhooks)
FRONTEND_URL=https://aysho.com

# Cloudinary (Media)
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=1234567890
CLOUDINARY_API_SECRET=abcdefghijklmnop

# Email (Nodemailer)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxx
SMTP_FROM=noreply@aysho.com
SMTP_REPLY_TO=support@aysho.com

# Sentry (Error Tracking)
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_ENVIRONMENT=production

# Redis (Future: sessions, cache)
REDIS_URL=redis://user:pass@host:6379
```

### Optional
```bash
# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=900000

# Body Parser Limits
BODY_LIMIT=10mb

# Log Level
LOG_LEVEL=info

# Feature Flags
ENABLE_GRAPHQL=true
ENABLE_DOCUMENTATION=false
```

---

## Frontend Variables (`frontend/.env.example`)

### Required for All Environments
```bash
# API Base URL
VITE_API_URL=http://localhost:1337/api

# App Info
VITE_APP_NAME=AYSHO
VITE_APP_URL=http://localhost:5173
```

### Production Only
```bash
# API URL (production backend)
VITE_API_URL=https://api.aysho.com/api

# Analytics
VITE_GA_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx

# Feature Flags
VITE_ENABLE_PWA=true
VITE_ENABLE_ANALYTICS=true
```

---

## GitHub Repository Secrets

### Required (Settings → Secrets → Actions)

| Secret | Description | Example |
|--------|-------------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://...` |
| `APP_KEYS` | 4 comma-separated 32-char keys | `key1,key2,key3,key4` |
| `API_TOKEN_SALT` | Random string | `abc123...` |
| `ADMIN_JWT_SECRET` | Random string | `def456...` |
| `JWT_SECRET` | Random string | `ghi789...` |
| `TRANSFER_TOKEN_SALT` | Random string | `jkl012...` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `mycloud` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `1234567890` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `abcdef...` |
| `FRONTEND_URL` | Production frontend URL | `https://aysho.com` |
| `SMTP_HOST` | SMTP server | `smtp.sendgrid.net` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | `apikey` |
| `SMTP_PASS` | SMTP password | `SG.xxx` |
| `SENTRY_DSN` | Sentry DSN | `https://xxx@sentry.io/xxx` |

### Cloudflare Pages (Dashboard → Settings → Environment Variables)

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://api.aysho.com/api` |
| `VITE_APP_NAME` | `AYSHO` |
| `VITE_APP_URL` | `https://aysho.com` |

### Render (Dashboard → Environment)

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `postgresql://...` |
| `APP_KEYS` | `key1,key2,key3,key4` |
| `API_TOKEN_SALT` | `random` |
| `ADMIN_JWT_SECRET` | `random` |
| `JWT_SECRET` | `random` |
| `TRANSFER_TOKEN_SALT` | `random` |
| `CLOUDINARY_CLOUD_NAME` | `mycloud` |
| `CLOUDINARY_API_KEY` | `1234567890` |
| `CLOUDINARY_API_SECRET` | `abcdef...` |
| `FRONTEND_URL` | `https://aysho.com` |
| `SMTP_HOST` | `smtp.sendgrid.net` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `apikey` |
| `SMTP_PASS` | `SG.xxx` |
| `SENTRY_DSN` | `https://xxx@sentry.io/xxx` |
| `PORT` | `1337` |
| `HOST` | `0.0.0.0` |

---

## Generating Secrets

### Secure Random Strings
```bash
# 32-character base64 (for JWT secrets)
openssl rand -base64 32

# 64-character hex (for APP_KEYS)
openssl rand -hex 32

# Multiple keys for APP_KEYS
for i in {1..4}; do openssl rand -hex 32; done | paste -sd, -
```

### One-Liner for All Secrets
```bash
cat <<EOF > .env.production.generated
# Generated $(date)
NODE_ENV=production
APP_KEYS=$(for i in {1..4}; do openssl rand -hex 32; done | paste -sd, -)
API_TOKEN_SALT=$(openssl rand -base64 32)
ADMIN_JWT_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
TRANSFER_TOKEN_SALT=$(openssl rand -base64 32)
EOF
cat .env.production.generated
```

---

## Environment-Specific Configurations

### Development (`.env.development`)
```bash
NODE_ENV=development
DATABASE_CLIENT=better-sqlite3
DATABASE_FILENAME=.tmp/data.db
HOST=0.0.0.0
PORT=1337
FRONTEND_URL=http://localhost:5173
LOG_LEVEL=debug
```

### Production (`.env.production` - Template)
```bash
NODE_ENV=production
DATABASE_CLIENT=postgres
DATABASE_URL=${DATABASE_URL}
HOST=0.0.0.0
PORT=1337
FRONTEND_URL=https://aysho.com
LOG_LEVEL=info
```

### Test (`.env.test`)
```bash
NODE_ENV=test
DATABASE_CLIENT=better-sqlite3
DATABASE_FILENAME=.tmp/test.db
JWT_SECRET=test-secret
ADMIN_JWT_SECRET=test-admin-secret
```

---

## Validation

### Startup Validation (Strapi)
Strapi validates required env vars on startup. Missing vars → crash with clear error.

### Custom Validation (`backend/config/server.ts`)
```typescript
const required = [
  'DATABASE_URL',
  'APP_KEYS',
  'JWT_SECRET',
  'ADMIN_JWT_SECRET',
  'API_TOKEN_SALT',
  'TRANSFER_TOKEN_SALT',
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required env var: ${key}`);
  }
}
```

---

## Security Best Practices

1. **Never commit `.env*` files** (except `.env.example`)
2. **Use different secrets per environment**
3. **Rotate secrets quarterly**
4. **Use secret managers** (GitHub, Render, Cloudflare)
5. **Audit with `git secrets` or `truffleHog`**
6. **Minimum secret length: 32 chars**
7. **No shared secrets between services**

---

## Troubleshooting

### "Missing required env var"
- Check spelling (case-sensitive)
- Verify in correct environment (GitHub/Render/Cloudflare)
- Restart service after adding

### "Invalid DATABASE_URL"
- Must include `?sslmode=require` for Neon
- Format: `postgresql://user:pass@host/db?sslmode=require`
- Test: `psql "$DATABASE_URL" -c "SELECT 1"`

### CORS Errors
- `FRONTEND_URL` must match exactly (no trailing slash)
- Include all preview URLs in development

### JWT Errors
- `APP_KEYS` must have 4+ keys
- All JWT secrets must be 32+ chars
- Rotate all at once (invalidates existing tokens)