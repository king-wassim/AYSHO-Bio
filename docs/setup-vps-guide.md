# Guide de mise en production sur le VPS (pas à pas, débutant)

> Objectif : mettre `aysho.tn` en ligne sur un VPS OVHcloud **sans commander
> manuellement Docker/Nginx/Postgres** — nos scripts `deploy/scripts/*.sh` s'occupent
> de l'installation et du lancement. Tu te concentres sur 5 actions manuelles :
> acheter, connecter, copier, renseigner les secrets, pointer le DNS.

Chaque étape précise le concept de cours correspondant (voir `cloud.md`).

---

## Vocabulaire utile avant de commencer

| Terme (cours) | Ici, concrètement |
|----------------|--------------------|
| **VPS** (§31) | La petite machine louée chez OVH : Ubuntu + CPU/RAM/SSD. Chez OVH : « VPS ». |
| **Linux/Ubuntu** (§33) | Le système d'exploitation du VPS. On y tape des commandes via « SSH ». |
| **SSH** | Le tunnel sécurisé qui relie ton terminal à la machine. Équivalent de « Remote Desktop » en ligne de commande. |
| **DNS / Domaine** (§45-46) | `aysho.tn` est un nom lisible ; le **record A (DNS)** dit « ce nom pointe vers l'IP du VPS ». |
| **Firewall (UFW)** | Les serrures du VPS : on n'ouvre que les portes `22` (SSH), `80` (HTTP), `443` (HTTPS). |
| **Docker / Containers** (§5) | Nos 3 applications (Nginx, Strapi, PostgreSQL) tournent dans des containers isolés. |
| **Registry** (§7) | Le dépôt GitHub des images Docker (`ghcr.io/...`). Le VPS les télécharge (`docker pull`). |
| **IaaS** (§25) | OVH fournit la machine, **nous** installons et gérons tout le reste. |

---

## Vue d'ensemble des 8 étapes

1. Acheter le VPS (OVH) → noter l'IP
2. Se connecter en SSH
3. Copier le code sur le VPS (`git clone` + `.env`)
4. Renseigner les secrets dans `.env`
5. Pointer le DNS `aysho.tn` + `www` → IP
6. Lancer l'installation automatique (`setup-vps.sh`)
7. Certificat HTTPS (`certbot-init.sh`) puis démarrage (`deploy.sh`)
8. Vérifier + (option) activer le déploiement auto GitHub

> Ordre important : **DNS avant le certificat** (Let's Encrypt vérifie que le domaine
> pointe vers toi). Et **`.env` avant le déploiement** (sans secrets, Strapi ne démarre pas).

---

## Étape 1 — Acheter le VPS

- OVHcloud → **VPS** → config recommandée : **2 vCPU / 4 Go RAM / ~40 Go NVMe**, OS **Ubuntu 24.04**.
- Note bien **l'adresse IP publique** (ex. `51.210.12.34`) et le **mot de passe root** (ou ta clé SSH).
- Choisis ton répertoire de serveur (ex. Gravelines, Paris, Lyon — peu importe, proche des visiteurs).

> Le VPS est un **IaaS** : OVH te donne la brique brute (CPU/RAM/disque/réseau),
> tout le reste est à toi. Nos scripts automatisent cette partie « toi ».

## Étape 2 — Se connecter en SSH

**Option A — Console web OVH (recommandée pour débuter, rien à installer)**
1. Tableau de bord OVH → ton VPS → **Console** (ou « Open console »).
2. Un terminal web s'ouvre. Identifiant utilisateur : `ubuntu` (image OVH par défaut), mot de passe = celui que tu as défini.
3. Élève tes droits : `sudo -i` (devient root).

**Option B — Depuis Windows (toujours pratique pour la suite)**
- Terminal Windows → `ssh root@<IP>` (ou `ssh ubuntu@<IP>` puis `sudo -i`).

Toutes les commandes suivantes se tapent **dans ce terminal du VPS**.

Vérifie que tu as Internet et du disque :
```bash
ping -c 2 google.com
df -h
```

