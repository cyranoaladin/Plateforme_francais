#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# SERVER HARDENING - Durcissement du serveur production
# À exécuter sur root@88.99.254.59
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

echo "═══════════════════════════════════════════════════════════════"
echo "  HARDENING SERVEUR - Nexus EAF Production"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ═══════════════════════════════════════════════════════════════
# 1. CRÉATION UTILISATEUR DE SERVICE
# ═══════════════════════════════════════════════════════════════
echo "1️⃣ Configuration utilisateur de service..."

if ! id -u eaf &>/dev/null; then
    useradd -r -s /bin/false -d /opt/eaf -m eaf
    echo "✅ Utilisateur 'eaf' créé"
else
    echo "✅ Utilisateur 'eaf' existe déjà"
fi

# Ajouter au groupe www-data si nginx existe
if getent group www-data > /dev/null; then
    usermod -aG www-data eaf
fi

# ═══════════════════════════════════════════════════════════════
# 2. STRUCTURE DE RÉPERTOIRES
# ═══════════════════════════════════════════════════════════════
echo ""
echo "2️⃣ Création de la structure de répertoires..."

mkdir -p /opt/eaf/{releases,shared/{uploads,logs,backups,node_modules},secrets}
chown -R eaf:eaf /opt/eaf
chmod 750 /opt/eaf
chmod 700 /opt/eaf/secrets
chmod 755 /opt/eaf/releases
chmod 755 /opt/eaf/shared
chmod 755 /opt/eaf/shared/{uploads,logs,backups,node_modules}

echo "✅ Structure créée"

# ═══════════════════════════════════════════════════════════════
# 3. SSH HARDENING
# ═══════════════════════════════════════════════════════════════
echo ""
echo "3️⃣ Durcissement SSH..."

SSH_CONFIG="/etc/ssh/sshd_config"

# Backup
cp ${SSH_CONFIG} ${SSH_CONFIG}.bak.$(date +%Y%m%d)

# Appliquer les configurations
sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication no/' ${SSH_CONFIG}
sed -i 's/^#*PermitRootLogin.*/PermitRootLogin prohibit-password/' ${SSH_CONFIG}
sed -i 's/^#*PubkeyAuthentication.*/PubkeyAuthentication yes/' ${SSH_CONFIG}
sed -i 's/^#*MaxAuthTries.*/MaxAuthTries 3/' ${SSH_CONFIG}
sed -i 's/^#*ClientAliveInterval.*/ClientAliveInterval 300/' ${SSH_CONFIG}
sed -i 's/^#*ClientAliveCountMax.*/ClientAliveCountMax 2/' ${SSH_CONFIG}

# Vérifier si une clé SSH existe pour root
if [[ ! -f /root/.ssh/authorized_keys ]] || [[ ! -s /root/.ssh/authorized_keys ]]; then
    echo "⚠️  AVERTISSEMENT: Aucune clé SSH trouvée pour root!"
    echo "    Ne pas redémarrer SSH avant d'avoir configuré une clé!"
else
    systemctl restart sshd
    echo "✅ SSH durci et redémarré"
fi

# ═══════════════════════════════════════════════════════════════
# 4. FIREWALL (UFW)
# ═══════════════════════════════════════════════════════════════
echo ""
echo "4️⃣ Configuration du pare-feu..."

if command -v ufw &>/dev/null; then
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow 22/tcp comment 'SSH'
    ufw allow 80/tcp comment 'HTTP'
    ufw allow 443/tcp comment 'HTTPS'
    ufw allow 3100/tcp comment 'MCP Server (localhost only)'
    
    # Activer
    echo "y" | ufw enable
    
    echo "✅ UFW configuré:"
    ufw status verbose
else
    echo "⚠️  UFW non installé, utilisation d'iptables..."
    # Configuration iptables basique
    iptables -F
    iptables -P INPUT DROP
    iptables -P FORWARD DROP
    iptables -P OUTPUT ACCEPT
    iptables -A INPUT -i lo -j ACCEPT
    iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
    iptables -A INPUT -p tcp --dport 22 -j ACCEPT
    iptables -A INPUT -p tcp --dport 80 -j ACCEPT
    iptables -A INPUT -p tcp --dport 443 -j ACCEPT
    iptables-save > /etc/iptables/rules.v4 2>/dev/null || true
fi

# ═══════════════════════════════════════════════════════════════
# 5. FAIL2BAN
# ═══════════════════════════════════════════════════════════════
echo ""
echo "5️⃣ Configuration fail2ban..."

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

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
EOF

    systemctl restart fail2ban
    echo "✅ fail2ban configuré"
else
    echo "⚠️  fail2ban non installé"
fi

# ═══════════════════════════════════════════════════════════════
# 6. LOGROTATE
# ═══════════════════════════════════════════════════════════════
echo ""
echo "6️⃣ Configuration logrotate..."

