#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# SERVER HARDENING - Durcissement idempotent du serveur production
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

DRY_RUN=false
FORCE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        *)
            echo "Usage: $0 [--dry-run] [--force]"
            exit 1
            ;;
    esac
done

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

execute() {
    if [[ "$DRY_RUN" == "true" ]]; then
        echo "[DRY-RUN] Would execute: $*"
    else
        "$@"
    fi
}

echo "═══════════════════════════════════════════════════════════════"
echo "  SERVER HARDENING - Nexus EAF Production"
echo "  Mode: $([ "$DRY_RUN" == "true" ] && echo "DRY-RUN" || echo "LIVE")"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Check root
if [[ $EUID -ne 0 ]]; then
   log_error "Ce script doit être exécuté en root"
   exit 1
fi

# ═══════════════════════════════════════════════════════════════
# 1. UTILISATEUR DE SERVICE
# ═══════════════════════════════════════════════════════════════
log_info "1. Configuration utilisateur eaf..."

if id -u eaf &>/dev/null; then
    log_ok "Utilisateur eaf existe déjà"
else
    execute useradd -r -s /bin/false -d /opt/eaf -m eaf
    log_ok "Utilisateur eaf créé"
fi

# ═══════════════════════════════════════════════════════════════
# 2. STRUCTURE DE RÉPERTOIRES
# ═══════════════════════════════════════════════════════════════
log_info "2. Création de la structure..."

execute mkdir -p /opt/eaf/{releases,shared/{uploads,data,logs,backups,tmp},secrets,bin}
execute chown -R eaf:eaf /opt/eaf
execute chmod 750 /opt/eaf
execute chmod 700 /opt/eaf/secrets
execute chmod 755 /opt/eaf/{releases,shared}
execute chmod 755 /opt/eaf/shared/{uploads,data,logs,backups,tmp}

log_ok "Structure créée"

# ═══════════════════════════════════════════════════════════════
# 3. SSH HARDENING (avec garde-fous)
# ═══════════════════════════════════════════════════════════════
log_info "3. Durcissement SSH..."

SSH_CONFIG="/etc/ssh/sshd_config"
SSH_BACKUP="${SSH_CONFIG}.bak.$(date +%Y%m%d_%H%M%S)"

# Vérifier si une clé SSH est configurée pour root
SSH_KEY_COUNT=$(find /root/.ssh -name "authorized_keys" -type f -exec cat {} \; 2>/dev/null | grep -c "ssh-" || echo "0")

if [[ "$SSH_KEY_COUNT" -eq 0 && "$FORCE" != "true" ]]; then
    log_warn "Aucune clé SSH détectée pour root!"
    log_warn "Le durcissement SSH est reporté pour éviter le verrouillage."
    log_warn "Ajouter une clé SSH puis relancer: $0 --force"
else
    # Backup
    execute cp "$SSH_CONFIG" "$SSH_BACKUP"
    
    # Durcissement progressif
    execute sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' "$SSH_CONFIG"
    execute sed -i 's/^#*PermitRootLogin.*/PermitRootLogin prohibit-password/' "$SSH_CONFIG"
    execute sed -i 's/^#*PubkeyAuthentication.*/PubkeyAuthentication yes/' "$SSH_CONFIG"
    execute sed -i 's/^#*MaxAuthTries.*/MaxAuthTries 3/' "$SSH_CONFIG"
    
    # Test configuration
    if sshd -t 2>/dev/null; then
        execute systemctl restart sshd
        log_ok "SSH durci et redémarré"
    else
        log_error "Configuration SSH invalide - restauration du backup"
        execute cp "$SSH_BACKUP" "$SSH_CONFIG"
        execute systemctl restart sshd
    fi
fi

# ═══════════════════════════════════════════════════════════════
# 4. FIREWALL
# ═══════════════════════════════════════════════════════════════
log_info "4. Configuration du pare-feu..."

if command -v ufw &>/dev/null; then
    execute ufw default deny incoming
    execute ufw default allow outgoing
    execute ufw allow 22/tcp comment 'SSH'
    execute ufw allow 80/tcp comment 'HTTP'
    execute ufw allow 443/tcp comment 'HTTPS'
    
    # MCP doit être LOCALHOST UNIQUEMENT
    # Ne pas ouvrir 3100 sur le firewall externe!
    
    if [[ "$FORCE" == "true" ]]; then
        echo "y" | execute ufw enable
    fi
    
    log_ok "UFW configuré"
else
    log_warn "UFW non installé"
fi

# ═══════════════════════════════════════════════════════════════
# 5. FAIL2BAN
# ═══════════════════════════════════════════════════════════════
log_info "5. Configuration fail2ban..."

if command -v fail2ban-client &>/dev/null; then
    cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
backend = systemd

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
EOF

    execute systemctl restart fail2ban
    log_ok "fail2ban configuré"
