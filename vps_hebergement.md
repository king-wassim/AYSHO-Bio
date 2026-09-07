# Cours pratique : hebergement de AYSHO sur un VPS OVHcloud

Ce document resume le parcours realise pour connecter le VPS OVHcloud, installer AYSHO et publier la version locale du projet.

> Objectif : comprendre ce qui a ete fait, pourquoi, et comment refaire les operations proprement.

## 1. Les notions importantes

| Notion | Signification |
|---|---|
| VPS | Serveur virtuel loue chez OVHcloud. |
| SSH | Connexion securisee a un serveur Linux depuis Windows. |
| Cle SSH | Paire de cles permettant une connexion sans mot de passe. |
| KVM | Console web OVH permettant de controler directement le VPS. |
| Rescue | Mode de depannage, different du demarrage normal sur le disque local. |
| Docker | Technologie qui execute les applications dans des conteneurs. |
| Docker Compose | Fichier et commandes qui orchestrent Nginx, Strapi et PostgreSQL. |
| DNS | Systeme qui fait pointer un nom comme `aysho.tn` vers une adresse IP. |
| HTTPS | HTTP chiffre avec un certificat TLS. |

Architecture finale :

```text
Navigateur
    |
    | ports 80/443
    v
Nginx (frontend React + proxy)
    |
    | reseau Docker interne
    v
Strapi (API)
    |
    | reseau Docker interne
    v
PostgreSQL (base de donnees)
```

## 2. Situation initiale

Le VPS avait l'adresse publique :

```text
149.202.63.51
```

Le systeme installe etait Ubuntu. Le premier acces SSH avec :

```powershell
ssh root@149.202.63.51
```

et avec :

```powershell
ssh ubuntu@149.202.63.51
```

retournait :

```text
Permission denied (publickey,password)
```

Cela signifiait que le serveur repondait bien, mais que les identifiants fournis n'etaient pas acceptes.

## 3. Comprendre la console KVM et le mode Rescue

La console KVM est accessible depuis la page du VPS OVHcloud, dans le menu `...`, puis l'option de console.

Un statut `En rescue` signifie que le VPS a demarre dans un systeme de secours. Ce mode sert a reparer ou recuperer un serveur. Pour un VPS neuf, il faut normalement :

1. Installer Ubuntu normalement si necessaire.
2. Choisir le boot sur le disque local (`LOCAL`).
3. Attendre que le statut redevienne `Actif`.

La console KVM ne gere pas toujours bien le collage avec `Ctrl+V`. Dans ce cas, il faut soit taper manuellement, soit utiliser une connexion SSH depuis PowerShell.

## 4. Generer une nouvelle cle SSH

La cle SSH est generee sur l'ordinateur local, jamais dans le chat et de preference pas directement sur le serveur.

Commande Windows PowerShell :

```powershell
ssh-keygen -t ed25519 -f "$HOME\.ssh\id_ed25519_aysho" -C "aysho-vps"
```

Deux fichiers sont crees :

```text
C:\Users\wassi\.ssh\id_ed25519_aysho       cle privee
C:\Users\wassi\.ssh\id_ed25519_aysho.pub   cle publique
```

Regle de securite :

- Le fichier sans `.pub` est prive et ne doit jamais etre partage.
- Le fichier avec `.pub` peut etre installe sur le VPS.

Pour copier la cle publique dans le presse-papiers :

```powershell
Get-Content "$HOME\.ssh\id_ed25519_aysho.pub" | Set-Clipboard
```

La cle utilisee pour ce VPS avait l'empreinte :

```text
SHA256:3FHAkPpsHFB0+w1K2mIvoDqeTpbbeWG4p6G4X5cpHeI
```

## 5. Reinstallation et premier acces

Le VPS etant neuf, il a ete reinstalle avec Ubuntu. Cette action efface le contenu existant du VPS : elle ne doit jamais etre faite si des donnees importantes sont presentes.

OVH a fourni un acces initial avec :

```text
Utilisateur : ubuntu
Mot de passe : genere par le lien fourni dans l'e-mail OVH
```

Lors de la premiere connexion, Ubuntu a demande de changer le mot de passe. Le mot de passe ne s'affiche pas quand on le tape dans un terminal : c'est normal.

Apres connexion, l'invite ressemblait a :

```text
ubuntu@vps-9c8e3e67:~$
```

Cela confirme que la connexion au VPS a reussi.

## 6. Installer la cle sur le VPS

Depuis la session SSH avec l'utilisateur `ubuntu`, la cle publique a ete ajoutee ainsi :

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
echo 'CLE_PUBLIQUE' >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Ensuite, la connexion sans mot de passe a ete testee depuis PowerShell :

```powershell
ssh -i "$HOME\.ssh\id_ed25519_aysho" `
  -o IdentitiesOnly=yes `
  ubuntu@149.202.63.51
```

Test automatique :

```powershell
ssh -i "$HOME\.ssh\id_ed25519_aysho" `
  -o IdentitiesOnly=yes `
  -o BatchMode=yes `
  ubuntu@149.202.63.51 "echo SSH_OK; whoami; hostname"