cat > /etc/logrotate.d/eaf <<'EOF'
/opt/eaf/shared/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    missingok
    notifempty
    create 0644 eaf eaf
    sharedscripts
    postrotate
        /bin/kill -HUP $(cat /opt/eaf/shared/pm2.pid 2>/dev/null) 2>/dev/null || true
    endscript
}

/var/log/nginx/eaf*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        /usr/sbin/nginx -s reopen
    endscript
}
EOF

echo "✅ logrotate configuré"

# ═══════════════════════════════════════════════════════════════
# 7. SYSTEMD SERVICE
# ═══════════════════════════════════════════════════════════════
echo ""
echo "7️⃣ Configuration systemd..."

cat > /etc/systemd/system/eaf-nextjs.service <<'EOF'
[Unit]
Description=Nexus EAF Next.js Application
After=network.target postgresql.service redis-server.service
Wants=postgresql.service redis-server.service

[Service]
Type=simple
User=eaf
Group=eaf
WorkingDirectory=/opt/eaf/current

# Environment
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOSTNAME=127.0.0.1

# Security
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/eaf/shared/logs /opt/eaf/shared/uploads /tmp
PrivateTmp=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true

# Start
ExecStartPre=/bin/sh -c 'while ss -tlnp | grep -q ":3000"; do sleep 1; done'
ExecStart=/usr/bin/node .next/standalone/server.js

# Restart
Restart=on-failure
RestartSec=5
StartLimitInterval=60s
StartLimitBurst=3

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=eaf-nextjs

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable eaf-nextjs

echo "✅ Service systemd configuré"

# ═══════════════════════════════════════════════════════════════
# 8. LIMITES SYSTÈME
# ═══════════════════════════════════════════════════════════════
echo ""
echo "8️⃣ Configuration des limites système..."

cat >> /etc/security/limits.conf <<EOF
# Nexus EAF limits
eaf soft nofile 65536
eaf hard nofile 65536
eaf soft nproc 4096
eaf hard nproc 4096
EOF

# Optimisations kernel
cat >> /etc/sysctl.conf <<EOF
# Network optimizations
net.ipv4.tcp_max_syn_backlog = 65536
net.core.netdev_max_backlog = 65536
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_keepalive_time = 300
EOF

sysctl -p 2>/dev/null || true

echo "✅ Limites configurées"

# ═══════════════════════════════════════════════════════════════
# 9. BACKUPS AUTOMATIQUES
# ═══════════════════════════════════════════════════════════════
echo ""
echo "9️⃣ Configuration des backups automatiques..."

# Script de backup PostgreSQL
cat > /opt/eaf/scripts/backup-db.sh <<'BACKUPSCRIPT'
#!/bin/bash
set -e

BACKUP_DIR="/opt/eaf/shared/backups"
DB_NAME="eaf_prod"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "${BACKUP_DIR}"

# PostgreSQL backup
if command -v pg_dump &>/dev/null; then
    pg_dump -Fc ${DB_NAME} > "${BACKUP_DIR}/eaf_${DATE}.dump"
    # Garder seulement les 7 derniers jours
    find "${BACKUP_DIR}" -name "eaf_*.dump" -mtime +7 -delete
    echo "Backup DB créé: eaf_${DATE}.dump"
fi

# Backup uploads
if [[ -d /opt/eaf/shared/uploads ]]; then
    tar czf "${BACKUP_DIR}/uploads_${DATE}.tar.gz" -C /opt/eaf/shared uploads
    find "${BACKUP_DIR}" -name "uploads_*.tar.gz" -mtime +7 -delete
    echo "Backup uploads créé: uploads_${DATE}.tar.gz"
fi
BACKUPSCRIPT

chmod +x /opt/eaf/scripts/backup-db.sh

# Cron job
(crontab -l 2>/dev/null | grep -v backup-db.sh || true; echo "0 3 * * * /opt/eaf/scripts/backup-db.sh >> /opt/eaf/shared/logs/backup.log 2>&1") | crontab -

echo "✅ Backups configurés (tous les jours à 3h)"

# ═══════════════════════════════════════════════════════════════
# RÉSUMÉ
# ═══════════════════════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ HARDENING TERMINÉ"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Prochaines étapes:"
echo "  1. Copier les secrets dans /opt/eaf/secrets/.env.production"
echo "  2. Configurer les clés SSH pour l'accès root (si pas déjà fait)"
echo "  3. Exécuter: bash scripts/deploy-production.sh"
echo ""
echo "Vérifications:"
echo "  - Utilisateur: eaf"
echo "  - Répertoire: /opt/eaf/"
echo "  - Service: systemctl status eaf-nextjs"
echo "  - Logs: /opt/eaf/shared/logs/"
echo ""
