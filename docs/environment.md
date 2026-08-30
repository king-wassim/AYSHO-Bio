# Variables d'environnement

Trois fichiers : `.env` (racine, **production VPS**), `backend/.env` (développement),
`frontend/.env` (développement). Tous gitignorés.

## Fichier racine `.env` (production, sur le VPS → `/opt/aysho/.env`)

Copie de `.env.example`, puis remplissage des vraies valeurs.

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `AYSHO_DOMAIN` | oui | Domaine, défaut `aysho.tn` |
| `GHCR_OWNER` | oui | Propriétaire GitHub (minuscules) pour `ghcr.io/<owner>/...` |
| `IMAGE_TAG` | non | Tag des images (SHA Git en CD, `latest` par défaut) |
| `POSTGRES_DB` | oui | Nom de la base, défaut `aysho` |
| `POSTGRES_USER` | oui | Utilisateur PostgreSQL, défaut `aysho` |
| `POSTGRES_PASSWORD` | oui | **Forcer un mot de passe fort** |
| `APP_KEYS` | oui | 4 clés séparées par des virgules |
| `API_TOKEN_SALT` | oui | Sel API tokens Strapi |
| `ADMIN_JWT_SECRET` | oui | Secret JWT admin |
| `JWT_SECRET` | oui | Secret JWT public |
| `TRANSFER_TOKEN_SALT` | oui | Sel transfer tokens |
| `ENCRYPTION_KEY` | oui | Clé de chiffrement Strapi |
| `CLOUDINARY_NAME` | oui | Cloud name Cloudinary |
| `CLOUDINARY_KEY` | oui | API key Cloudinary |
| `CLOUDINARY_SECRET` | oui | API secret Cloudinary |
| `CLOUDINARY_FOLDER` | non | Dossier Cloudinary, défaut `aysho` |
| `SENTRY_ENABLED` | non | `true`/`false`, défaut `false` |
| `SENTRY_DSN` | non | DSN Sentry (si activé) |
| `RATE_LIMIT_ENABLED` | non | Défaut `true` |
| `RATE_LIMIT_WINDOW_MS` | non | Fenêtre, défaut `900000` (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | non | Max requêtes global, défaut `100` |
| `CERTBOT_EMAIL` | non | Email Let's Encrypt, défaut `admin@aysho.tn` |
| `BACKUP_RETENTION_DAYS` | non | Jours de rétention des dumps, défaut `14` |
| `BACKUP_RCLONE_REMOTE` | non | Remote rclone (copie externe), vide = local uniquement |

Génération des clés Strapi :

```bash
node -e "const c=require('crypto');console.log('APP_KEYS='+Array(4).fill(0).map(()=>c.randomBytes(32).toString('base64')).join(','));['API_TOKEN_SALT','ADMIN_JWT_SECRET','JWT_SECRET','TRANSFER_TOKEN_SALT','ENCRYPTION_KEY'].forEach(k=>console.log(k+'='+c.randomBytes(32).toString('base64')))"
```

## Backend `.env` (développement)

Voir `backend/.env.example`. Points clés :

- `DATABASE_CLIENT=sqlite` en dev (ou `postgres` local).
- `UPLOAD_PROVIDER=local` en dev ; **en production il est forcé à `cloudinary`** par le compose.
- `FRONTEND_URL=http://localhost:5173` en dev.
- `RATE_LIMIT_ENABLED` : activé par défaut (règles par route dans `src/middlewares/rateLimit.ts`).

## Frontend `.env` (développement)

```env
# vide en production (same-origin via Nginx : /api)
VITE_STRAPI_URL=http://localhost:1337
```

En production `VITE_STRAPI_URL` **reste vide** : le navigateur appelle `https://aysho.tn/api/...`
(même origine) et Nginx fait le proxy vers Strapi. Les URLs Cloudinary étant absolues,
elles ne sont jamais préfixées par `STRAPI_URL` (voir `frontend/src/lib/api.ts` → `resolveMediaUrl`).

## Règles

- Aucun secret dans le code ou en base Git. `.env` est bloqué par le `.gitignore` racine.
- Sur le VPS, `.env` est lu automatiquement par Docker Compose au chargement du fichier compose.
- `backend/.env.production` ne contient que des placeholders (documentation, jamais de valeurs).