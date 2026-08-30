#!/usr/bin/env bash
# ==========================================================================
# AYSHO - Rollback to a previous image tag
#
# Usage: IMAGE_TAG=<previous-sha> bash deploy/scripts/rollback.sh
#
# Reuses the current compose state (volumes, networks, config) and simply
# swaps the image tag, then verifies health.
# ==========================================================================
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../.."

# shellcheck disable=SC1091
source .env 2>/dev/null || true

if [ -z "${IMAGE_TAG:-}" ]; then
  echo "ERROR: IMAGE_TAG=<previous-sha> is required." >&2
  exit 1
fi

echo "==> Rolling back to IMAGE_TAG=${IMAGE_TAG} ..."
docker compose -f docker-compose.production.yml up -d

echo "==> Verifying health after rollback..."
bash deploy/scripts/healthcheck.sh

echo "==> Rollback complete."