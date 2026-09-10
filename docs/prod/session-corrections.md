# Corrections de la session — AYSHO Production

## Contexte

Le site `aysho.tn` est déployé sur un VPS OVHcloud avec Docker Compose (Nginx + Strapi + PostgreSQL).
Cette session avait trois objectifs : rendre `/admin/` fonctionnel, intégrer les emails Resend, et corriger les problèmes de l'admin Strapi.

---

## 1. Synchronisation VPS → GitHub

Le VPS contenait des modifications locales (responsive mobile, fix Docker, ajout Resend) non poussées sur GitHub.
Toutes ces modifications ont été intégrées dans le repo local puis poussées sur `main`.

Fichiers principaux concernés :
- `backend/Dockerfile` — groupe Linux dédié, `--no-frozen-lockfile`, démarrage via `node` direct
- `backend/package.json` — ajout de `resend`
- `backend/src/index.ts` — bootstrap permissions publiques + seeding
- `frontend/src/components/*` — responsive mobile (Header, Hero, Footer, Checkout, ProductCard, etc.)
- `docker-compose.production.yml` — montage nginx sur `/etc/nginx/nginx.conf`, variables Resend

Commandes VPS pour nettoyer avant `git pull` :
```bash
git checkout -- .
git pull origin main
cp /tmp/aysho-env-backup .env
```

---

## 2. Email Resend — intégration

Le service `email.ts` existait déjà mais n'était jamais appelé.

**Corrections apportées :**

`backend/src/api/order/controllers/order.ts` — override du `create` pour appeler `sendOrderNotification` en fire-and-forget après chaque nouvelle commande.

`backend/src/api/order/routes/test-email.ts` — route `POST /api/orders/test-email` protégée par token admin pour tester l'envoi sans passer une vraie commande.

**Variables `.env` VPS à renseigner :**
```dotenv
RESEND_API_KEY=re_xxxx
RESEND_FROM=on@resend.dev
RESEND_TO=email_du_proprietaire@gmail.com
```

Puis :
```bash
sudo docker compose -f docker-compose.production.yml up -d --force-recreate strapi
```

---

## 3. Panel admin `/admin/` — page blanche

### Problème 1 : 502 Bad Gateway

Nginx gardait l'ancienne IP Docker de Strapi après un `--force-recreate`.

**Fix :** Ajout d'un bloc `upstream strapi_backend` dans nginx + `resolver 127.0.0.11` pour forcer la re-résolution DNS Docker.

```nginx
upstream strapi_backend {
    server strapi:1337;
    keepalive 16;
}
resolver 127.0.0.11 valid=10s ipv6=off;
```

### Problème 2 : JS Strapi retourne 404

Strapi v5 place ses assets admin à la racine (`/strapi-Xxxx.js`, `/App-Xxxx.js`). Le bloc nginx `location ~* \.(js|css)$` interceptait ces fichiers, faisait `try_files $uri =404`, ne les trouvait pas dans le build React, et retournait 404.

**Fix :** 
- `location ^~ /strapi-` pour le bundle principal (priorité sur regex)
- `location ~* \.(js|css)$` avec `try_files $uri @strapi_chunk` où `@strapi_chunk` proxifie vers `strapi_backend`

```nginx
location ^~ /strapi- {
    proxy_pass http://strapi_backend;
}

location ~* \.(js|css|woff2?|ttf|eot)$ {
    try_files $uri @strapi_chunk;
}

location @strapi_chunk {
    proxy_pass http://strapi_backend;
}
```

### Problème 3 : Volume nginx non rechargé

`nginx -s reload` ne relit pas toujours le volume bind-mount `:ro`. Il faut recréer le conteneur :

```bash
sudo docker compose -f docker-compose.production.yml up -d --force-recreate nginx
```

---

## 4. Content Manager — spinner infini

### Problème : routes internes Strapi interceptées par React

Strapi admin appelle ses routes sans préfixe `/api/` :
- `/content-manager/content-types-settings`
- `/upload/settings`
- `/users-permissions/`
- etc.

Nginx ne les connaissait pas → `location /` retournait `index.html` React → le JS Strapi recevait du HTML au lieu de JSON → spinner infini.

**Fix :** Ajout de locations explicites pour toutes les routes internes Strapi :

```nginx
location /content-manager/ { proxy_pass http://strapi_backend; ... }
location /content-type-builder/ { proxy_pass http://strapi_backend; ... }
location /upload { proxy_pass http://strapi_backend; ... }
location /i18n/ { proxy_pass http://strapi_backend; ... }
location /users-permissions/ { proxy_pass http://strapi_backend; ... }
location /review-workflows/ { proxy_pass http://strapi_backend; ... }
```

