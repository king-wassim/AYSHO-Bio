# AYSHO - E-commerce

Plateforme e-commerce de cosmétiques bio & naturels (Tunisie). React + Vite + Strapi v5 +
PostgreSQL, déployée en **production sur un VPS OVHcloud** (Docker Compose + Nginx TLS).

## Architecture (production)

```
Internet → Nginx (aysho.tn :80/443, Let's Encrypt)
                ├─ SPA React (static, cache durable)
                └─ /api, /admin → Strapi :1337 (réseau privé)
                                       └─ PostgreSQL 16 (réseau privé)
Médias : Cloudinary (URLs absolues, aucun préfixe de domaine)
```

- Seul Nginx publie des ports hôte (80/443). Strapi et PostgreSQL restent privés.
- API **same-origin** : le frontend appelle `/api/...` (proxy Nginx → Strapi),
  pas de CORS cross-origin en production.
- Sauvegardes PostgreSQL quotidiennes, renouvellement Let's Encrypt automatique,
  déploiement automatisé GHCR + SSH via GitHub Actions.

## Stack

| Couche | Technologie |
|--------|-------------|
| Frontend | React 18 + Vite 5 + TypeScript + TailwindCSS |
| Backend | Strapi 5 (Docker, GHCR) |
| Base de données | PostgreSQL 16 (volume persistant) |
| Prod | VPS OVHcloud (2 vCPU / 4 Go) + Nginx + Docker Compose |
| Médias | Cloudinary |
| CI/CD | GitHub Actions → GHCR → SSH → VPS |
| TLS | Let's Encrypt (certbot, HTTP-01) |

## Démarrage local

```bash
# Backend (terminal 1) — http://localhost:1337 + /admin
cd backend
cp .env.example .env
npm install
npm run develop

# Frontend (terminal 2) — http://localhost:5173
cd frontend
cp .env.example .env        # VITE_STRAPI_URL=http://localhost:1337
npm install
npm run dev                 # proxy Vite vers :1337 (/api, /admin, /uploads)
```

## Tests

```bash
cd frontend && npm run test   # Vitest (helpers API + normalisation Strapi v5)
cd frontend && npm run lint && npm run typecheck
cd backend  && npm run lint && npx tsc --noEmit
```

## Documentation

- [architecture.md](./docs/architecture.md) — schémas, réseaux, flux
- [deployment.md](./docs/deployment.md) — provisioning VPS + déploiement
- [environment.md](./docs/environment.md) — variables d'environnement
- [backup-and-recovery.md](./docs/backup-and-recovery.md) — sauvegarde/restauration/rollback
- [monitoring-and-telemetry.md](./docs/monitoring-and-telemetry.md) — watchdogs & Sentry
- [security.md](./docs/security.md) — posture sécurité
- [testing.md](./docs/testing.md) — CI/CD & tests

## Endpoints API (via Nginx, same-origin)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/categories` | Catégories |
| GET | `/api/products` | Produits |
| POST | `/api/orders` | Créer une commande |
| GET | `/api/health` | Santé Strapi |
| GET | `/health` | Santé Nginx (uptime externes) |

<p align="center">Wassim · <a href="https://aysho.tn">aysho.tn</a></p>