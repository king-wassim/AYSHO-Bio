# Architecture Documentation

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              AYSHO E-COMMERCE ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌──────────────┐     ┌─────────────────┐     ┌──────────────────────┐   │
│   │   USERS      │────▶│  CLOUDFLARE CDN │────▶│  CLOUDFLARE PAGES    │   │
│   │  (Browsers)  │     │   (Global CDN)  │     │  (React + Vite SPA)  │   │
│   └──────────────┘     └─────────────────┘     └──────────┬───────────┘   │
│                                                           │               │
│                                                           │ HTTPS         │
│                                                           ▼               │
│   ┌──────────────┐     ┌─────────────────┐     ┌──────────────────────┐   │
│   │  CLOUDINARY  │◀───▶│  RENDER DOCKER  │◀───▶│   NEON POSTGRESQL    │   │
│   │  (Media CDN) │     │  (Strapi v5)    │     │   (Serverless PG)    │   │
│   └──────────────┘     └─────────────────┘     └──────────────────────┘   │
│                              │        │                    │               │
│                              │        │                    │               │
│                       ┌──────┴──┐ ┌───┴────┐         ┌────┴────┐          │
│                       │ Health │ │ Auth  │         │ Tables  │          │
│                       │ Check  │ │ JWT   │         │ Products│          │
│                       │ /api/  │ │ API   │         │ Orders  │          │
│                       │ health │ │       │         │ Users   │          │
│                       └────────┘ └───────┘         └─────────┘          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### 1. Frontend (Cloudflare Pages)
| Aspect | Details |
|--------|---------|
| **Framework** | React 18 + Vite 5 + TypeScript |
| **Routing** | React Router v6 (SPA) |
| **State** | React Context + TanStack Query |
| **Styling** | Tailwind CSS |
| **Build** | Vite (ESBuild + Rollup) |
| **Output** | Static assets to `dist/` |
| **CDN** | Cloudflare Global Network (285+ PoPs) |
| **Edge** | Cloudflare Pages Functions (middleware) |
| **SSL** | Automatic (Universal SSL) |
| **Custom Domain** | CNAME to `*.pages.dev` |

**Build Configuration** (`vite.config.ts`):
- Code splitting: vendor, router, ui, forms, charts chunks
- Compression: gzip + brotli
- Minification: Terser (console.log stripped in prod)
- Assets: hashed filenames, 1-year cache
- CSP: via Cloudflare Pages `_headers`

---

### 2. Backend (Render Docker)
| Aspect | Details |
|--------|---------|
| **Framework** | Strapi v5 (Node.js 20+) |
| **Runtime** | Node 20 Alpine (Docker) |
| **Database** | Neon PostgreSQL (pg driver) |
| **Media** | Cloudinary (strapi-provider-upload-cloudinary) |
| **Auth** | JWT (access + refresh tokens) |
| **Admin** | Strapi Admin Panel (protected) |
| **API** | REST + GraphQL (optional) |
| **Health** | `/api/health` (liveness + readiness) |
| **Security** | Helmet, CORS, Rate Limit, CSP |
| **Logging** | Pino (JSON in prod, pretty in dev) |
| **Monitoring** | Sentry (errors), Better Stack (uptime) |

**Docker Configuration** (`backend/Dockerfile`):
- Multi-stage: builder → runner
- Non-root user (node:1000)
- Health check: `wget /api/health`
- Resource limits: 512MB RAM (free tier)

**Strapi Config** (`backend/config/`):
- `plugins.ts`: Cloudinary, Sentry, Sessions
- `middlewares.ts`: Security, CORS, Rate-limit, Compression
- `database.ts`: PostgreSQL with SSL
- `server.ts`: Host 0.0.0.0, port from env

---

### 3. Database (Neon PostgreSQL)
| Aspect | Details |
|--------|---------|
| **Type** | Serverless PostgreSQL 15+ |
| **Connection** | Pooling via PgBouncer (Neon) |
| **SSL** | Required (`sslmode=require`) |
| **Branching** | Git-like branches for preview envs |
| **PITR** | Point-in-time recovery (7 days free) |
| **Auto-suspend** | After 5 min inactivity (free tier) |
| **Storage** | 0.5 GB free tier |
| **Compute** | 190 hrs/month free tier |

**Connection String Format**:
```
postgresql://user:pass@ep-xxx.region.aws.neon.tech/db?sslmode=require
```

**Strapi Tables** (auto-managed):
- `strapi_*` - Core tables (users, roles, permissions)
- `up_*` - Content types (products, categories, orders)
- `components_*` - Dynamic zones/components
- `upload_file` - Media references (stored in Cloudinary)

