# Performance & Optimization Guide

## Frontend Performance (Cloudflare Pages + React + Vite)

### Build Optimization (`vite.config.ts`)

```typescript
// Code Splitting Strategy
manualChunks: {
  vendor: ['react', 'react-dom', 'react-router-dom'],
  ui: ['@headlessui/react', '@heroicons/react'],
  forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
  query: ['@tanstack/react-query'],
  charts: ['recharts'],
  utils: ['date-fns', 'clsx', 'tailwind-merge'],
}

// Minification
minify: 'terser',
terserOptions: {
  compress: {
    drop_console: true,      // Remove console.log
    drop_debugger: true,     // Remove debugger
    pure_funcs: ['console.log', 'console.info'],
  },
  format: { comments: false },
}

// Compression
plugins: [
  viteCompression({ algorithm: 'gzip', ext: '.gz' }),
  viteCompression({ algorithm: 'brotliCompress', ext: '.br' }),
]
```

### Asset Optimization

| Asset | Strategy | Cache |
|-------|----------|-------|
| JS/CSS | Hashed filenames | 1 year (immutable) |
| Images | Cloudinary auto-format | 1 year |
| Fonts | Preload + WOFF2 | 1 year |
| HTML | No cache (SPA) | 0 (must-revalidate) |

### Cloudflare Headers (`public/_headers`)

```toml
# Immutable assets - 1 year cache
/assets/*
  Cache-Control: public, max-age=31536000, immutable
  Vary: Accept-Encoding

# HTML - no cache (SPA routing)
/*
  Cache-Control: public, max-age=0, must-revalidate
  X-Content-Type-Options: nosniff

# API routes - no cache
/api/*
  Cache-Control: no-store
```

### Core Web Vitals Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **LCP** | < 2.5s | Web Vitals (field) |
| **INP** | < 200ms | Web Vitals (field) |
| **CLS** | < 0.1 | Web Vitals (field) |
| **FCP** | < 1.8s | Lighthouse |
| **TTFB** | < 800ms | Lighthouse |
| **TBT** | < 200ms | Lighthouse |

### Performance Budget

| Resource | Budget |
|----------|--------|
| Total JS (gzipped) | < 170 KB |
| Total CSS (gzipped) | < 50 KB |
| Fonts | < 100 KB |
| Images (per page) | < 500 KB |
| Total Page Weight | < 1 MB |
| Requests | < 50 |

### Monitoring

```bash
# Local Lighthouse CI
npx lhci autorun

# Bundle Analysis
cd frontend && pnpm run build && npx vite-bundle-analyzer dist

# Web Vitals (production)
# Add to frontend/src/main.tsx:
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';
onCLS(console.log); onFID(console.log); onFCP(console.log); onLCP(console.log); onTTFB(console.log);
```

---

## Backend Performance (Strapi v5 + Render + Neon)

### Database Optimization

#### Connection Pooling
```typescript
// backend/config/database.ts
pool: {
  min: 2,
  max: 10,           // Render free tier: 512MB RAM
  acquireTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
}
```

#### Query Optimization
```typescript
// Use populate selectively
const products = await strapi.entityService.findMany('api::product.product', {
  populate: {
    category: { fields: ['name', 'slug'] },
    images: { fields: ['url', 'alternativeText'], limit: 3 },
  },
  fields: ['name', 'slug', 'price', 'description'],
  pagination: { page: 1, pageSize: 20 },
});

// Avoid: populate: '*' (fetches all relations)
```

#### Indexes (Run via migration)
```sql
-- Products
CREATE INDEX idx_products_category_published ON up_products (category_id, published_at) WHERE published_at IS NOT NULL;
CREATE INDEX idx_products_slug ON up_products (slug) WHERE published_at IS NOT NULL;

-- Orders
CREATE INDEX idx_orders_user_status ON up_orders (user_id, status);
CREATE INDEX idx_orders_created_at ON up_orders (created_at DESC);

-- Users
CREATE INDEX idx_users_email ON up_users (email);
```

### Caching Strategy

#### HTTP Caching (Cloudflare)
```toml
# public/_headers
/api/products
  Cache-Control: public, max-age=60, stale-while-revalidate=300
  Vary: Accept-Encoding, Authorization

/api/categories
  Cache-Control: public, max-age=3600, stale-while-revalidate=86400
```

