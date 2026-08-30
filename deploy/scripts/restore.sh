#!/usr/bin/env bash
# ==========================================================================
# AYSHO - Restore a PostgreSQL backup
#
# Usage: bash deploy/scripts/restore.sh <->
#        RESTORE_FILE=/opt/aysho/backups/aysho_<stamp>.sql.gz bash deploy/scripts/restore.sh
#
# DANGER: this REPLACES the current database. It is safe to run while the
# strapi container is up (connections get dropped), but for a clean restore
# it is recommended to stop strapi first:
#   docker compose -f docker-compose.production.yml stop strapi
# ==========================================================================
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../.."

# shellcheck disable=SC1091
source .env 2>/dev/null || true

POSTGRES_DB="${POSTGRES_DB:-aysho}"
POSTGRES_USER="${POSTGRES_USER:-aysho}"
BACKUP_DIR="${BACKUP_DIR:-/opt/aysho/backups}"
RESTORE_FILE="${RESTORE_FILE:-}"

if [ -z "${RESTORE_FILE}" ] && [ $# -gt 0 ]; then
  RESTORE_FILE="$1"
fi

if [ -z "${RESTORE_FILE}" ]; then
  echo "ERROR: provide RESTORE_FILE or an argument." >&2
  echo "  bash deploy/scripts/restore.sh /opt/aysho/backups/aysho_20260830_020000.sql.gz" >&2
  exit 1
fi

[ -f "${RESTORE_FILE}" ] || { echo "ERROR: file not found: ${RESTORE_FILE}" >&2; exit 1; }

echo "==> Restoring ${RESTORE_FILE} into database ${POSTGRES_DB}..."
gunzip -c "${RESTORE_FILE}" | docker exec -i aysho-postgres psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}"
echo "    psql restore exit code: $?"

echo "==> Restarting strapi to pick up the restored schema..."
docker compose -f docker-compose.production.yml restart strapi

echo "==> Restore finished."