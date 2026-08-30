# Architecture

AYSHO est une plateforme e-commerce de cosmétiques bio/naturels (Tunisie).

## Vue d'ensemble (production)

```
                    Internet
                       │
                       ▼
              ┌─────────────────┐
              │   Nginx (TLS)   │   aysho.tn :443 (certificat Let's Encrypt)
              │     frontend    │   aysho.tn :80  → redirige vers HTTPS
              └───────┬─────────┘
                      │  réseau privé Docker "frontend-network"
                      ▼
              ┌─────────────────┐
              │   Strapi :1337  │   backend (GHCR, image node)
              └───────┬─────────┘
                      │  réseau privé Docker "backend-network"
                      ▼
              ┌─────────────────┐
              │  PostgreSQL 16  │   volume persistant postgres-data
              └─────────────────┘
```

- **Nginx** (image `nginx:alpine`) : publie les seuls ports hôte `80/443`, sert la SPA React,
  proxy inverse pour Strapi (`/api`, `/admin`, `/uploads`) via **same-origin**, gère TLS,
  headers de sécurité, compression gzip, cache des assets fingerprinter.
- **Strapi** (image GHCR) : jamais exposé publiquement (pas de ports hôte). Uniquement sur
  le réseau Docker bridge privé `frontend-network` (accessible à Nginx) et `backend-network`
  (accès PostgreSQL).
- **PostgreSQL 16** : jamais exposé publiquement. Volume `postgres-data` (données), `shm_size`
  réglé, healthcheck `pg_isready`, redémarrage `unless-stopped`.
- **Cloudinary** : toutes les images de production sont servies par Cloudinary
  (`UPLOAD_PROVIDER=cloudinary` forcé). Le frontend utilise `resolveMediaUrl()` /
  `optimizeMediaUrl()` pour ne jamais concaténer `STRAPI_URL` devant une URL Cloudinary absolue.

## Réseaux Docker

| Réseau | Membres | Rôle |
|--------|---------|------|
| `frontend-network` | nginx, strapi | nginx → strapi (API) |
| `backend-network` | strapi, postgres | strapi → postgres |

Strapi est sur les deux réseaux ; nginx et postgres sur un seul chacun.

## Volumes Docker

| Volume | Monté sur | Contenu |
|--------|-----------|---------|
| `postgres-data` | postgres `/var/lib/postgresql/data` | données de la base |
| `certbot-certs` | nginx `/etc/letsencrypt` | certificats TLS (init par certbot) |
| `certbot-challenges` | nginx `/var/www/certbot` | défis ACME HTTP-01 |

## Flux de requête

1. `GET https://aysho.tn/api/categories` → Nginx `location /api/` → `proxy_pass http://strapi:1337`
   → Strapi → PostgreSQL.
2. `GET https://aysho.tn/` → Nginx `try_files ... /index.html` (SPA).
3. Assets fingerprinter (`assets/js/*.js?hash`) → cache long (`immutable, 1y`).
4. `index.html` → `Cache-Control: no-store` (nouveau build détecté immédiatement).

## Frontend & Strapi (dev)

- En dev, `vite.config.ts` proxie `/api`, `/admin`, `/uploads` → `http://localhost:1337`.
- `VITE_STRAPI_URL` reste vide en production (same-origin via Nginx) et peut être renseigné
  en dev (`frontend/.env`, gitignoré). Les médias Cloudinary sont toujours des URLs absolues
  et ne passent pas par ce préfixe (voir `frontend/src/lib/api.ts`).

## CI/CD (GitHub Actions)

- `ci.yml` : lint + typecheck + tests Vitest + builds Docker de vérification + scans sécurité.
- `cd.yml` : sur `push main`, build/push images vers **GHCR** (`<owner>/aysho-frontend`,
  `<owner>/aysho-backend`, tags `latest` + SHA) puis SSH vers le VPS
  (`appleboy/ssh-action`, clé dans `secrets.VPS_SSH_KEY`) → `deploy/scripts/deploy.sh`
  (`docker compose pull && up -d` + health checks). Smoke tests HTTPS ensuite.

## Sauvegarde / Monitoring

- `deploy/scripts/backup.sh` : `pg_dump | gzip` quotidien vers `/opt/aysho/backups`
  (rétention `BACKUP_RETENTION_DAYS`), copie rclone optionnelle.
- `deploy/scripts/monitor.sh` : watchdog cron qui vérifie HTTPS, `/health`, `/api/health`,
  `pg_isready` et écrit `/opt/aysho/status.json`.
- Sentry pour les erreurs (variable `SENTRY_ENABLED`).