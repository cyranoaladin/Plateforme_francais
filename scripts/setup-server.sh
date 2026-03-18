#!/usr/bin/env bash
# ==============================================================================
# setup-server.sh — First-time server provisioning for Nexus Réussite EAF
# Target: Ubuntu 22.04+ / 24.04 LTS
# Domain: eaf.nexusreussite.academy
# ==============================================================================
set -euo pipefail

DOMAIN="eaf.nexusreussite.academy"
APP_DIR="/opt/eaf_platform"
RESSOURCES_DIR="/srv/eaf_ressources"
APP_USER="eaf"
NODE_VERSION="20"

echo "========================================="
echo "  Nexus Réussite EAF — Server Setup"
echo "  Domain: $DOMAIN"
echo "========================================="

# --- 1. System update ---
echo "[1/9] Mise à jour système..."
apt-get update && apt-get upgrade -y

# --- 2. Install essential packages ---
echo "[2/9] Installation des paquets essentiels..."
apt-get install -y \
  curl wget git build-essential software-properties-common \
  nginx certbot python3-certbot-nginx \
  ufw fail2ban

# --- 3. Install Node.js 20.x ---
echo "[3/9] Installation de Node.js ${NODE_VERSION}.x..."
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
  apt-get install -y nodejs
fi
echo "Node.js $(node -v) installé"
echo "npm $(npm -v) installé"

# --- 4. Install PostgreSQL 16 ---
echo "[4/9] Installation de PostgreSQL 16..."
if ! command -v psql &>/dev/null; then
  sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
  wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
  apt-get update
  apt-get install -y postgresql-16
fi
systemctl enable postgresql
systemctl start postgresql

# --- 5. Install Redis 7 ---
echo "[5/9] Installation de Redis 7..."
if ! command -v redis-server &>/dev/null; then
  apt-get install -y redis-server
fi
systemctl enable redis-server
systemctl start redis-server

# --- 6. Install PM2 ---
echo "[6/9] Installation de PM2..."
npm install -g pm2

# --- 7. Create application user and directory ---
echo "[7/9] Création de l'utilisateur et du répertoire applicatif..."
if ! id "$APP_USER" &>/dev/null; then
  useradd -m -s /bin/bash "$APP_USER"
fi
mkdir -p "$APP_DIR"
mkdir -p "$RESSOURCES_DIR"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
chown -R "$APP_USER:$APP_USER" "$RESSOURCES_DIR"

# --- 8. Configure firewall ---
echo "[8/9] Configuration du pare-feu (UFW)..."
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

# --- 9. Setup PostgreSQL database ---
echo "[9/9] Création de la base de données..."
read -sp "Mot de passe pour l'utilisateur PostgreSQL 'eaf_user': " DB_PASSWORD
echo
sudo -u postgres psql -c "DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'eaf_user') THEN
    CREATE ROLE eaf_user WITH LOGIN PASSWORD '${DB_PASSWORD}';
  END IF;
END \$\$;"
sudo -u postgres psql -c "SELECT 'CREATE DATABASE eaf_db OWNER eaf_user' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'eaf_db');" | sudo -u postgres psql

echo ""
echo "========================================="
echo "  ✅ Setup terminé !"
echo "========================================="
echo ""
echo "Prochaines étapes :"
echo "  1. Configurer .env.local dans $APP_DIR"
echo "     DATABASE_URL=postgresql://eaf_user:$DB_PASSWORD@localhost:5432/eaf_db"
echo "  2. Lancer le déploiement :"
echo "     ./scripts/deploy.sh user@$(hostname -I | awk '{print $1}')"
echo ""
echo "  Le certificat SSL sera généré automatiquement lors du premier déploiement."
echo ""
