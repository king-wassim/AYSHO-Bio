# Monitoring & Télémétrie

## Watchdog local (cron)

`deploy/scripts/monitor.sh` vérifie :

- HTTPS `https://aysho.tn/health` et la redirection HTTP `:80`.
- Strapi `/api/health` (depuis le container).
- `pg_isready` (PostgreSQL).
- l'état `healthy` des containers nginx et strapi.

Résultat écrit dans `/opt/aysho/status.json` :

```json
{ "ts": "2026-08-30T02:00:00+00:00", "domain": "aysho.tn", "ok": true }
```

Cron proposé (`/etc/cron.d/aysho-monitor`) :

```
*/2 * * * * root bash /opt/aysho/deploy/scripts/monitor.sh >> /var/log/aysho-monitor.log 2>&1
```

En cas d'échec, le script sort non nul (alerte cron/mail welcome d'utiliser `AUTO_RESTART=true`
pour un redémarrage automatique de strapi/nginx).

## Uptime externe

Pointer un service gratuit (UptimeRobot, StatusCake, Better Stack URL) sur
`https://aysho.tn/health` avec un intervalle de 1-5 min. Ajouter un check HTTP `:80`
(résultat attendu : 301) éventuellement.

## Sentry (erreurs applicatives)

- Activé via `SENTRY_ENABLED=true` et `SENTRY_DSN` dans `.env` (compose → strapi).
- Le DSN n'est jamais exposé publiquement (env avancé au runtime backend seulement).
- Les erreurs frontend sont hors scope à ce stade (option : `@sentry/react` dans le bundle
  avec DSN Vite build-time, réservé).

## Logs

- `docker logs -f aysho-nginx` / `aysho-strapi` / `aysho-postgres`.
- Rotation automatique des logs Docker (10 Mo × 3).
- Logs Nginx : accès (format combiné + `X-Forwarded-For`) et erreurs.

## Performance (repères)

| Check | Valeur cible |
|-------|--------------|
| TTFB API (`/api/categories`) | < 300 ms (LAN VPS / fibre) |
| TTFB statique (asset fingerprinter, cache CDN de Nginx) | < 100 ms |
| Health checks | < 1 s |
| Temps de boot Strapi | 15-45 s (CPU limité à 2 vCPU) |

En cas de saturation : SIGTERM container monitoring, `docker stats`, vérifier le
`pool` DATABASE_POOL_MIN/MAX (2/10) et les buffers PostgreSQL par défaut du 4 GB VPS.