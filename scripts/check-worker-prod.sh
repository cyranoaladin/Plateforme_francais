#!/bin/bash
set -euo pipefail
ERRORS=0
export HOME=/opt/nexus
export PM2_HOME=/opt/nexus/.pm2
warn() { printf "${YELLOW}[WARN]${NC} %s\n" "$1"; }
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
error() { printf "${RED}[ERROR]${NC} %s\n" "$1"; ERRORS=$((ERRORS + 1)); }
ok() { printf "${GREEN}[OK]${NC} %s\n" "$1"; }

echo "=== CHECK WORKER PRODUCTION ==="

if pm2 describe eaf-worker 2>/dev/null | grep -q "status.*online"; then
    ok "Worker PM2: online"
else
    error "Worker PM2: not online"
fi

UNSTABLE=$(pm2 describe eaf-worker 2>/dev/null | grep "unstable restarts" | awk -F"|" '{print $4}' | tr -d ' ' || echo "?")
if [[ "$UNSTABLE" == "0" ]]; then
    ok "Unstable restarts: 0"
else
    warn "Unstable restarts: $UNSTABLE"
fi

ERR_LINES=$(tail -50 /var/log/pm2/eaf-worker-error.log 2>/dev/null | grep -ci "error\|fail" || true)
if [[ "$ERR_LINES" -eq 0 ]]; then
    ok "No errors in recent logs"
else
    warn "$ERR_LINES error lines in logs"
fi

DLQ=$(redis-cli LLEN "bull:correction-jobs-dlq:wait" 2>/dev/null || echo "0")
if [[ "$DLQ" == "0" ]]; then
    ok "DLQ empty"
else
    warn "DLQ: $DLQ jobs"
fi

if [[ $ERRORS -eq 0 ]]; then ok "PASS"; exit 0; else error "FAIL ($ERRORS)"; exit 1; fi
