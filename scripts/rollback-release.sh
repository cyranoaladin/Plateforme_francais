#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# rollback-release.sh — Canonical rollback script
# Reverts current to previous release, restarts PM2, validates
# Usage: bash /opt/eaf/rollback-release.sh
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

BASE_DIR="/opt/eaf"
RELEASES_DIR="${BASE_DIR}/releases"
CURRENT_LINK="${BASE_DIR}/current"
APP_RUNTIME_USER="nexus"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { printf "${GREEN}[ROLLBACK]${NC} %s\n" "$1"; }
warn() { printf "${YELLOW}[ROLLBACK]${NC} %s\n" "$1"; }
fail() { printf "${RED}[ROLLBACK]${NC} FAIL: %s\n" "$1"; exit 1; }

# ═══════════════════════════════════════════════════════════════
# STEP 1: Identify current and previous release
# ═══════════════════════════════════════════════════════════════
log "Step 1/5: Identifying releases..."
CURRENT_RELEASE=$(readlink -f "$CURRENT_LINK" 2>/dev/null || echo "none")
CURRENT_NAME=$(basename "$CURRENT_RELEASE" 2>/dev/null || echo "none")
log "Current: $CURRENT_NAME ($CURRENT_RELEASE)"

# Find previous release (second most recent by name)
PREVIOUS_NAME=$(ls -1t "$RELEASES_DIR" 2>/dev/null | grep -v "^${CURRENT_NAME}$" | head -1)
if [[ -z "$PREVIOUS_NAME" ]]; then
    fail "No previous release found"
fi
PREVIOUS_RELEASE="${RELEASES_DIR}/${PREVIOUS_NAME}"
log "Target: $PREVIOUS_NAME ($PREVIOUS_RELEASE)"

# ═══════════════════════════════════════════════════════════════
# STEP 2: Validate target release
# ═══════════════════════════════════════════════════════════════
log "Step 2/5: Validating target release..."
if [ ! -f "$PREVIOUS_RELEASE/.next/standalone/server.js" ]; then
    fail "server.js not found in $PREVIOUS_RELEASE"
fi
if [ ! -d "$PREVIOUS_RELEASE/.next/static" ]; then
    fail ".next/static not found in $PREVIOUS_RELEASE"
fi
log "Target release valid"

# ═══════════════════════════════════════════════════════════════
# STEP 3: Switch current
# ═══════════════════════════════════════════════════════════════
log "Step 3/5: Switching current..."
ln -sfn "$PREVIOUS_RELEASE" "$CURRENT_LINK"
log "current -> $(readlink "$CURRENT_LINK") ($(readlink -f "$CURRENT_LINK"))"

# ═══════════════════════════════════════════════════════════════
# STEP 4: Restart PM2 (EAF only, targeted)
# ═══════════════════════════════════════════════════════════════
log "Step 4/5: Restarting PM2 EAF processes..."
sudo -u "$APP_RUNTIME_USER" env HOME="/opt/nexus" PM2_HOME="/opt/nexus/.pm2" \
    pm2 restart eaf-nextjs eaf-worker eaf-mcp --update-env 2>&1 | tail -10

log "Waiting for processes to start..."
sleep 8

# ═══════════════════════════════════════════════════════════════
# STEP 5: Validate
# ═══════════════════════════════════════════════════════════════
log "Step 5/5: Validating..."

# Health check
HEALTH=$(curl -sf --max-time 10 http://127.0.0.1:3000/api/v1/health 2>/dev/null || echo "{}")
STATUS=$(echo "$HEALTH" | python3 -c "import json,sys; print(json.load(sys.stdin).get('status','?'))" 2>/dev/null || echo "?")
DB=$(echo "$HEALTH" | python3 -c "import json,sys; print(json.load(sys.stdin).get('checks',{}).get('db','?'))" 2>/dev/null || echo "?")
if [[ "$STATUS" != "ok" || "$DB" != "ok" ]]; then
    fail "Health check: status=$STATUS db=$DB"
fi
log "Health: status=$STATUS db=$DB"

# PM2 status
PM2_COUNT=$(sudo -u "$APP_RUNTIME_USER" env HOME="/opt/nexus" PM2_HOME="/opt/nexus/.pm2" \
    pm2 list 2>&1 | grep -c "eaf-nextjs.*online\|eaf-worker.*online\|eaf-mcp.*online" || echo "0")
if [[ "$PM2_COUNT" -lt 3 ]]; then
    fail "Not all 3 EAF processes online ($PM2_COUNT/3)"
fi
log "PM2: 3/3 EAF processes online"

# Process CWD
for proc in eaf-nextjs eaf-worker eaf-mcp; do
    PID=$(sudo -u "$APP_RUNTIME_USER" env HOME="/opt/nexus" PM2_HOME="/opt/nexus/.pm2" \
        pm2 id "$proc" 2>/dev/null | tr -d ' ' | grep -oP '^\d+' | head -1)
    if [ -n "$PID" ]; then
        CWD=$(readlink -f "/proc/$PID/cwd" 2>/dev/null || echo "?")
        log "$proc PID=$PID CWD=$CWD"
    fi
done

# Critical checks
log "Running critical checks..."
FAILED=0
for check in check-db-prod.sh check-redis-prod.sh check-runtime-tree.sh check-release-integrity.sh; do
    if sudo -u "$APP_RUNTIME_USER" bash -lc "cd $(readlink -f "$CURRENT_LINK") && bash scripts/$check" >/dev/null 2>&1; then
        log "  $check: PASS"
    else
        warn "  $check: FAIL"
        FAILED=$((FAILED + 1))
    fi
done

if [[ $FAILED -gt 0 ]]; then
    warn "$FAILED checks failed after rollback"
fi

log "═══════════════════════════════════════════════════════════════"
log "ROLLBACK COMPLETE — Now serving: $PREVIOUS_NAME"
log "═══════════════════════════════════════════════════════════════"
