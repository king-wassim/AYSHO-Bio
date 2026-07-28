# Security Documentation

## Overview

AYSHO implements defense-in-depth security across all layers: application, infrastructure, network, and data.

---

## Application Security

### Authentication & Authorization

#### Strapi Admin Panel
- **JWT-based** with short expiration (1h access, 7d refresh)
- **Role-Based Access Control (RBAC)**: Super Admin, Editor, Author
- **API Tokens**: Scoped (read-only, full-access, custom)
- **Rate Limiting**: 100 req/15min per IP (configurable)

#### Customer API
- **JWT in Authorization header**: `Bearer <token>`
- **Permissions**: Public (read), Authenticated (cart/orders), Admin (all)
- **Password**: bcrypt (cost 10) via Strapi auth plugin

### Security Headers

### Implemented Headers (Helmet.js + Custom Middleware)

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | Strict policy | Prevent XSS, injection |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `X-XSS-Protection` | `1; mode=block` | Legacy XSS filter |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limit referrer info |
| `Permissions-Policy` | Restricted | Limit browser features |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Force HTTPS |
| `Cross-Origin-Opener-Policy` | `same-origin` | Isolate browsing context |
| `Cross-Origin-Resource-Policy` | `same-origin` | Prevent CORB |

### Content Security Policy (CSP)

```javascript
// backend/src/middlewares/security-headers.ts
const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'"], // Strapi admin needs inline
  styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
  fontSrc: ["'self'", "fonts.gstatic.com", "data:"],
  imgSrc: ["'self'", "data:", "res.cloudinary.com", "https:"],
  connectSrc: ["'self'", "https://*.sentry.io", "https://*.cloudflare.com"],
  frameAncestors: ["'none'"],
  formAction: ["'self'"],
  baseUri: ["'self'"],
  objectSrc: ["'none'"],
};
```

---

## Network Security

### Cloudflare Protection
- **WAF**: OWASP Managed Ruleset (free tier)
- **DDoS**: Automatic mitigation (Layer 3/4/7)
- **Bot Management**: Basic (free tier)
- **Rate Limiting**: 100 req/min per IP (API)
- **SSL/TLS**: Full (Strict) mode
- **Certificate**: Universal SSL (automatic)

### Render Network
- **Private Network**: Services isolated
- **DDoS**: Basic protection
- **Health Checks**: `/api/health` (30s interval)

### Database (Neon)
- **SSL Required**: `sslmode=require`
- **IP Allowlist**: Render IPs + GitHub Actions
- **Encryption**: At rest (AES-256), in transit (TLS 1.2+)
- **Backups**: Point-in-time recovery (7 days free)

---

## Data Security

### Encryption

| Data | At Rest | In Transit |
|------|---------|------------|
| Database | AES-256 (Neon) | TLS 1.2+ |
| Media | Cloudinary (AES-256) | HTTPS |
| Secrets | GitHub/Render/Cloudflare vaults | N/A |
| Backups | Neon PITR (encrypted) | TLS |

### Secrets Management

| Secret | Storage | Rotation |
|--------|---------|----------|
| `DATABASE_URL` | GitHub/Render/Neon | Quarterly |
| `JWT_SECRET` | GitHub/Render | Quarterly |
| `CLOUDINARY_*` | GitHub/Render/Cloudflare | Quarterly |
| `SMTP_*` | GitHub/Render | Quarterly |
| `SENTRY_DSN` | GitHub/Render | As needed |

### PII Handling
- **Minimal Collection**: Email, name, shipping address only
- **No Payment Data**: Stripe handles (PCI SAQ A)
- **Right to Delete**: Admin panel → Users → Delete
- **Data Export**: Admin panel → Users → Export

---

## Input Validation & Sanitization

### Strapi Built-in
- **Content-Type Validation**: JSON only
- **Body Parser Limits**: 10MB default
- **Entity Validation**: Schema-based (required, unique, format)

### Custom Validation
```typescript
// Example: Product creation
{
  name: { type: 'string', required: true, minLength: 1, maxLength: 100 },
  price: { type: 'decimal', required: true, min: 0 },
  slug: { type: 'uid', targetField: 'name' }, // Auto-sanitized
}
```

### File Uploads (Cloudinary)
- **Allowed Types**: jpg, png, webp, gif, pdf
- **Max Size**: 10MB (configurable)
- **Transformations**: Auto-optimize, resize
- **No Execution**: Files served via CDN, not executed

---

## API Security

### Rate Limiting Layers

