#!/usr/bin/env bash
# ==========================================================================
# AYSHO - Monitoring watchdog
#
# Checks HTTP/HTTPS endpoints every N seconds and writes a status file.
# Optionally restarts unhealthy containers. Intended to run under cron
# (see /etc/cron.d/aysho-monitor) or the `systemd` timer of your choice.
#
# Cron example (/etc/cron.d/aysho-monitor), every 2 minutes:
#   */2 * * * * root bash /opt/aysho/deploy/scripts/monitor.sh >> /var/log/aysho-monitor.log 2>&1
#
# External uptime: point UptimeRobot / StatusCake at https://aysho.tn/health
# ==========================================================================
set -uo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/../.."

# shellcheck disable=SC1091
source .env 2>/dev/null || true

DOMAIN="${AYSHO_DOMAIN:-aysho.tn}"
STATUS_FILE="${STATUS_FILE:-/opt/aysho/status.json}"
AUTO_RESTART="${AUTO_RESTART:-false}"
FAILED=0

check() { # check <name> <command...>
  local name="$1"; shift
  if "$@" >/dev/null 2>&1; then
    echo "  [OK] ${name}"
  else
    echo "  [FAIL] ${name}"
    FAILED=1
  fi
}

echo "==> [$(date)] Monitoring ${DOMAIN}..."

check "https ${DOMAIN}/health"            curl -kfsS "https://${DOMAIN}/health"
check "http  ${DOMAIN}/ (redirect)"       curl -fsSI "http://${DOMAIN}/" -o /dev/null
check "strapi /api/health"                docker exec aysho-strapi wget -qO- "http://localhost:1337/api/health"
check "postgres pg_isready"               docker exec aysho-postgres pg_isready -U "${POSTGRES_USER:-aysho}" -d "${POSTGRES_DB:-aysho}"
check "nginx container healthy"           docker inspect --format "{{.State.Health.Status}}" aysho-nginx | grep -q healthy
check "strapi container healthy"          docker inspect --format "{{.State.Health.Status}}" aysho-strapi | grep -q healthy

{
  echo "{"
  echo "  \"ts\": \"$(date -Iseconds)\","
  echo "  \"domain\": \"${DOMAIN}\","
  echo "  \"ok\": $([ "$FAILED" -eq 0 ] && echo true || echo false)"
  echo "}"
} > "${STATUS_FILE}"

if [ "$FAILED" -ne 0 ] && [ "${AUTO_RESTART}" = "true" ]; then
  echo "==> Unhealthy; restarting failed containers..."
  docker compose -f docker-compose.production.yml restart strapi nginx
fi

[ "$FAILED" -eq 0 ] || { echo "==> Monitoring FAILED [$(date)]" >&2; exit 1; }
echo "==> Monitoring OK [$(date)]"