---

### 4. Media Storage (Cloudinary)
| Aspect | Details |
|--------|---------|
| **Type** | Image/Video CDN + Transformation |
| **Free Tier** | 25 GB storage, 25 GB bandwidth |
| **Integration** | Strapi provider plugin |
| **Transformations** | Auto-format, quality, resize |
| **Delivery** | Global CDN (Akamai) |
| **Webhooks** | Sync deletions to Strapi |

**Upload Flow**:
```
User → Frontend → Strapi API → Cloudinary → Strapi DB (reference)
                    ↘ Direct upload (signed URL)
```

---

### 5. CI/CD (GitHub Actions)

#### CI Pipeline (`.github/workflows/ci.yml`)
```yaml
Triggers: push, pull_request
Jobs:
  1. lint-frontend     # ESLint + Prettier
  2. lint-backend      # ESLint + Prettier
  3. test-frontend     # Vitest + React Testing Library
  4. test-backend      # Vitest
  5. build-frontend    # Vite build + size check
  6. build-backend     # Docker build (multi-stage)
  7. security-scan     # Trivy (Docker), npm audit
  8. preview-deploy    # Cloudflare Pages preview (PRs)
```

#### CD Pipeline (`.github/workflows/cd.yml`)
```yaml
Triggers: push to main, manual dispatch
Jobs:
  1. build-and-push    # Docker → GHCR
  2. deploy-frontend   # Cloudflare Pages (wrangler)
  3. deploy-backend    # Render API deploy
  4. run-migrations    # Strapi db:migrate (Neon)
  5. seed-production   # Admin user + demo data
  6. smoke-tests       # Health + API checks
  7. notify            # Slack/Discord webhook
```

---

## Data Flow

### 1. Page Load (SSR/SSG not used - SPA)
```
Browser → Cloudflare CDN (cached index.html)
       → JS chunks (cached 1 year)
       → API calls to Render backend
```

### 2. API Request
```
Browser → Cloudflare → Render Load Balancer
       → Strapi (middleware chain)
       → PostgreSQL (Neon)
       → Response → Cloudflare → Browser
```

### 3. Image Upload
```
Frontend → Strapi POST /api/upload
        → Cloudinary (signed upload)
        → Cloudinary webhook → Strapi
        → Strapi saves reference in upload_file
        → Response with Cloudinary URL
```

### 4. Order Checkout
```
Frontend → Strapi POST /api/orders
        → Validate stock
        → Create order + order_items
        → Send confirmation email
        → Return order details
```

---

## Security Architecture

### Network
- Cloudflare WAF (free tier rules)
- Render private network (backend only)
- Neon allowlist (Render IPs + GitHub Actions)

### Application
- **Helmet**: Security headers (CSP, HSTS, X-Frame, etc.)
- **CORS**: Restricted to `FRONTEND_URL`
- **Rate Limit**: 100 req/15min (configurable)
- **Body Limit**: 10MB (prevent DoS)
- **JWT**: HttpOnly cookies + refresh rotation
- **Passwords**: bcrypt (12 rounds)

### Data
- **Encryption at rest**: Neon (AES-256)
- **Encryption in transit**: TLS 1.3 everywhere
- **Secrets**: Never in code (GitHub/Render/Cloudflare secrets)
- **PII**: Minimal collection, GDPR-ready

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **TTFB (API)** | < 200ms | Render health checks |
| **TTFB (Static)** | < 50ms | Cloudflare CDN |
| **LCP (Frontend)** | < 2.5s | Web Vitals |
| **CLS** | < 0.1 | Web Vitals |
| **Build Time** | < 5 min | GitHub Actions |
| **Deploy Time** | < 10 min | CI/CD total |
| **Cold Start** | < 3s | Render free tier |

---

## Scaling Considerations

### Current (Free Tier)
- Render: Spins down after 15 min inactivity
- Neon: Auto-suspends after 5 min
- Cloudflare: Unlimited bandwidth
- Cloudinary: 25 GB/month

### Growth Path
| Component | Next Tier | Cost Est. |
|-----------|-----------|-----------|
| Render | Starter ($7/mo) | Always on, 512MB |
| Neon | Scale ($19/mo) | 10 GB, no suspend |
| Cloudinary | Plus ($89/mo) | 225 GB |
| Cloudflare | Pro ($20/mo) | WAF, Analytics |

### Horizontal Scaling (Future)
- Render: Multiple instances + Redis session store
- Neon: Read replicas
- Strapi: Redis cache plugin
- Frontend: Already globally distributed