## Étape 3 — Copier le code sur le VPS

```bash
mkdir -p /opt/aysho && cd /opt/aysho
git clone <URL-de-ton-repo> .
cp .env.example .env
```

- `<URL-de-ton-repo>` = l'URL indiquée par **Code** sur ton dépôt GitHub (HTTPS).
- Si le dépôt est **privé** : GitHub te demandera un identifiant → utilise un
  **Personal Access Token** (GitHub → Settings → Developer settings → Personal access
  tokens, coche `repo`), saisi comme mot de passe.
  *(Sinon : dépôt public, ou clé SSH GitHub, voir tuto GitHub.)*

Vérifie que les fichiers sont là :
```bash
ls -la            # doit montrer docker-compose.production.yml et deploy/
git status        # doit être propre
```

## Étape 4 — Renseigner les secrets dans `.env`

```bash
nano .env         # éditeur simple ; Ctrl+O = sauver, Ctrl+X = quitter
```

Ce fichier (gitignoré, jamais commité) contient les **secrets de production** :

| Variable clé | Que mettre |
|--------------|-----------|
| `GHCR_OWNER` | Ton compte GitHub **en minuscules** |
| `POSTGRES_PASSWORD` | Mot de passe de la base (fort !) |
| `APP_KEYS`, `API_TOKEN_SALT`, `ADMIN_JWT_SECRET`, `JWT_SECRET`, `TRANSFER_TOKEN_SALT`, `ENCRYPTION_KEY` | Clés Strapi (générées ci-dessous) |
| `CLOUDINARY_NAME` / `CLOUDINARY_KEY` / `CLOUDINARY_SECRET` | Depuis ton tableau de bord Cloudinary |
| `CERTBOT_EMAIL` | Un email (avis de renouvellement Let's Encrypt) |
| `SENTRY_ENABLED` | `false` au début, si tu n'utilises pas Sentry |

**Génération des clés (bloc bash, aucun Node requis)** :
```bash
{
  echo "POSTGRES_PASSWORD=$(openssl rand -hex 24)"
  echo "APP_KEYS=$(for i in 1 2 3 4; do openssl rand -hex 24 | tr -d '\n'; echo -n ','; done | sed 's/,$//')"
  for v in API_TOKEN_SALT ADMIN_JWT_SECRET JWT_SECRET TRANSFER_TOKEN_SALT ENCRYPTION_KEY; do echo "$v=$(openssl rand -base64 48)"; done
}
```
Colle le résultat dans les lignes correspondantes de `.env`.

> Concept de cours : **Secret Manager / Secrets** (§15.4) — on ne met JAMAIS ces valeurs
> dans le code Git. Elles restent uniquement sur le VPS, en attendant le passage
> éventuel à un vrai Secret Manager.

## Étape 5 — Pointer le DNS

Dans OVH → **Nom de domaine** `aysho.tn` → **Zone DNS** → ajouter **2 enregistrements A** :
- `aysho.tn` → IP du VPS
- `www` → IP du VPS

Vérifie (la propagation peut prendre quelques minutes) :
```bash
host aysho.tn     # doit retourner l'IP du VPS
ping aysho.tn     # idem
```

> Le DNS (§46) transforme le nom lisible en IP. Sans ces records, le certificat
> HTTPS (`certbot-init.sh`) échouera car Let's Encrypt ne te retrouvera pas.

## Étape 6 — Installation automatique

```bash
cd /opt/aysho
bash deploy/scripts/setup-vps.sh
```

Ce script installe et configure tout en une fois :
- **Docker + Compose** (pour exécuter Nginx/Strapi/PostgreSQL)
- **Firewall UFW** : n'accepte que `22`, `80`, `443` (les autres ports, dont
  Strapi `1337` et PostgreSQL `5432`, restent **privés**) — concept §10.2
- **fail2ban** : bloque les attaques de connexion SSH répétées
- **Cron de renouvellement** du certificat + **rotation des logs Docker**
  (sinon les logs rempliraient le disque de 40 Go)

