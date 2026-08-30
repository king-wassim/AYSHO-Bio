#!/usr/bin/env bash
# ==========================================================================
# AYSHO - Health checks after deploy
#
# Waits for all services to be healthy, then verifies the public endpoints.
# Exits non-zero on failure (used by deploy.sh to trigger rollback).
# ==========================================================================
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../.."

# shellcheck disable=SC1091
source .env 2>/dev/null || true

DOMAIN="${AYSHO_DOMAIN:-aysho.tn}"

echo "==> Waiting for containers to be healthy..."
timeout 180 bash -c '
  while true; do
    nginx_ok=$(docker inspect --format="{{if .State.Healthy}}1{{else}}0{{end}}" aysho-nginx 2>/dev/null || echo 0)
    strapi_ok=$(docker inspect --format="{{if .State.Healthy}}1{{else}}0{{end}}" aysho-strapi 2>/dev/null || echo 0)
    pg_ok=$(docker inspect --format="{{if .State.Healthy}}1{{else}}0{{end}}" aysho-postgres 2>/dev/null || echo 0)
    if [ "$nginx_ok" = "1" ] && [ "$strapi_ok" = "1" ] && [ "$pg_ok" = "1" ]; then
      echo "  [OK] nginx, strapi and postgres are healthy"
      exit 0
    fi
    sleep 2
  done
' || { echo "ERROR: timed out waiting for healthy containers." >&2; exit 1; }

echo "==> Endpoint checks..."
# Tolerate missing certificate on first boot (placeholder) by allowing insecure.
curl -kfsS "https://${DOMAIN}/health" >/dev/null && echo "  [OK] https://${DOMAIN}/health" || exit 1

strapi_id=$(docker ps -q -f name=aysho-strapi)
docker exec "${strapi_id}" wget -qO- http://localhost:1337/api/health >/dev/null 2>&1 && \
  echo "  [OK] postgres + strapi: /api/health" || { echo "ERROR: strapi health failed." >&2; exit 1; }

echo "==> All health checks passed."