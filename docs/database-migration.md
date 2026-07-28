# Database Migration Guide

## Overview

This guide covers migrating from SQLite (Strapi v5 default) to Neon PostgreSQL for production.

### Migration Strategy
1. **Schema**: Strapi handles via `db:push` / `db:migrate`
2. **Data**: Custom script for SQLite → PostgreSQL
3. **Media**: Cloudinary (no migration needed - fresh uploads)
4. **Secrets**: New secrets for production

---

## Pre-Migration Checklist

- [ ] Neon project created
- [ ] Database branch for production (`main`)
- [ ] Connection string with `sslmode=require`
- [ ] Backend `.env.production` configured
- [ ] Cloudinary credentials set
- [ ] GitHub Actions secrets configured
- [ ] Local backup of SQLite (`.tmp/data.db`)

---

## Step 1: Schema Migration (Automatic)

### On First Deploy
Render runs `strapi db:push` on startup (configured in `docker-compose.production.yml`):

```bash
# This creates all tables in Neon
pnpm run db:push
```

### For Subsequent Deploys
Use `db:migrate` for incremental changes:

```bash
# Generate migration from schema changes
pnpm run db:generate

# Apply migrations
pnpm run db:migrate
```

### Verify Schema
```bash
# Connect to Neon and verify
psql "postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require"

# List tables
\dt

# Check Strapi tables
\dt strapi_*
\dt up_*
```

---

## Step 2: Data Migration (SQLite → PostgreSQL)

### Prerequisites
```bash
# Install migration dependencies
cd backend
pnpm add @neondatabase/serverless drizzle-orm better-sqlite3 dotenv
pnpm add -D @types/better-sqlite3
```

### Run Migration Script
```bash
# 1. Ensure local SQLite exists (run strapi develop once)
cd backend && pnpm run dev
# Ctrl+C after admin panel loads

# 2. Set production DATABASE_URL
export DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require"

# 3. Run migration
node scripts/migrate-sqlite-to-neon.js
```

### Migration Script Details (`scripts/migrate-sqlite-to-neon.js`)
- Reads all tables from SQLite (`.tmp/data.db`)
- Skips internal tables (`sqlite_%`, `_%`)
- Inserts in batches of 100 rows
- Uses `ON CONFLICT DO NOTHING` for idempotency
- Preserves IDs, timestamps, relations

### Verify Data
```sql
-- Check row counts match
SELECT 'strapi_users' as table_name, COUNT(*) FROM strapi_users
UNION ALL
SELECT 'up_products', COUNT(*) FROM up_products
UNION ALL
SELECT 'upload_file', COUNT(*) FROM upload_file;
```

---

## Step 3: Production Seeding

### Run Seed Script
```bash
# Set required env vars
export DATABASE_URL="postgresql://..."
export ADMIN_EMAIL="admin@aysho.com"
export ADMIN_PASSWORD="secure-password"
export CLOUDINARY_CLOUD_NAME="xxx"
export CLOUDINARY_API_KEY="xxx"
export CLOUDINARY_API_SECRET="xxx"

node scripts/seed-production.js
```

### Seed Script Creates (`scripts/seed-production.js`)
1. **Admin user** (super-admin role)
2. **API tokens** for services (Cloudflare, Cloudinary, Sentry)
3. **Cloudinary plugin config**
4. **Email plugin config** (if SMTP set)
5. **Public permissions** for API access

### Save Credentials!
```
✅ Admin user created: admin@aysho.com
🔑 Password: xK9mP2qR5vL8nW3z
⚠️  SAVE THIS PASSWORD! It will not be shown again.
```

---

## Step 4: Media Migration (Optional)

### If You Have Existing Uploads
Since Cloudinary is new storage, you have options:

#### Option A: Fresh Start (Recommended)
- Re-upload images via admin panel
- Cloudinary optimizes automatically
- Clean slate, no migration complexity

#### Option B: Bulk Import
```bash
# 1. Export from SQLite
# 2. Upload to Cloudinary via API
# 3. Update Strapi upload_file records
```

#### Option C: Hybrid
- Keep old images on Cloudinary (if previously used)
- New uploads go to new Cloudinary account

---

## Step 5: Verify Production

### Health Checks
```bash
# Backend health
curl https://aysho-backend.onrender.com/api/health
# {"status":"ok","database":"connected","timestamp":"..."}

# Readiness
curl https://aysho-backend.onrender.com/api/health/ready
# {"status":"ready","migrations":"current"}

# Frontend
curl -I https://aysho.pages.dev
# HTTP/2 200, cache headers
```