```

Resultat attendu :

```text
SSH_OK
ubuntu
vps-9c8e3e67
```

## 7. Avertissement d'empreinte SSH

Apres une reinstallation, la cle d'identite du serveur change. SSH peut afficher :

```text
REMOTE HOST IDENTIFICATION HAS CHANGED
```

Si la reinstallation est bien volontaire, supprimer uniquement l'ancienne empreinte de cette IP :

```powershell
ssh-keygen -R 149.202.63.51
```

Puis refaire une connexion. Cette commande ne supprime pas la cle privee de l'ordinateur.

## 8. Preparation du serveur

Le depot GitHub public du projet est :

```text
https://github.com/king-wassim/AYSHO-Bio.git
```

Le code a ete place dans :

```text
/opt/aysho
```

Le script de preparation du projet a installe :

- Docker Engine
- Docker Compose
- UFW
- fail2ban
- rotation des logs Docker
- cron de renouvellement des certificats

Commande principale :

```bash
cd /opt/aysho
sudo bash deploy/scripts/setup-vps.sh
```

Le pare-feu final autorise seulement :

```text
22/tcp   SSH
80/tcp   HTTP
443/tcp  HTTPS
```

Les ports PostgreSQL `5432` et Strapi `1337` restent internes aux reseaux Docker.

## 9. Le fichier de production `.env`

Le fichier de production est situe sur le VPS :

```text
/opt/aysho/.env
```

Il ne doit jamais etre commite dans Git.

Les secrets internes ont ete generes directement sur le VPS :

- `POSTGRES_PASSWORD`
- `APP_KEYS`
- `API_TOKEN_SALT`
- `ADMIN_JWT_SECRET`
- `JWT_SECRET`
- `TRANSFER_TOKEN_SALT`
- `ENCRYPTION_KEY`

Le fichier a ete protege ainsi :

```bash
chmod 600 /opt/aysho/.env
```

Parametres connus :

```dotenv
AYSHO_DOMAIN=aysho.tn
GHCR_OWNER=king-wassim
IMAGE_TAG=latest
```

Variables qui restent a renseigner avec de vraies valeurs :

```dotenv
CLOUDINARY_NAME=
CLOUDINARY_KEY=
CLOUDINARY_SECRET=
RESEND_API_KEY=
RESEND_TO=
```

Ne jamais envoyer ces valeurs dans un chat. Elles doivent etre saisies directement sur le VPS.

## 10. Pourquoi les images GHCR n'ont pas ete utilisees

Les images :

```text
ghcr.io/king-wassim/aysho-frontend:latest
ghcr.io/king-wassim/aysho-backend:latest
```

etaient privees ou non accessibles au VPS. Docker retournait :

```text
denied
```

La solution a ete de construire les images directement sur le VPS depuis le code present dans `/opt/aysho` :

```bash
sudo docker compose -f docker-compose.production.yml build strapi nginx
sudo docker compose -f docker-compose.production.yml up -d
```

## 11. Corrections necessaires au build Docker

Plusieurs problemes ont ete decouverts et corriges dans les Dockerfiles :

1. Les lockfiles `pnpm-lock.yaml` locaux n'etaient pas suivis par Git. Ils ont ete transferes sur le VPS.
2. Certains lockfiles n'etaient pas synchronises avec `package.json`. Le build utilise donc temporairement `--no-frozen-lockfile`.
3. Le groupe Linux `1000` existait deja dans l'image Alpine. Le conteneur utilise maintenant un groupe `strapi` dedie.
4. Strapi doit utiliser les fichiers JavaScript compiles dans `dist/config` et `dist/src`.
5. Nginx avait besoin de `openssl` pour generer un certificat temporaire.
6. La configuration complete Nginx est montee comme `/etc/nginx/nginx.conf`, et non comme un fichier dans `conf.d`.
7. Le dossier `/app/database/migrations` doit etre accessible a l'utilisateur Strapi.
8. Le demarrage Strapi utilise directement Node pour eviter une installation pnpm au runtime.

## 12. Correction des permissions publiques Strapi

Le frontend appelait notamment :

```text
/api/categories
/api/products
```

Ces routes repondaient initialement :

```json
{"error":{"status":403,"name":"ForbiddenError","message":"Forbidden"}}
```

La base contenait les roles Strapi, mais pas les permissions publiques de lecture.

Les permissions suivantes ont ete activees pour le role `public` :

```text
api::category.category.find
api::category.category.findOne
api::product.product.find
api::product.product.findOne
```

Le bootstrap Strapi du projet cree maintenant ces permissions automatiquement si elles n'existent pas.

## 13. Difference entre le depot GitHub et le dossier local

C'est le point le plus important de notre discussion.

Au debut, le VPS executait le commit GitHub suivant :

```text
1b95f50 docs: add beginner VPS setup guide (setup-vps-guide.md)
```

Vos modifications locales n'etaient pas encore poussees sur GitHub. Un simple `git clone` ne pouvait donc pas les recuperer.

Le dossier local contenait des changements sur :

- `frontend/src/App.tsx`
- `frontend/src/components/Hero.tsx`
- `frontend/src/index.css`
- plusieurs composants frontend
- `backend/src/index.ts`
- la commande et les emails de commande
- le schema de commande
- les fichiers Docker

La solution utilisee a ete :

1. Construire une archive du dossier local.
2. Exclure `.git`, `node_modules`, `.env` et les artefacts de build.
3. Transferer l'archive par `scp`.
4. Extraire l'archive dans `/opt/aysho`.
5. Conserver le `.env` deja present sur le VPS.
6. Reconstruire les images Docker.

Exemple de verification d'une synchronisation :

```powershell
Get-FileHash frontend/src/App.tsx -Algorithm SHA256
```

Puis sur le VPS :

```bash
sha256sum /opt/aysho/frontend/src/App.tsx
```

Les deux empreintes doivent etre identiques.

## 14. Pourquoi les changements n'apparaissaient pas immediatement

Une ancienne image frontend Docker etait encore active. Plusieurs builds lances en parallele utilisaient le meme tag `latest`, ce qui rendait le resultat ambigu.

La solution a ete :

1. Arreter les anciens builds concurrents.
2. Refaire un build frontend sans cache.
3. Recreer le conteneur Nginx.
4. Verifier l'heure de creation de l'image et le nom du bundle Vite.

Commande utile :

```bash
sudo docker compose -f docker-compose.production.yml build --no-cache nginx
sudo docker compose -f docker-compose.production.yml up -d --no-build --pull never nginx
```

Le nouveau bundle frontend a ensuite ete servi par Nginx.

Dans le navigateur, forcer le rechargement avec :

```text
Ctrl + F5
```

## 15. Verification finale

Etat des services :

```bash
sudo docker compose -f /opt/aysho/docker-compose.production.yml ps
```

Resultat attendu :

```text
aysho-nginx      Up (healthy)
aysho-postgres   Up (healthy)
aysho-strapi     Up (healthy)
```

Tests HTTP :

```bash
curl -k -H 'Host: aysho.tn' https://127.0.0.1/health
curl -k -H 'Host: aysho.tn' https://127.0.0.1/api/health
curl -k -H 'Host: aysho.tn' https://127.0.0.1/api/categories
curl -k -H 'Host: aysho.tn' https://127.0.0.1/api/products
```

Les tests finaux ont confirme :

- Nginx sain
- PostgreSQL sain
- Strapi sain
- `/health` retourne `200`
- `/api/health` retourne `200`
- `/api/categories` retourne les categories
- `/api/products` retourne les produits

## 16. Ce qui reste a faire pour une vraie production

### DNS

Dans la zone DNS OVH du domaine `aysho.tn`, creer :

```text
A     @       149.202.63.51
A     www     149.202.63.51
```

Attendre la propagation puis verifier :

```bash
getent hosts aysho.tn
```

### Certificat HTTPS

Quand le DNS pointe correctement vers le VPS :

```bash
cd /opt/aysho
sudo bash deploy/scripts/certbot-init.sh
```

Le certificat temporaire utilise par l'IP sera alors remplace par un certificat Let's Encrypt valide pour `aysho.tn`.

### Cloudinary

Renseigner dans `/opt/aysho/.env` :

```dotenv
CLOUDINARY_NAME=...
CLOUDINARY_KEY=...
CLOUDINARY_SECRET=...
```

Puis recreer Strapi :

```bash
cd /opt/aysho
sudo docker compose -f docker-compose.production.yml up -d --force-recreate strapi
```

### Resend

Pour recevoir les notifications de commande :

```dotenv
RESEND_API_KEY=...
RESEND_FROM=adresse-verifiee@example.com
RESEND_TO=adresse-de-reception@example.com
```

Puis recreer Strapi avec la meme commande.

## 17. Methode recommandee pour les prochains deployements

La methode propre est de commiter les changements puis de les pousser sur GitHub :

```powershell
git add .
git commit -m "Decrire la modification"
git push origin main
```

Ensuite, sur le VPS :

```bash
cd /opt/aysho
git pull origin main
sudo docker compose -f docker-compose.production.yml build strapi nginx
sudo docker compose -f docker-compose.production.yml up -d --no-build --pull never
```

Pour un vrai CD, utiliser GitHub Actions avec des secrets :

```text
VPS_HOST
VPS_USER
VPS_PORT
VPS_SSH_KEY
```

Ne jamais commiter :

- `.env`
- une cle privee SSH
- un token GitHub
- une cle Cloudinary
- une cle Resend
- un mot de passe PostgreSQL

## Resume final

Le VPS est maintenant connecte par SSH avec une cle Ed25519, equipe de Docker, UFW et fail2ban, et execute AYSHO avec Nginx, Strapi et PostgreSQL. La version deployee a ete synchronisee depuis le dossier local et non depuis l'ancien commit GitHub. Les services sont sains et les routes du catalogue repondent correctement. Pour terminer la mise en production, il reste a configurer le DNS, le certificat Let's Encrypt, Cloudinary et Resend.