#### Application Caching (Redis - Future)
```typescript
// When scaling beyond free tier
const cache = new RedisCache({ ttl: 300 }); // 5 min

const getProducts = async (params) => {
  const key = `products:${JSON.stringify(params)}`;
  return cache.wrap(key, () => fetchProducts(params));
};
```

### Response Compression

```typescript
// backend/config/middlewares.ts
compression: {
  enabled: true,
  options: {
    threshold: 1024,      // Compress > 1KB
    level: 6,             // Balanced speed/ratio
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
  },
}
```

### Rate Limiting (Protection + Performance)

```typescript
// backend/config/rate-limit.ts
{
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                 // 100 requests per window
  message: 'Too many requests',
  standardHeaders: true,
  legacyHeaders: false,
  // Stricter for auth
  '/api/auth/*': { max: 10 },
  // Lenient for static reads
  '/api/products': { max: 200 },
}
```

### Cold Start Optimization (Render Free Tier)

**Problem**: Service spins down after 15 min inactivity → 10-30s cold start

**Mitigations**:
1. **Health Ping**: External cron (Better Stack) every 10 min
2. **Warm Endpoints**: `/api/health` is lightweight
3. **Minimize Startup**: 
   - Disable unused plugins
   - Lazy-load heavy modules
   - Pre-compile admin panel (build time)

```typescript
// backend/src/index.ts - Minimal bootstrap
export default {
  register() {},
  bootstrap() {
    // Only critical startup tasks
    // Defer: cron jobs, heavy sync
  },
};
```

---

## Database Performance (Neon PostgreSQL)

### Monitoring Queries

```sql
-- Slow queries (> 100ms)
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Table sizes
SELECT schemaname, tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND schemaname = 'public';
```

### Connection Management

```typescript
// Neon serverless - use connection pooling
// Connection string includes: ?sslmode=require&pgbouncer=true
// Or use Neon's built-in pooler: pooler.neon.tech
```

### Read Replicas (Future)
```typescript
// For scaling reads
const readPool = new Pool({ connectionString: READ_REPLICA_URL });
const writePool = new Pool({ connectionString: PRIMARY_URL });

// Route SELECT to read, writes to primary
```

---

## Media Performance (Cloudinary)

### Automatic Optimization
```typescript
// Upload with transformations
cloudinary.uploader.upload(file, {
  folder: 'products',
  transformation: [
    { quality: 'auto:good' },
    { fetch_format: 'auto' },
    { width: 1200, crop: 'limit' },
  ],
  eager: [
    { width: 400, crop: 'scale', quality: 'auto' },  // Thumbnail
    { width: 800, crop: 'scale', quality: 'auto' },  // Medium
  ],
});
```

### Responsive Images (Frontend)
```tsx
// frontend/src/components/OptimizedImage.tsx
const srcSet = [
  `${url}/w_400,q_auto,f_auto 400w`,
  `${url}/w_800,q_auto,f_auto 800w`,
  `${url}/w_1200,q_auto,f_auto 1200w`,
].join(', ');

<picture>
  <source type="image/avif" srcSet={srcSet.replace(/f_auto/g, 'f_avif')} />
  <source type="image/webp" srcSet={srcSet.replace(/f_auto/g, 'f_webp')} />
  <img src={`${url}/w_800,q_auto,f_auto`} srcSet={srcSet} sizes="(max-width: 768px) 100vw, 50vw" loading="lazy" alt={alt} />
</picture>
```

### Bandwidth Optimization
- **Auto Quality**: `q_auto:good` (default)
- **Format**: Auto (AVIF → WebP → JPEG)
- **Responsive**: Client-hints + srcset
- **Lazy Load**: Native `loading="lazy"`

---

## CI/CD Performance

### Build Time Optimization

```yaml
# .github/workflows/ci.yml
jobs:
  build-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/cache@v4
        with:
          path: |
            ~/.npm
            frontend/node_modules
            frontend/dist
          key: ${{ runner.os }}-frontend-${{ hashFiles('frontend/pnpm-lock.yaml') }}
      
      - name: Install
        run: cd frontend && pnpm install --frozen-lockfile --prefer-offline
      
      - name: Build
        run: cd frontend && pnpm run build
        # Parallel: Vite builds in ~30s
```

