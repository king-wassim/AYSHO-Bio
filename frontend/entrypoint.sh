#!/bin/sh
# AYSHO nginx entrypoint.
# If the Let's Encrypt certificate is not yet present (first boot, before the
# certbot-init step), generate a throwaway self-signed certificate so that
# nginx can start and serve the HTTP-01 ACME challenge on port 80.
set -e

DOMAIN="${AYSHO_DOMAIN:-aysho.tn}"
LIVE="/etc/letsencrypt/live/$DOMAIN"

if [ ! -f "$LIVE/fullchain.pem" ] || [ ! -f "$LIVE/privkey.pem" ]; then
    echo "AYSHO nginx: no certificate for $DOMAIN yet, generating a placeholder..."
    mkdir -p "$LIVE"
    openssl req -x509 -nodes -newkey rsa:2048 -days 90 \
        -keyout "$LIVE/privkey.pem" \
        -out "$LIVE/fullchain.pem" \
        -subj "/CN=$DOMAIN" >/dev/null 2>&1
    echo "AYSHO nginx: placeholder certificate created for $DOMAIN"
fi

exec nginx -g 'daemon off;'