### Problème : `admin url` incorrecte

Strapi générait les liens internes vers `/content-manager` au lieu de `/admin/content-manager`.

**Fix** dans `backend/config/admin.ts` :
```ts
url: env('ADMIN_URL', '/admin'),
```

---

## 5. CSP — blocage des requêtes Strapi admin

Le CSP défini globalement dans nginx bloquait :
- `https://api.github.com` (vérification mises à jour Strapi)
- `https://*.cloudinary.com` (Media Library)

**Fix :** Suppression du CSP global, CSP uniquement sur `location /` (React frontend), Strapi admin gère ses propres headers.

```nginx
location / {
    add_header Content-Security-Policy "default-src 'self'; script-src 'self'; 
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; ..." always;
    try_files $uri $uri/ /index.html;
}
```

---

## 6. Upload images — Cloudinary

### Problème : credentials invalides

Les credentials Cloudinary dans le `.env` VPS (`CLOUDINARY_NAME=aysho`) ne correspondaient pas au vrai compte.

**Test pour vérifier les credentials :**
```bash
sudo docker exec aysho-strapi node -e "
const name = process.env.CLOUDINARY_NAME;
const key = process.env.CLOUDINARY_KEY;
const secret = process.env.CLOUDINARY_SECRET;
const auth = Buffer.from(key + ':' + secret).toString('base64');
const https = require('https');
const req = https.request({
  hostname: 'api.cloudinary.com',
  path: '/v1_1/' + name + '/resources/image?max_results=1',
  headers: { 'Authorization': 'Basic ' + auth }
}, (r) => {
  let data = '';
  r.on('data', d => data += d);
  r.on('end', () => console.log('Status:', r.statusCode, data.slice(0, 100)));
});
req.on('error', e => console.error(e.message));
req.end();
"
```

Résultat attendu : `Status: 200`.

**Fix :** Mettre les vrais credentials depuis [cloudinary.com/console](https://cloudinary.com/console) dans `/opt/aysho/.env`.

### Problème : route `/upload` non matchée

nginx avait `location /upload/` (avec slash) mais Strapi reçoit `POST /upload` (sans slash).

**Fix :**
```nginx
location /upload {
    proxy_pass http://strapi_backend;
    client_max_body_size 50m;
    proxy_read_timeout 120s;
}
```

---

## 7. Flags Strapi — appels externes désactivés

`backend/config/admin.ts` — flags désactivés pour éviter les requêtes vers GitHub au démarrage :

```ts
flags: {
  nps: env.bool('FLAG_NPS', false),
  promoteEE: env.bool('FLAG_PROMOTE_EE', false),
  docLinks: env.bool('FLAG_DOC_LINKS', false),
},
```

---

## Commandes de déploiement récapitulatives

```bash
# Sur le PC local
git add .
git commit -m "message"
git push origin main

# Sur le VPS
cd /opt/aysho
git pull origin main

# Si modifications backend/config TS → rebuild obligatoire (~15 min)
sudo docker compose -f docker-compose.production.yml build --no-cache strapi
sudo docker compose -f docker-compose.production.yml up -d --no-build --pull never strapi

# Si modifications nginx uniquement → juste recréer nginx (30 sec)
sudo docker compose -f docker-compose.production.yml up -d --force-recreate nginx

# Vérifier
sudo docker compose -f docker-compose.production.yml ps
sudo docker compose -f docker-compose.production.yml logs strapi --tail=30
```

---

## État final

| Fonctionnalité | Statut |
|---|---|
| `https://aysho.tn` — frontend React | ✅ |
| `https://aysho.tn/admin/` — panel Strapi | ✅ |
| Content Manager (produits, commandes) | ✅ |
| Media Library + upload Cloudinary | ✅ (après fix credentials) |
| Email Resend sur nouvelle commande | ✅ (après config RESEND_API_KEY) |
| API publique `/api/products`, `/api/categories` | ✅ |
| Content-Type Builder | ❌ Normal — désactivé en production par Strapi |
| Marketplace | ❌ Normal — désactivé en production par Strapi |

---

## Variables `.env` VPS complètes à vérifier

```dotenv
# Domaine
AYSHO_DOMAIN=aysho.tn
PUBLIC_URL=https://aysho.tn

# Strapi admin
ADMIN_URL=/admin

# Cloudinary (récupérer depuis cloudinary.com/console)
CLOUDINARY_NAME=ton_cloud_name
CLOUDINARY_KEY=ton_api_key
CLOUDINARY_SECRET=ton_api_secret
CLOUDINARY_FOLDER=aysho

# Resend (récupérer depuis resend.com/api-keys)
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM=on@resend.dev
RESEND_TO=email_proprietaire@gmail.com
```
