# Sauvegarde & Reprise après sinistre

## Sauvegarde

`deploy/scripts/backup.sh` (à exécuter sur le VPS, en root ou avec accès Docker) :

- Dump PostgreSQL compressé (`pg_dump --no-owner --no-privileges | gzip -9`)
  vers `/opt/aysho/backups/aysho_<horodatage>.sql.gz`.
- Vérification d'intégrité (`gunzip -t`, non-vide).
- Rétention : fichiers plus vieux que `BACKUP_RETENTION_DAYS` (défaut 14) supprimés.
- Copie externe optionnelle si `BACKUP_RCLONE_REMOTE` est renseigné (ex. OVH Object
  Storage via rclone).

Exemple cron (`/etc/cron.d/aysho-backup`) :

```
15 2 * * * root bash /opt/aysho/deploy/scripts/backup.sh >> /var/log/aysho-backup.log 2>&1
```

Recommandations :
- Vérifier une restauration dans un environnement jetable après la première sauvegarde.
- Conserver **au moins une copie hors du VPS** (rclone) : un disque système ne survit pas
  au crash/AI de la machine.

## Restauration

`deploy/scripts/restore.sh` — **remplace la base courante** :

```bash
RESTORE_FILE=/opt/aysho/backups/aysho_<stamp>.sql.gz bash deploy/scripts/restore.sh
```

Ou avec argument :

```bash
bash deploy/scripts/restore.sh /opt/aysho/backups/aysho_<stamp>.sql.gz
```

Pour une restauration propre, arrêter Strapi d'abord :

```bash
docker compose -f docker-compose.production.yml stop strapi
# ... restore.sh ...
docker compose -f docker-compose.production.yml start strapi
```

> Les médias sont dans Cloudinary (SaaS) : aucune restauration nécessaire de ce côté.
> Seule la base de données est restaurée.

## Rollback applicatif

Voir [deployment.md](./deployment.md) → section Rollback. Les données PostgreSQL ne
sont jamais touchées lors d'un rollback (jamais `docker compose down -v`).

## Stratégies de reprise

| Scénario | Procédure |
|----------|-----------|
| VPS down | Redémarrer le VPS : `docker compose -f docker-compose.production.yml up -d` |
| Image cassée | `IMAGE_TAG=<précédent> bash deploy/scripts/rollback.sh` |
| Base corrompue | `restore.sh` avec un dump récent |
| VPS entièrement perdu | Provisionner un nouveau VPS (`setup-vps.sh`), copier le repo + `.env`, restaurer le dernier dump local et/ou rclone |

## Chiffrement des sauvegardes

Les dumps contiennent des données clients. Si la copie externe sort du VPS,
la chiffrer (ex. `gpg -c` ou chiffrement côté remote/object storage).