| Layer | Limit | Scope |
|-------|-------|-------|
| Cloudflare | 1000 req/min | Global IP |
| Strapi Global | 100 req/15min | Per IP |
| Auth Endpoints | 10 req/15min | Per IP |
| API Tokens | 1000 req/min | Per token |

### CORS Configuration
```typescript
// backend/config/middlewares.ts
cors: {
  enabled: true,
  origin: [process.env.FRONTEND_URL], // Single origin
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  headers: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
}
```

### API Versioning
- **URL Path**: `/api/v1/...` (future)
- **Current**: `/api/...` (implicit v1)
- **Deprecation**: 6-month notice

---

## Monitoring & Incident Response

### Logging
- **Application**: Pino (JSON, structured)
- **Access**: Cloudflare + Render logs
- **Errors**: Sentry (real-time alerts)
- **Audit**: Strapi admin actions log

### Alerts (Free Tier)
| Alert | Tool | Threshold |
|-------|------|-----------|
| Downtime | Better Stack | > 1 min |
| Error Rate | Sentry | > 1% in 5 min |
| DB CPU | Neon | > 80% |
| Bandwidth | Cloudflare | > 80% quota |

### Incident Response
1. **Detect**: Alert fires (Slack/Email)
2. **Triage**: Check Sentry + Logs
3. **Mitigate**: Rollback deploy / Scale / Config change
4. **Resolve**: Fix root cause
5. **Postmortem**: Document in `/docs/postmortems/`

---

## Vulnerability Management

### Dependency Scanning
```yaml
# .github/workflows/ci.yml
- name: Security Audit
  run: npm audit --audit-level=high
- name: Snyk Scan
  uses: snyk/actions/node@master
  with:
    severity-threshold: high
```

### Container Scanning
```yaml
- name: Trivy Scan
  uses: aquasecurity/trivy-action@master
  with:
    scan-type: 'fs'
    severity: 'CRITICAL,HIGH'
```

### Schedule
- **Daily**: Dependabot PRs
- **Weekly**: Trivy scan
- **On PR**: npm audit + Snyk
- **Quarterly**: Manual review

---

## Compliance

### GDPR (EU Customers)
- **Lawful Basis**: Consent (marketing), Contract (orders)
- **DPO**: Not required (< 250 employees)
- **Records**: Processing activities documented
- **Breach Notification**: 72-hour process documented

### PCI DSS
- **Scope**: SAQ A (Stripe handles card data)
- **Attestation**: Annual self-assessment

### Data Retention
| Data Type | Retention | Deletion |
|-----------|-----------|----------|
| Orders | 7 years (tax) | Anonymize |
| Accounts | Until deletion | Immediate |
| Analytics | 26 months | Auto-expire |
| Logs | 30 days | Auto-expire |

---

## Security Checklist (Pre-Deploy)

### Code
- [ ] No secrets in code (git-secrets scan)
- [ ] No console.log in production
- [ ] CSP headers tested (report-only first)
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (Strapi ORM)
- [ ] XSS prevention (React auto-escape)

### Infrastructure
- [ ] HTTPS enforced everywhere
- [ ] Security headers on all responses
- [ ] Rate limiting active
- [ ] WAF enabled (Cloudflare)
- [ ] Database SSL required
- [ ] Secrets in vaults (not env files)

### Operations
- [ ] Monitoring alerts configured
- [ ] Backup tested (restore drill)
- [ ] Incident runbook accessible
- [ ] Team trained on response
- [ ] Dependencies updated

---

## Penetration Testing

### Scope (Annual)
- [ ] OWASP Top 10
- [ ] API endpoints
- [ ] Authentication flows
- [ ] File uploads
- [ ] Admin panel
- [ ] Client-side (XSS, CSP bypass)

### Tools
- **OWASP ZAP**: Automated scan
- **Burp Suite**: Manual testing
- **npm audit**: Dependencies

### Remediation SLA
| Severity | Fix Within |
|----------|------------|
| Critical | 24 hours |
| High | 7 days |
| Medium | 30 days |
| Low | Next release |

---

## Secure Development Lifecycle

### Requirements
- Threat modeling for new features
- Privacy impact assessment

### Design
- Security review for architecture changes
- Data flow diagrams

### Implementation
- Secure coding standards (OWASP)
- Code review (2 approvals required)
- Static analysis (ESLint security rules)

### Verification
- Unit tests (security cases)
- Integration tests (auth flows)
- Dependency scanning
- Container scanning

### Release
- Security gate in CI/CD
- Rollback plan
- Post-deploy smoke tests

### Maintenance
- Monthly dependency updates
- Quarterly secret rotation
- Annual pen test
- Continuous monitoring