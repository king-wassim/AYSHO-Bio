# Deployment Guide

## Prerequisites

### Accounts Required
- [ ] GitHub account
- [ ] Cloudflare account (Pages)
- [ ] Render account (Web Service)
- [ ] Neon account (PostgreSQL)
- [ ] Cloudinary account (Media)

### Local Tools
- Node.js 20+
- Docker Desktop
- Git
- pnpm (recommended) or npm

---

## 1. Initial Setup

### Clone and Configure
```bash
git clone https://github.com/your-org/aysho.git
cd aysho

# Copy environment templates
cp backend/.env.example backend/.env.development
cp frontend/.env.example frontend/.env.development
```

### Install Dependencies
```bash
# Frontend
cd frontend && pnpm install && cd ..

# Backend
cd backend && pnpm install && cd ..
```

### Start Development
```bash
# Terminal 1: Backend (SQLite)
cd backend && pnpm run dev

# Terminal 2: Frontend
cd frontend && pnpm run dev
```

Access:
- Frontend: http://localhost:5173
- Backend: http://localhost:1337/admin

---

## 2. Cloudflare Pages Setup

### Create Project
1. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
2. Connect GitHub repo
3. Configure build:
   - **Build command**: `cd frontend && pnpm run build`
   - **Output directory**: `frontend/dist`
   - **Root directory**: `/` (repo root)
4. Add environment variables (see below)

### Environment Variables (Cloudflare Pages)
```
VITE_API_URL=https://your-backend.onrender.com
VITE_APP_NAME=AYSHO
VITE_APP_URL=https://aysho.pages.dev
```

### Custom Domain (Optional)
1. Pages > Custom domains > Add domain
2. Add CNAME: `www` → `aysho.pages.dev`
3. Add CNAME: `@` → `aysho.pages.dev` (or A/AAAA for apex)

---

## 3. Neon PostgreSQL Setup

