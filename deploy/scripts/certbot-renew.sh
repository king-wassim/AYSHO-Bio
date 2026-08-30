#!/usr/bin/env bash
# ==========================================================================
# AYSHO - Renew Let's Encrypt certificate (webroot via nginx) and reload nginx
#
# Intended to run daily from cron (see /etc/cron.d/aysho-renew on the VPS).
# This script runs on the HOST and reloads nginx through `docker exec`.
# ==========================================================================
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../.."

# shellcheck disable=SC1091
source .env 2>/dev/null || true

DOMAIN="${AYSHO_DOMAIN:-aysho.tn}"

echo "==> [$(date)] Renewing certificates for ${DOMAIN}..."

docker run --rm \
  -v aysho_certbot-certs:/etc/letsencrypt \
  -v aysho_certbot-challenges:/var/www/certbot \
  certbot/certbot renew \
    --webroot -w /var/www/certbot \
    --non-interactive --quiet

echo "==> Reloading nginx (picks up renewed certificates if any)..."
docker exec aysho-nginx nginx -s reload || true

echo "==> [$(date)] Renewal pass finished."