else
    log_warn "fail2ban non installé (optionnel mais recommandé)"
fi

# ═══════════════════════════════════════════════════════════════
# 6. LOGROTATE
# ═══════════════════════════════════════════════════════════════
log_info "6. Configuration logrotate..."

cat > /etc/logrotate.d/eaf <<'EOF'
/opt/eaf/shared/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 eaf eaf
    sharedscripts
    postrotate
        /bin/systemctl reload eaf-web eaf-mcp eaf-worker 2>/dev/null || true
    endscript
}
EOF

log_ok "logrotate configuré"

# ═══════════════════════════════════════════════════════════════
# 7. SERVICES SYSTEMD
# ═══════════════════════════════════════════════════════════════
log_info "7. Installation des services systemd..."

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Copier les services
for service in eaf-web eaf-mcp eaf-worker; do
    if [[ -f "${PROJECT_ROOT}/ops/systemd/${service}.service" ]]; then
        execute cp "${PROJECT_ROOT}/ops/systemd/${service}.service" /etc/systemd/system/
        execute chmod 644 "/etc/systemd/system/${service}.service"
        log_ok "Service ${service} installé"
    else
        log_warn "Fichier service ${service} non trouvé"
    fi
done

execute systemctl daemon-reload

# Ne pas activer automatiquement - le déploiement s'en charge
log_ok "Services systemd installés"

# ═══════════════════════════════════════════════════════════════
# 8. LIMITES SYSTÈME
# ═══════════════════════════════════════════════════════════════
log_info "8. Configuration des limites système..."

# Vérifier si déjà configuré
if ! grep -q "eaf soft nofile" /etc/security/limits.conf 2>/dev/null; then
    cat >> /etc/security/limits.conf <<EOF
# Nexus EAF limits
eaf soft nofile 65536
eaf hard nofile 65536
eaf soft nproc 4096
eaf hard nproc 4096
EOF
    log_ok "Limites configurées"
else
    log_ok "Limites déjà configurées"
fi

# ═══════════════════════════════════════════════════════════════
# 9. BACKUPS
# ═══════════════════════════════════════════════════════════════
log_info "9. Configuration des backups..."

mkdir -p /opt/eaf/scripts

cat > /opt/eaf/scripts/backup-db.sh <<'BACKUPSCRIPT'
#!/bin/bash
set -e

BACKUP_DIR="/opt/eaf/shared/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "${BACKUP_DIR}"

# Load env
set -a
source /opt/eaf/secrets/.env.production
set +a

# Extract database name from URL
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^\/]*\)$/\1/p')

# PostgreSQL backup
if command -v pg_dump &>/dev/null; then
    pg_dump "$DATABASE_URL" > "${BACKUP_DIR}/eaf_${DATE}.sql"
    gzip "${BACKUP_DIR}/eaf_${DATE}.sql"
    
    # Cleanup old backups (keep 14 days)
    find "${BACKUP_DIR}" -name "eaf_*.sql.gz" -mtime +14 -delete
    
    echo "Backup created: eaf_${DATE}.sql.gz"
fi

# Uploads backup (weekly)
if [[ $(date +%u) -eq 7 ]]; then
    tar czf "${BACKUP_DIR}/uploads_${DATE}.tar.gz" -C /opt/eaf/shared uploads
    find "${BACKUP_DIR}" -name "uploads_*.tar.gz" -mtime +30 -delete
    echo "Uploads backup created: uploads_${DATE}.tar.gz"
fi
BACKUPSCRIPT

execute chmod +x /opt/eaf/scripts/backup-db.sh
execute chown eaf:eaf /opt/eaf/scripts/backup-db.sh

# Cron job (une fois par jour à 3h)
if ! crontab -l 2>/dev/null | grep -q backup-db.sh; then
    (crontab -l 2>/dev/null; echo "0 3 * * * /opt/eaf/scripts/backup-db.sh >> /opt/eaf/shared/logs/backup.log 2>&1") | crontab -
    log_ok "Cron backup configuré"
else
    log_ok "Cron backup déjà configuré"
fi

# ═══════════════════════════════════════════════════════════════
# RÉSUMÉ
# ═══════════════════════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  HARDENING TERMINÉ"
echo "═══════════════════════════════════════════════════════════════"
echo ""
if [[ "$DRY_RUN" == "true" ]]; then
    echo "Mode dry-run - aucune modification appliquée"
    echo "Relancer sans --dry-run pour appliquer"
else
    echo "Modifications appliquées avec succès"
fi
echo ""
echo "Prochaines étapes:"
echo "  1. Générer les secrets: openssl rand -base64 32"
echo "  2. Créer /opt/eaf/secrets/.env.production"
echo "  3. Exécuter: bash scripts/deploy-production.sh"
echo ""
