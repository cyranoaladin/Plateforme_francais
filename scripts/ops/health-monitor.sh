#!/bin/bash
# Monitoring health check avec alerting
set -euo pipefail

HEALTH_URL="https://eaf.nexusreussite.academy/api/v1/health"
ALERT_EMAIL="contact@nexusreussite.academy"
LOG_FILE="/var/log/eaf/health-monitor.log"
PID_FILE="/var/run/eaf-health-monitor.pid"

mkdir -p "$(dirname "$LOG_FILE")"

# Vérifier si déjà en cours
if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
    exit 0
fi
echo $$ > "$PID_FILE"

trap 'rm -f "$PID_FILE"; exit' INT TERM EXIT

check_health() {
    local response
    local http_code
    
    response=$(curl -s -w "\n%{http_code}" "$HEALTH_URL" --max-time 10 || echo "\n000")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" != "200" ]; then
        echo "[$(date)] ALERT: Health check failed (HTTP $http_code)"
        echo "[$(date)] Response: $body"
        
        # Envoyer alerte (si mail configuré)
        if command -v mail >/dev/null 2>&1; then
            echo "Health check failed: HTTP $http_code
URL: $HEALTH_URL
Time: $(date)
Response: $body" | mail -s "[EAF ALERT] Health Check Failed" "$ALERT_EMAIL"
        fi
        
        # Redémarrer les services si nécessaire
        if [ "$http_code" == "000" ] || [ "$http_code" == "502" ] || [ "$http_code" == "503" ]; then
            echo "[$(date)] Attempting service restart..."
            pm2 restart eaf-nextjs-blue eaf-worker eaf-mcp || true
        fi
        
        return 1
    fi
    
    echo "[$(date)] Health check OK"
    return 0
}

# Boucle infinie - check toutes les 5 minutes
while true; do
    check_health >> "$LOG_FILE" 2>&1
    sleep 300
done
