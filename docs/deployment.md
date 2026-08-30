# Déploiement (VPS OVHcloud)

Production sur un **seul VPS** : 2 vCPU, 4 GB RAM, 30-40 GB SSD, Ubuntu 22.04/24.04.
Docker Compose + Nginx + PostgreSQL + Cloudinary + HTTPS Let's Encrypt.

## 1. Prérequis

- VPS OVHcloud accessible en SSH.
- Domaine `aysho.tn` (records DNS à faire pointer vers l'IP publique).
- Compte GitHub et dépôt avec les secrets suivants dans **Settings → Secrets and
  variables → Actions** :

| Secret | Usage |
|--------|-------|
| `VPS_HOST` | IP publique du VPS |
| `VPS_USER` | utilisateur de déploiement (ex. `deploy`) |
| `VPS_PORT` | port SSH (défaut `22`) |
| `VPS_SSH_KEY` | **clé privée SSH** de l'utilisateur de déploiement (jamais dans le repo) |

## 2. Provisionnement du VPS

```bash
sudo bash deploy/scripts/setup-vps.sh
```

Installe Docker Engine + plugin Compose, configure UFW (`22,80,443`), fail2ban,
la rotation des logs Docker, et le cron de renouvellement des certificats.

Créer puis positionner les fichiers sur le serveur (depuis/vers le repo) :

```bash
sudo mkdir -p /opt/aysho && sudo chown -R deploy:deploy /opt/aysho
# Copier le repo, ex. :
cd /opt/aysho && git clone <repo-url> . && git checkout main
cp .env.example .env && nano .env     # remplir les vraies valeurs (SECRETS !)
```

> `.env` contient tous les secrets (PostgreSQL, clés Strapi, Cloudinary, Sentry).
> Il est gitignoré et ne doit **jamais** être commité.

## 3. Déploiement initial

```bash
cd /opt/aysho
bash deploy/scripts/deploy.sh          # pull + up -d + health checks
bash deploy/scripts/certbot-init.sh    # certificat Let's Encrypt (HTTP-01)
```

Ordre : déployer **puis** émettre le certificat (le placeholder permet à Nginx de
démarrer sans cert réel).

Vérifier :

```bash
curl -fsS https://aysho.tn/health          # "healthy"
curl -fsS https://aysho.tn/api/health       # Strapi via Nginx
curl -fsS https://aysho.tn/api/categories    # données
```

## 4. Déploiements suivants

**Via GitHub Actions (recommandé)** : merger dans `main` → CD build/push GHCR →
SSH → `deploy.sh` (avec `IMAGE_TAG=<sha>`).

**Manuel** :

```bash
cd /opt/aysho
IMAGE_TAG=<sha> bash deploy/scripts/deploy.sh
```

## 5. Variables du `.env` de production

Voir [environment.md](./environment.md). Les clés Strapi se génèrent ainsi :

```bash
node -e "const c=require('crypto');console.log('APP_KEYS='+Array(4).fill(0).map(()=>c.randomBytes(32).toString('base64')).join(','));['API_TOKEN_SALT','ADMIN_JWT_SECRET','JWT_SECRET','TRANSFER_TOKEN_SALT','ENCRYPTION_KEY'].forEach(k=>console.log(k+'='+c.randomBytes(32).toString('base64')))"
```

## 6. HTTPS & renouvellement

- Émission initiale : `certbot-init.sh` (challenge HTTP-01, webroot `/var/www/certbot`).
- Renouvellement automatique : cron quotidien `/etc/cron.d/aysho-renew` → `certbot-renew.sh`
  (recharge Nginx via `docker exec aysho-nginx nginx -s reload`).

## 7. Rollback

```bash
cd /opt/aysho
IMAGE_TAG=<sha-précédent> bash deploy/scripts/rollback.sh
```

Le rollback rejoue `up -d` avec le tag précédent et revérifie la santé. Les données
PostgreSQL ne sont jamais touchées (volume persistant, jamais `down -v`).

## 8. Sauvegarde & restauration

Voir [backup-and-recovery.md](./backup-and-recovery.md).

## Checklist avant mise en production

- [ ] DNS `aysho.tn` → IP VPS, TTL faible (300)
- [ ] `.env` complet et correct sur le VPS (générer des clés réelles)
- [ ] Docker, UFW (22/80/443), fail2ban actifs
- [ ] Première émission Let's Encrypt réussie
- [ ] `https://aysho.tn/health`, `/api/health`, `/api/categories` OK
- [ ] Premier `backup.sh` réussit ; rclone configuré si nécessaire
- [ ] Secrets GitHub (`VPS_*`) positionnés pour le CD