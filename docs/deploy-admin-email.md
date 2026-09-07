# Mise en production : admin panel + email Resend

Ce guide détaille les étapes à effectuer **sur le VPS** après avoir poussé ces changements.

## 1. Pousser les changements sur GitHub

Sur ton PC local :

```powershell
git add .
git commit -m "fix: admin panel URL + order email notification via Resend"
git push origin main
```

## 2. Mettre à jour le VPS

```bash
ssh -i "$HOME\.ssh\id_ed25519_aysho" ubuntu@149.202.63.51

cd /opt/aysho
git pull origin main
```

## 3. Ajouter `PUBLIC_URL` dans le `.env` du VPS

```bash
nano /opt/aysho/.env
```

Ajouter cette ligne (si elle n'existe pas) :

```dotenv
PUBLIC_URL=https://aysho.tn
```

Ajouter aussi les variables Resend si ce n'est pas déjà fait :

```dotenv
RESEND_API_KEY=re_xxxxxxxxxxxx       # ta vraie clé depuis resend.com/api-keys
RESEND_FROM=on@resend.dev            # ou une adresse de ton domaine vérifié dans Resend
RESEND_TO=wassimchouayakh1@gmail.com # email qui reçoit les commandes
```

Sauvegarder : `Ctrl+O`, `Entrée`, `Ctrl+X`

## 4. Reconstruire et redémarrer

```bash
cd /opt/aysho

# Reconstruire le backend (Strapi) avec les nouveaux fichiers compilés
sudo docker compose -f docker-compose.production.yml build --no-cache strapi

# Mettre à jour nginx (nouveau default.conf)
sudo docker compose -f docker-compose.production.yml build --no-cache nginx

# Relancer tous les services
sudo docker compose -f docker-compose.production.yml up -d --no-build --pull never
```

## 5. Vérifier que tout est sain

```bash
sudo docker compose -f docker-compose.production.yml ps
sudo docker compose -f docker-compose.production.yml logs strapi --tail=50
```

Résultat attendu : les 3 services `Up (healthy)`.

## 6. Tester l'admin panel

Ouvrir dans le navigateur :

```
https://aysho.tn/admin/
```

La page de login Strapi doit s'afficher. Si tu n'as pas encore de compte admin, utilise :

```bash
# Créer un premier admin depuis le CLI Strapi dans le conteneur
sudo docker exec -it aysho-strapi node -e "
const strapi = require('/app/node_modules/@strapi/strapi');
// utiliser l'interface web /admin à la première connexion
console.log('Accède à https://aysho.tn/admin/ pour créer ton compte admin');
"
```

En réalité : la **première visite** de `/admin/` affiche un formulaire de création du premier compte administrateur.

## 7. Tester l'email Resend

Depuis l'admin Strapi ou via curl avec un token admin :

### Option A — curl (avec Bearer token de l'admin)

Obtenir un token API dans Strapi Admin → Settings → API Tokens → Create new token (type Full Access).

```bash
curl -X POST https://aysho.tn/api/orders/test-email \
  -H "Authorization: Bearer TON_TOKEN_API" \
  -H "Content-Type: application/json"
```

Réponse attendue :
```json
{
  "ok": true,
  "message": "Email de test envoyé à wassimchouayakh1@gmail.com",
  "order": { ... }
}
```

### Option B — Passer une vraie commande depuis le frontend

Le controller `create` envoie maintenant automatiquement un email à chaque nouvelle commande.

## 8. Vérifier la réception de l'email

- Aller dans ta boîte `wassimchouayakh1@gmail.com`
- Vérifier aussi le dossier **Spam** la première fois
- Dans le dashboard Resend (resend.com), l'onglet **Logs** montre tous les envois avec leur statut

## 9. Email pro avec domaine `aysho.tn`

Pour envoyer depuis `commandes@aysho.tn` au lieu de `on@resend.dev` :

1. Aller sur [resend.com/domains](https://resend.com/domains)
2. Ajouter le domaine `aysho.tn`
3. Ajouter les enregistrements DNS TXT/MX fournis par Resend dans la zone DNS OVH
4. Attendre la vérification (quelques minutes)
5. Mettre à jour le `.env` sur le VPS :

```dotenv
RESEND_FROM=commandes@aysho.tn
```

6. Recréer Strapi :

```bash
cd /opt/aysho
sudo docker compose -f docker-compose.production.yml up -d --force-recreate strapi
```