À la fin, le script affiche un récapitulatif (« NEXT STEPS ») : c'est normal.

## Étape 7 — Lancement du site

```bash
# 1) Certificat HTTPS réel (Let's Encrypt)
cd /opt/aysho
bash deploy/scripts/certbot-init.sh

# 2) Démarrage complet
bash deploy/scripts/deploy.sh
```

Ce que fait chaque script, en clair :
- **certbot-init.sh** → démarre Nginx, crée un certificat valide pour
  `aysho.tn` et `www.aysho.tn` (challenge HTTP), recharge Nginx.
- **deploy.sh** → `docker compose pull` (télécharge tes images depuis GHCR),
  `up -d` (démarre les 3 containers), `healthcheck.sh` (attend que tout soit
  sain), puis teste `https://aysho.tn/health`, `/api/health`, `/api/categories`.

Commandes utiles ensuite :
```bash
docker ps                         # liste des containers en cours
docker logs -f aysho-strapi       # logs de Strapi en direct
docker compose -f docker-compose.production.yml ps   # état des services
```

## Étape 8 — Vérification finale

```bash
curl -fsS https://aysho.tn/health        # → "healthy"
curl -fsS https://aysho.tn/api/health     # → Strapi répond
```
Puis dans le navigateur :
- Boutique : `https://aysho.tn`
- Administration (créer le 1er admin au 1er accès) : `https://aysho.tn/admin`

---

## Étape 9 (optionnelle, recommandée) — Déploiement automatique à chaque `git push`

Le workflow GitHub (`cd.yml`) est prêt. Il ne manque que les accès.

1. Autorise le VPS à recevoir les connexions de GitHub (clé SSH de déploiement) :
   ```bash
   # sur le VPS
   mkdir -p ~/.ssh && chmod 700 ~/.ssh
   # colle ta clé publique (id_ed25519.pub) dans ~/.ssh/authorized_keys
   echo "ssh-ed25519 AAAA... toi@pc" >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   ```
2. Sur GitHub (repo → Settings → Secrets and variables → Actions), ajoute :
   - `VPS_HOST` = IP du VPS
   - `VPS_USER` = `ubuntu` (ou l'utilisateur de déploiement)
   - `VPS_PORT` = `22`
   - `VPS_SSH_KEY` = ta **clé privée** (`cat ~/.ssh/id_ed25519` sur ton PC)
3. Pousse sur `main` : le CD build/push les images GHCR puis SSH déploie sur le VPS.

> Le VPS tire les images depuis GHCR (Registry §7) au lieu de rebuild — rapide et sûr.

---

## Sanctuaire — à ne jamais faire

- ❌ Ne jamais `docker compose down -v` (supprime les données PostgreSQL !)
- ❌ Ne jamais committer `.env` ni les `VPS_SSH_KEY` (secrets §15.4)
- ❌ Ne pas ouvrir 1337/5432 dans le firewall (backups/réseau privé)
- ⚠️ Toujours laisser tourner les scripts à leur fin naturelle (pas de Ctrl+C pendant un `deploy.sh`)

## En cas de pépin

| Symptôme | Action |
|----------|--------|
| Certificat invalide | DNS pas encore propagé → vérifier `host aysho.tn`, re-tenter `certbot-init.sh` |
| Strapi ne démarre pas | `docker logs aysho-strapi` ; souvent un secret manquant dans `.env` |
| Site lent | `docker stats` (RAM/CPU) ; 4 Go suffisent pour ce stack |
| Base morte / panne | Voir [backup-and-recovery.md](./backup-and-recovery.md) — `restore.sh` |

## Liens utiles
- [deployment.md](./deployment.md) — version technique complète
- [architecture.md](./architecture.md) — schémas des flux/réseaux
- [environment.md](./environment.md) — toutes les variables
- [backup-and-recovery.md](./backup-and-recovery.md) — sauvegardes, rollback
- [monitoring-and-telemetry.md](./monitoring-and-telemetry.md) — surveiller le site
- [security.md](./security.md) — bonnes pratiques sécurité