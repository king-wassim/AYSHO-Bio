#!/usr/bin/env bash
# ==========================================================================
# AYSHO - Issue Let's Encrypt certificate (HTTP-01 via nginx webroot)
#
# Prerequisites (run as root on the VPS):
#   - DNS A record for aysho.tn (+ www) points to this server's public IP
#   - nginx service is up (it generates a placeholder cert on first boot)
#
# Usage: bash deploy/scripts/certbot-init.sh
# ==========================================================================
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../.."

# shellcheck disable=SC1091
source .env 2>/dev/null || true

DOMAIN="${AYSHO_DOMAIN:-aysho.tn}"
EMAIL="${CERTBOT_EMAIL:-admin@aysho.tn}"

echo "==> Starting nginx to serve the ACME challenge..."
docker compose -f docker-compose.production.yml up -d nginx
sleep 5

echo "==> Removing placeholder certificate for ${DOMAIN}..."
docker run --rm \
  -v aysho_certbot-certs:/etc/letsencrypt \
  alpine sh -c "rm -rf /etc/letsencrypt/live/${DOMAIN}" || true

echo "==> Requesting Let's Encrypt certificate (webroot)..."
docker run --rm \
  -v aysho_certbot-certs:/etc/letsencrypt \
  -v aysho_certbot-challenges:/var/www/certbot \
  certbot/certbot certonly \
    --webroot -w /var/www/certbot \
    -d "${DOMAIN}" -d "www.${DOMAIN}" \
    --email "${EMAIL}" \
    --agree-tos --no-eff-email \
    --non-interactive --keep-until-expiring

echo "==> Reloading nginx with the real certificate..."
docker exec aysho-nginx nginx -s reload || docker compose -f docker-compose.production.yml restart nginx

echo "==> Done. Testing HTTPS..."
curl -fsS "https://${DOMAIN}/health" && echo "HTTPS is live."