# Sécurité

Bonnes pratiques en place et opérations recommandées pour le VPS de production.

## En place

### Couche réseau
- **Ports hôte exposés : uniquement `22`, `80`, `443`** (UFW, `deny incoming` par défaut).
- **Strapi `:1337` et PostgreSQL `:5432` ne sont jamais publiés** hors des réseaux Docker
  privés (`frontend-network`, `backend-network`).
- fail2ban sur SSH (`maxretry 5 / findtime 10m / bantime 1h`).

### Nginx (TLS + headers)
- TLS 1.2/1.3, HTTP/2, HSTS en-tête, STApling activé.
- Headers de sécurité globaux : `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`, `X-Frame-Options`, CSP stricte sur les pages servies.
- Redirection forcée HTTP→HTTPS (hors challenge ACME).
- Assets fingerprinter en cache immutable ; `index.html` non mis en cache.

### Strapi
- Rate limiting activé et **scopé par route** (`src/middlewares/rateLimit.ts`) :
  `/health` 60/15 min, `/orders` 30/h, `/auth` 50/15 min, `/admin` 300/15 min,
  global 200/15 min. IP = dernier maillon de `X-Forwarded-For` (derrière Nginx).
- CORS strict multi-origines depuis `FRONTEND_URL` (`config/middlewares.ts`).
- Secrets (JWT, saltes) uniquement dans `.env` VPS, orgérés par le compose.

### Chiffrement applicatif
- Cloudinary en HTTPS ; le frontend n'utilise que des URLs absolues Cloudinary (pas de
  double concaténation de domaine).
- Sentry optionnel ; DSN jamais exposé dans le bundle si désactivé.

## Concernant les secrets
- Les clés privées SSH (`VPS_SSH_KEY`), DSN, tokens Cloudinary/GHCR ne sont **jamais**
  commités ni affichés dans les logs.
- Seules des valeurs de test/placeholders existent dans le repo (`backend/.env.production`,
  `.env.example`).
- Le `.gitignore` racine bloque `.env`, `dist/`, `node_modules/`, `.neon/`.

## Opérations à faire (vps)
1. **Utilisateur dédié** : ne pas administrer en `root` quotidien ; utiliser un user avec
   accès Docker pour déployer.
2. **Authentification SSH par clé uniquement** ; désactiver `PasswordAuthentication` et
   `PermitRootLogin` dans `/etc/ssh/sshd_config` après avoir ajouté vos clés.
3. **Mises à jour** : `apt update && apt upgrade` régulièrement (kernel inclus).
4. **Surveillance** : `monitor.sh` via cron (voir [monitoring-and-telemetry.md](./monitoring-and-telemetry.md)).
5. **Ghost/Docker Login GHCR** : au besoin, utiliser un PAT avec scope `packages:read`
   conservé dans `/root/.aysho-ghcr.env` (jamais dans le repo).

## Journalisation
- `docker logs` avec rotation (`json-file`, max 10 Mo × 3) configurée par `setup-vps.sh`.
- Logs applicatifs Nginx (`/var/log/nginx`), Strapi (stdout → Docker), SQL readiness.
- En cas d'intégration Sentry : pas de logs secrets, DSN par variables d'env.