---

## Disaster Recovery

### RTO/RPO Targets
- **RTO**: < 30 min (manual redeploy)
- **RPO**: < 1 hour (Neon PITR)

### Backup Strategy
- **Database**: Neon automatic (continuous)
- **Media**: Cloudinary (original + transformations)
- **Code**: GitHub (primary + mirrors)
- **Config**: GitHub secrets + docs

### Recovery Procedures
1. **Database corruption**: Neon PITR → new branch → update `DATABASE_URL`
2. **Backend down**: Render rollback → or `docker run` locally
3. **Frontend broken**: Cloudflare Pages rollback (instant)
4. **Total loss**: Re-deploy from `main` branch

---

## Monitoring & Observability

### Health Endpoints
- `GET /api/health` - Liveness (load balancer)
- `GET /api/health/ready` - Readiness (DB connection)
- `GET /api/health/live` - Liveness (process alive)

### Logging
- **Format**: JSON (prod) / Pretty (dev)
- **Levels**: error, warn, info, debug
- **Fields**: timestamp, level, message, requestId, userId

### Metrics (Future)
- Prometheus `/metrics` endpoint
- Grafana Cloud (free tier)
- Custom business metrics (orders, revenue)

### Alerting (Free)
- Better Stack: Uptime + SSL expiry
- Sentry: Error rate spikes
- GitHub Actions: Workflow failures

---

## Development Workflow

### Local Development
```bash
# Start all services
docker-compose up -d

# Or separately
cd backend && pnpm run dev  # SQLite, hot reload
cd frontend && pnpm run dev # Vite HMR
```

### Feature Branch
```bash
git checkout -b feat/new-feature
# Develop, test locally
git push origin feat/new-feature
# PR → CI runs → Preview URL
```

### Release
```bash
git checkout main
git merge feat/new-feature
git tag v1.0.0
git push origin main --tags
# CD deploys to production
```

---

## API Contract

### REST Endpoints (Strapi)
| Resource | Endpoints |
|----------|-----------|
| Products | GET/POST `/api/products`, GET/PUT/DELETE `/api/products/:id` |
| Categories | GET/POST `/api/categories`, GET/PUT/DELETE `/api/categories/:id` |
| Orders | GET/POST `/api/orders`, GET/PUT `/api/orders/:id` |
| Users | GET `/api/users/me`, POST `/api/auth/local` |
| Upload | POST `/api/upload` |
| Health | GET `/api/health`, `/api/health/ready`, `/api/health/live` |

### Query Parameters
- `populate` - Relations (e.g., `?populate=category,images`)
- `filters` - Where clauses (e.g., `?filters[price][$gte]=100`)
- `sort` - Ordering (e.g., `?sort=createdAt:desc`)
- `pagination[page]` & `pagination[pageSize]`

### Authentication
- **Register**: `POST /api/auth/local/register`
- **Login**: `POST /api/auth/local` → Returns JWT
- **Refresh**: `POST /api/auth/refresh` (refresh token in cookie)
- **Logout**: `POST /api/auth/logout`
- **Me**: `GET /api/users/me` (Bearer token)

---

## File Structure

```
aysho/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── cd.yml
├── backend/
│   ├── config/
│   │   ├── admin.ts
│   │   ├── database.ts
│   │   ├── middlewares.ts
│   │   ├── plugins.ts
│   │   ├── server.ts
│   │   └── rate-limit.ts
│   ├── src/
│   │   ├── api/
│   │   │   └── health/
│   │   ├── middlewares/
│   │   │   ├── compression.ts
│   │   │   ├── rate-limit.ts
│   │   │   └── security-headers.ts
│   │   ├── policies/
│   │   └── index.ts
│   ├── scripts/
│   │   ├── seed-example.js
│   │   └── seed-production.js
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .eslintrc.cjs
│   ├── .prettierrc.json
│   ├── .editorconfig
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── .env.production
├── frontend/
│   ├── public/
│   │   ├── _headers
│   │   ├── _redirects
│   │   └── functions/
│   │       └── _middleware.js
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── store/
│   │   ├── styles/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── .dockerignore
│   ├── .eslintrc.cjs
│   ├── .prettierrc.json
│   ├── .editorconfig
│   ├── vite.config.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── .env.production
├── docker-compose.yml
├── docker-compose.production.yml
├── .gitignore
├── README.md
├── AUDIT_REPORT.md
└── docs/
    ├── architecture.md
    ├── deployment.md
    └── environment.md
```