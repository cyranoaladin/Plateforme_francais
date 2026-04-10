#!/bin/bash
# Installe les crons de backup et monitoring
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup-postgres.sh"
MONITOR_SCRIPT="$SCRIPT_DIR/health-monitor.sh"

# Rendre les scripts exécutables
chmod +x "$BACKUP_SCRIPT"
chmod +x "$MONITOR_SCRIPT"

# Créer le cron pour le backup quotidien à 2h du matin
(crontab -l 2>/dev/null || true) | grep -v "backup-postgres.sh" | \
    { cat; echo "0 2 * * * $BACKUP_SCRIPT >> /var/log/eaf/backup.log 2>&1"; } | crontab -

# Créer le cron pour le monitoring (démarrage au boot)
(crontab -l 2>/dev/null || true) | grep -v "health-monitor.sh" | \
    { cat; echo "@reboot $MONITOR_SCRIPT >> /var/log/eaf/monitor.log 2>&1"; } | crontab -

# Démarrer le monitoring immédiatement
nohup "$MONITOR_SCRIPT" > /var/log/eaf/monitor.log 2>&1 &

echo "✅ Crons installés:"
echo "  - Backup PostgreSQL: tous les jours à 2h00"
echo "  - Health monitoring: démarré et au boot"
echo ""
echo "Logs:"
echo "  - Backup: /var/log/eaf/backup.log"
echo "  - Monitor: /var/log/eaf/monitor.log"