### Docker Layer Caching

```dockerfile
# backend/Dockerfile
# 1. Install deps (cached unless package.json changes)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

# 2. Copy source (changes frequently)
COPY . .

# 3. Build (uses cached deps)
RUN pnpm run build

# 4. Production stage (minimal)
FROM node:20-alpine
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
```

### Deploy Time Targets
| Stage | Target | Current |
|-------|--------|---------|
| CI Lint/Test | < 3 min | ~2 min |
| CI Build | < 5 min | ~3 min |
| CD Frontend | < 2 min | ~1 min |
| CD Backend | < 5 min | ~3 min |
| **Total** | **< 15 min** | **~10 min** |

---

## Scaling Strategy

### Current (Free Tier)
| Component | Limit | Headroom |
|-----------|-------|----------|
| Render RAM | 512 MB | ~300 MB used |
| Render CPU | Shared | Burstable |
| Neon Storage | 0.5 GB | ~0.1 GB used |
| Neon Compute | 190 hrs/mo | ~50 hrs used |
| Cloudflare Bandwidth | Unlimited | N/A |
| Cloudinary Storage | 25 GB | ~2 GB used |
| Cloudinary Bandwidth | 25 GB/mo | ~5 GB used |

### Next Tier ($50-100/mo)
| Upgrade | Cost | Benefit |
|---------|------|---------|
| Render Starter | $7/mo | Always on, 512 MB, custom domain |
| Neon Scale | $19/mo | 10 GB, no suspend, read replicas |
| Cloudinary Plus | $89/mo | 225 GB, advanced transformations |
| Cloudflare Pro | $20/mo | WAF, Analytics, Workers |

### Horizontal Scaling (Future)
```yaml
# docker-compose.scale.yml
services:
  backend:
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 512M
    environment:
      - REDIS_URL=redis://redis:6379  # Session store
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
```

---

## Performance Testing

### Load Testing (k6)
```javascript
// tests/load/api.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 10 },  // Ramp up
    { duration: '5m', target: 50 },  // Steady load
    { duration: '2m', target: 100 }, // Stress
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const baseUrl = 'https://aysho-backend.onrender.com';
  
  // Health check
  http.get(`${baseUrl}/api/health`);
  
  // Product listing
  http.get(`${baseUrl}/api/products?pagination[pageSize]=20`);
  
  // Single product
  http.get(`${baseUrl}/api/products/1`);
  
  sleep(1);
}
```

```bash
# Run load test
k6 run tests/load/api.js
```

### Synthetic Monitoring
```yaml
# Better Stack / UptimeRobot checks
- name: API Health
  url: https://aysho-backend.onrender.com/api/health
  interval: 60s
  threshold: 2000ms

- name: Frontend Load
  url: https://aysho.pages.dev
  interval: 300s
  threshold: 3000ms

- name: Checkout Flow
  url: https://aysho.pages.dev/checkout
  interval: 900s
  threshold: 5000ms
```

---

## Optimization Checklist

### Frontend
- [ ] Code splitting by route
- [ ] Lazy load non-critical components
- [ ] Preload critical assets
- [ ] Optimize images (Cloudinary)
- [ ] Minify + compress (gzip + brotli)
- [ ] Cache static assets (1 year)
- [ ] Remove unused CSS (PurgeCSS)
- [ ] Tree-shake dependencies
- [ ] Service Worker (PWA) for offline

### Backend
- [ ] Database indexes on query fields
- [ ] Selective populate (not `*`)
- [ ] Pagination on all lists
- [ ] Connection pooling configured
- [ ] Compression enabled
- [ ] Rate limiting configured
- [ ] Unused plugins disabled
- [ ] Health check optimized

### Database
- [ ] Slow query monitoring
- [ ] Index usage reviewed
- [ ] Vacuum/analyze scheduled
- [ ] Connection pooling (PgBouncer)
- [ ] Read replicas (when needed)

### Infrastructure
- [ ] CDN caching rules
- [ ] Edge caching for API
- [ ] Warm-up cron for cold starts
- [ ] Auto-scaling configured
- [ ] Resource limits set