### Create Database
1. Go to [Neon Console](https://console.neon.tech/)
2. Create project: `aysho-db`
3. Copy connection string: `postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require`

### Configure Branching (Preview Environments)
1. Create branch: `preview` (from `main`)
2. Each PR gets automatic branch
3. Connection string per branch

---

## 4. Render Backend Setup

### Create Web Service
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. New > Web Service > Connect GitHub
3. Configure:
   - **Name**: `aysho-backend`
   - **Region**: Oregon (US West) or Frankfurt (EU)
   - **Branch**: `main`
   - **Runtime**: Docker
   - **Dockerfile Path**: `backend/Dockerfile`
   - **Plan**: Free

### Environment Variables (Render)
```bash
# Required
NODE_ENV=production
DATABASE_URL=postgresql://... (from Neon)
JWT_SECRET=<generate: openssl rand -base64 32>
ADMIN_JWT_SECRET=<generate: openssl rand -base64 32>
API_TOKEN_SALT=<generate: openssl rand -base64 32>
TRANSFER_TOKEN_SALT=<generate: openssl rand -base64 32>
ENCRYPTION_KEY=<generate: openssl rand -base64 32>

# Cloudinary (required for uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Frontend URL (for CORS)
FRONTEND_URL=https://aysho.pages.dev

# Optional
SENTRY_DSN=https://xxx@sentry.io/xxx
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=noreply@aysho.com
ADMIN_EMAIL=admin@aysho.com
ADMIN_PASSWORD=secure-password
```

### Health Check
- **Path**: `/api/health`
- **Interval**: 30s
- **Timeout**: 10s

---

## 5. Cloudinary Setup

### Create Account
1. Go to [Cloudinary](https://cloudinary.com/)
2. Create account, note credentials

### Configure Upload Preset (Optional)
1. Settings > Upload > Upload presets
2. Create unsigned preset for direct client uploads
3. Add to frontend `.env`

### Webhook for Strapi
1. Settings > Webhooks > Add webhook
2. URL: `https://your-backend.onrender.com/api/upload/cloudinary-webhook`
3. Events: `upload`, `delete`, `update`

---

## 6. GitHub Actions Secrets

Go to: GitHub Repo > Settings > Secrets > Actions

### Required Secrets
```
# Cloudflare
CLOUDFLARE_API_TOKEN=<from Cloudflare API Tokens>
CLOUDFLARE_ACCOUNT_ID=<from Cloudflare dashboard>

# Render
RENDER_API_KEY=<from Render Account Settings>
RENDER_SERVICE_ID=<from Render service URL>

# Neon (for migration)
NEON_API_KEY=<from Neon Console>
NEON_PROJECT_ID=<from Neon project>

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

# Production Database
DATABASE_URL=postgresql://... (Neon main branch)

# Admin
ADMIN_EMAIL=admin@aysho.com
ADMIN_PASSWORD=<secure-password>

# Optional
SENTRY_DSN=https://xxx@sentry.io/xxx
SLACK_WEBHOOK_URL=https://hooks.slack.com/...
```

### Generate Secrets
```bash
# JWT secrets (run locally)
openssl rand -base64 32
```

---

## 7. First Deployment

### Push to Main
```bash
git add .
git commit -m "feat: initial production setup"
git push origin main
```

### Monitor Deployment
1. **GitHub Actions**: Check CI/CD workflows
2. **Cloudflare Pages**: Watch build logs
3. **Render**: Watch service logs
3. **Neon**: Verify tables created

### Post-Deploy Steps
```bash
# Run migrations (auto-run on Render start)
# Or manually:
cd backend && DATABASE_URL="..." pnpm run db:migrate

# Seed production data
cd backend && NODE_ENV=production DATABASE_URL="..." node scripts/seed-production.js
```

---

## 8. Preview Deployments

### Pull Request Flow
1. Create PR → GitHub Actions runs CI
2. Cloudflare Pages creates preview URL: `https://pr-123.aysho.pages.dev`
3. Neon creates preview branch (auto)
4. Render creates preview service (if configured)

### Preview Environment Variables
Set in GitHub Actions or Cloudflare Pages project settings:
```
VITE_API_URL=https://pr-123-aysho-backend.onrender.com
```

---

## 9. Rollback Procedure

### Frontend (Cloudflare Pages)
1. Pages > Deployments > Click "..." > "Rollback to this deployment"

### Backend (Render)
1. Render > Service > Deploys > Click "..." > "Rollback"

### Database (Neon)
1. Neon > Branches > Point-in-time restore
2. Or: `pnpm run db:migrate down` (if migration reversible)

---

## 10. Monitoring & Alerts

### Health Checks
- Backend: `https://your-backend.onrender.com/api/health`
- Frontend: Cloudflare Pages health check

### Logs
- Render: Service > Logs
- Cloudflare: Pages > Functions > Logs
- Neon: Dashboard > Query editor

### Alerts (Free Options)
- **UptimeRobot**: 50 monitors free (5-min interval)
- **Better Stack**: 10 monitors free
- **Sentry**: 5k errors/month free

---

## Troubleshooting

### Build Fails
```bash
# Clear caches
docker system prune -a
pnpm store prune

# Rebuild
cd frontend && pnpm run build
cd backend && docker build -t aysho-backend .
```

### Database Connection Fails
- Check `DATABASE_URL` format
- Verify Neon allows connections from Render IPs
- Check SSL mode: `?sslmode=require`

### CORS Errors
- Verify `FRONTEND_URL` in backend env
- Check Cloudflare Pages domain matches

### Media Upload Fails
- Verify Cloudinary credentials
- Check webhook URL accessible
- Verify Strapi upload plugin config

---

## Cost Summary (Free Tier)

| Service | Free Tier Limits |
|---------|-----------------|
| Cloudflare Pages | Unlimited bandwidth, 500 builds/mo |
| Render Web Service | 750 hrs/mo (spins down) |
| Neon PostgreSQL | 0.5 GB storage, 190 compute hrs |
| Cloudinary | 25 GB storage, 25 GB bandwidth |
| GitHub Actions | 2000 min/mo (private) |
| **Total** | **$0/month** |

---

## Next Steps

- [ ] Set up custom domain
- [ ] Configure email (SMTP)
- [ ] Add Sentry error tracking
- [ ] Set up Better Stack uptime monitoring
- [ ] Configure Cloudflare WAF rules
- [ ] Add automated backups (Neon PITR)
- [ ] Document API with OpenAPI/Swagger