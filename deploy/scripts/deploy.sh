#!/usr/bin/env bash
# ==========================================================================
# AYSHO - Production deploy (run on the VPS, typically triggered by CI/CD)
#
# Flow: login GHCR (optional) -> pull images -> up -d -> smoke tests
# Never runs `docker compose down -v`: postgres data is never deleted.
#
# Usage: IMAGE_TAG=<sha> bash deploy/scripts/deploy.sh
# ==========================================================================
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../.."

# shellcheck disable=SC1091
source .env 2>/dev/null || true

export IMAGE_TAG="${IMAGE_TAG:-latest}"
COMPOSE="docker compose -f docker-compose.production.yml"

# Optional GHCR authentication (for private packages).
# On the VPS create /root/.aysho-ghcr.env:
#   GHCR_USER=your-github-username
#   GHCR_TOKEN=<fine-grained PAT with packages:read>
if [ -f /root/.aysho-ghcr.env ]; then
  # shellcheck disable=SC1091
  source /root/.aysho-ghcr.env
fi
if [ -n "${GHCR_USER:-}" ] && [ -n "${GHCR_TOKEN:-}" ]; then
  echo "==> Logging in to ghcr.io..."
  echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_USER}" --password-stdin
fi

echo "==> Pulling images (tag: ${IMAGE_TAG})..."
$COMPOSE pull

echo "==> Starting / updating services..."
$COMPOSE up -d

echo "==> Running health checks..."
bash deploy/scripts/healthcheck.sh || {
  echo "ERROR: health checks failed after deploy." >&2
  echo "Rollback hint: re-run with previous tag, e.g.:"
  echo "  IMAGE_TAG=<previous-sha> bash deploy/scripts/rollback.sh"
  exit 1
}

echo "==> Smoke tests..."
DOMAIN="${AYSHO_DOMAIN:-aysho.tn}"
curl -fsS "https://${DOMAIN}/health" >/dev/null && echo "  [OK] /health"
curl -fsS "https://${DOMAIN}/api/health" >/dev/null && echo "  [OK] /api/health"
curl -fsS "https://${DOMAIN}/api/categories" >/dev/null && echo "  [OK] /api/categories"

echo "==> Deploy finished successfully. (AYSHO ONLINE)"
$COMPOSE ps