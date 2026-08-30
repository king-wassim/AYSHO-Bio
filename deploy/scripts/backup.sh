#!/usr/bin/env bash
# ==========================================================================
# AYSHO - PostgreSQL backup
#
# - pg_dump to /opt/aysho/backups (kept for BACKUP_RETENTION_DAYS days)
# - optional copy to external storage via rclone (BACKUP_RCLONE_REMOTE)
# - never touches running containers; reads from the postgres container
#
# Cron example (/etc/cron.d/aysho-backup):
#   15 2 * * * root bash /opt/aysho/deploy/scripts/backup.sh >> /var/log/aysho-backup.log 2>&1
# ==========================================================================
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../.."

# shellcheck disable=SC1091
source .env 2>/dev/null || true

POSTGRES_DB="${POSTGRES_DB:-aysho}"
POSTGRES_USER="${POSTGRES_USER:-aysho}"
BACKUP_DIR="${BACKUP_DIR:-/opt/aysho/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
RCLONE_REMOTE="${BACKUP_RCLONE_REMOTE:-}"

mkdir -p "${BACKUP_DIR}"

STAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/${POSTGRES_DB}_${STAMP}.sql.gz"

echo "==> [$(date)] Dumping database ${POSTGRES_DB}..."
docker exec aysho-postgres pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" \
  --no-owner --no-privileges \
  | gzip -9 > "${BACKUP_FILE}"

SIZE="$(du -h "${BACKUP_FILE}" | cut -f1)"
echo "    Backup written: ${BACKUP_FILE} (${SIZE})"

# Sanity check: the dump must be a valid gzip with content.
gunzip -t "${BACKUP_FILE}" || { echo "ERROR: backup is corrupt, removing." >&2; rm -f "${BACKUP_FILE}"; exit 1; }
[ -s "${BACKUP_FILE}" ] || { echo "ERROR: backup is empty, removing." >&2; rm -f "${BACKUP_FILE}"; exit 1; }

echo "==> Pruning backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "${POSTGRES_DB}_*.sql.gz" -mtime "+${RETENTION_DAYS}" -delete

if [ -n "${RCLONE_REMOTE}" ]; then
  echo "==> Copying backup to rclone remote: ${RCLONE_REMOTE}..."
  rclone copy "${BACKUP_FILE}" "${RCLONE_REMOTE}" || echo "    WARN: rclone copy failed, local backup retained."
fi

echo "==> [$(date)] Backup finished."