### Admin Panel
1. Visit `https://aysho-backend.onrender.com/admin`
2. Login with seeded credentials
3. Verify content types accessible
4. Test image upload → Cloudinary

### API Tests
```bash
# Public products
curl https://aysho-backend.onrender.com/api/products

# Authenticated
curl -H "Authorization: Bearer <token>" \
  https://aysho-backend.onrender.com/api/users/me
```

---

## Rollback Procedure

### If Migration Fails
```bash
# 1. Neon: Create new branch from pre-migration state
# 2. Update DATABASE_URL to new branch
# 3. Re-run migration

# Or: Point-in-time restore
# Neon Console → Branches → Restore to timestamp
```

### If Data Corrupted
```bash
# 1. Neon PITR to before migration
# 2. Or: Drop tables, re-run db:push + migration
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
pnpm run db:push
node scripts/migrate-sqlite-to-neon.js
```

---

## Preview Environments (Neon Branching)

### Automatic (GitHub Actions)
Each PR gets:
1. Neon preview branch (auto-created)
2. Unique `DATABASE_URL` for preview
3. Render preview service (if configured)
4. Cloudflare Pages preview URL

### Manual Preview Branch
```bash
# Create branch for testing
# Neon Console → Branches → New Branch → "staging"

# Use branch connection string
DATABASE_URL="postgresql://user@ep-staging.neon.tech/db?sslmode=require"
```

---

## Migration Checklist

### Pre-Deploy
- [ ] Neon project created
- [ ] Production branch ready
- [ ] Connection string tested
- [ ] `.env.production` complete
- [ ] GitHub secrets set
- [ ] Local SQLite backup

### Deploy
- [ ] Push to main triggers CD
- [ ] Render builds Docker image
- [ ] `db:push` runs on startup
- [ ] Service becomes healthy

### Post-Deploy
- [ ] Run data migration script
- [ ] Run production seed script
- [ ] Verify admin login
- [ ] Test API endpoints
- [ ] Test image upload
- [ ] Configure Cloudinary webhook
- [ ] Set up monitoring alerts

### Go-Live
- [ ] Custom domain configured
- [ ] DNS propagated
- [ ] SSL active
- [ ] Smoke tests pass
- [ ] Team notified

---

## Troubleshooting

### "relation does not exist"
- Run `pnpm run db:push` first
- Check migration order

### "duplicate key value violates unique constraint"
- Migration already ran
- Use `ON CONFLICT DO NOTHING` in script

### "connection terminated unexpectedly"
- Neon auto-suspend (free tier)
- First query wakes it up (5-10s delay)
- Increase health check timeout

### "SSL connection required"
- Add `?sslmode=require` to DATABASE_URL
- Neon requires SSL

### "permission denied for schema public"
- Neon uses `public` schema
- Ensure user has CREATE privileges
- Default Neon user has full access

---

## Migration Scripts Reference

### `scripts/migrate-sqlite-to-neon.js`
```javascript
// Usage
DATABASE_URL="postgresql://..." node scripts/migrate-sqlite-to-neon.js

// Features
- Batch inserts (100 rows)
- Idempotent (ON CONFLICT DO NOTHING)
- Progress logging
- Error handling
```

### `scripts/seed-production.js`
```javascript
// Usage
NODE_ENV=production DATABASE_URL="..." \
  ADMIN_EMAIL=admin@aysho.com \
  ADMIN_PASSWORD=secure \
  CLOUDINARY_CLOUD_NAME=xxx \
  CLOUDINARY_API_KEY=xxx \
  CLOUDINARY_API_SECRET=xxx \
  node scripts/seed-production.js

// Creates
- Admin user (super-admin)
- API tokens (4 service tokens)
- Cloudinary config
- Email config (if SMTP)
- Public permissions
```

---

## Advanced: Zero-Downtime Migrations

### For Schema Changes
```bash
# 1. Generate migration
pnpm run db:generate

# 2. Review generated SQL
cat database/migrations/xxx.sql

# 3. Deploy with migration
# Render runs db:migrate on startup
```

### For Data Migrations
```bash
# Create custom migration
# database/migrations/xxx_seed_data.js

// Export up/down functions
module.exports = {
  up: async (knex) => { /* ... */ },
  down: async (knex) => { /* ... */ },
};
```

### Backward Compatibility
- Add columns (not remove) in migrations
- Keep old API versions
- Feature flags for new functionality