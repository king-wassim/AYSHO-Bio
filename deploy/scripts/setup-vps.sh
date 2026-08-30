#!/usr/bin/env bash
# ==========================================================================
# AYSHO - One-time VPS provisioning (OVHcloud, Ubuntu 22.04/24.04)
#
# Run as root:  bash deploy/scripts/setup-vps.sh
#
# What it does:
#   - installs Docker Engine + Compose plugin
#   - configures UFW firewall (22, 80, 443)
#   - installs and configures fail2ban for SSH attacks
#   - installs the certificate renewal cron job
#   - creates /opt/aysho and recommends a dedicated deploy user
# ==========================================================================
set -euo pipefail

if [ "$(id -u)" -ne 0 ]; then
  echo "ERROR: run as root (sudo)." >&2
  exit 1
fi

APP_DIR="${APP_DIR:-/opt/aysho}"
DOMAIN="${AYSHO_DOMAIN:-aysho.tn}"

echo "==> 1/5 Installing Docker (official repository)..."
if ! command -v docker >/dev/null 2>&1; then
  apt-get update -y
  apt-get install -y ca-certificates curl gnupg
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
    gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "${VERSION_CODENAME}") stable" > \
    /etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
  systemctl enable --now docker
fi
echo "    Docker: $(docker --version)"
echo "    Compose: $(docker compose version)"

echo "==> 2/5 Configuring UFW firewall..."
apt-get install -y ufw >/dev/null 2>&1 || true
ufw default deny incoming >/dev/null 2>&1 || true
ufw default allow outgoing >/dev/null 2>&1 || true
ufw allow 22/tcp comment 'SSH' >/dev/null 2>&1 || true
ufw allow 80/tcp comment 'HTTP' >/dev/null 2>&1 || true
ufw allow 443/tcp comment 'HTTPS' >/dev/null 2>&1 || true
ufw --force enable
ufw status verbose

echo "==> 3/5 Installing fail2ban..."
apt-get install -y fail2ban >/dev/null 2>&1 || true
cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime  = 1h
findtime = 10m
maxretry = 5
backend  = auto

[sshd]
enabled = true
port    = ssh
logpath = %(sshd_log)s
maxretry = 5
EOF
systemctl enable --now fail2ban
fail2ban-client status sshd || true

echo "==> 4/5 Installing certificate renewal cron..."
mkdir -p "${APP_DIR}"
cat > /etc/cron.d/aysho-renew <<EOF
# Renew Let's Encrypt certificates daily at 03:30 (randomized) and reload nginx
30 3 * * * root bash ${APP_DIR}/deploy/scripts/certbot-renew.sh >> /var/log/aysho-certbot-renew.log 2>&1
EOF
chmod 644 /etc/cron.d/aysho-renew
echo "    Cron installed: /etc/cron.d/aysho-renew"

echo "==> 5/5 Docker log rotation (avoid filling the 30-40 GB disk)..."
cat > /etc/docker/daemon.json <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
systemctl restart docker || true

echo ""
echo "==============================================================="
echo " NEXT STEPS"
echo "==============================================================="
echo " 1. Deploy your application:"
echo "    mkdir -p ${APP_DIR} && cd ${APP_DIR}"
echo "    git clone <repo> .   (or copy the repository files)"
echo "    cp .env.example .env && nano .env   # fill in REAL secrets"
echo "    bash deploy/scripts/deploy.sh"
echo " 2. Point DNS: A record aysho.tn -> <public IP>  (TTL 300)"
echo "    Optional: A record www.aysho.tn -> <public IP>"
echo " 3. Issue the HTTPS certificate:"
echo "    bash deploy/scripts/certbot-init.sh"
echo " 4. (Recommended) Create a dedicated deploy user and use SSH keys:"
echo "    adduser deploy && usermod -aG sudo,docker deploy"
echo "    sudo -u deploy ssh-keygen -t ed25519"
echo "    # add deploy key to ~/.ssh/authorized_keys and to GitHub Deploy keys"
echo "==============================================================="