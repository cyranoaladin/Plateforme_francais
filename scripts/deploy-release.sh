#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# deploy-release.sh — Canonical release deployment script
# Creates a NEW immutable release, builds, switches current, restarts PM2
# Usage: bash /opt/eaf/deploy-release.sh
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

BASE_DIR="/opt/eaf"
RELEASES_DIR="${BASE_DIR}/releases"
SECRETS_DIR="${BASE_DIR}/secrets"
CURRENT_LINK="${BASE_DIR}/current"
APP_RUNTIME_USER="nexus"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
NEW_RELEASE="${RELEASES_DIR}/${TIMESTAMP}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { printf "${GREEN}[DEPLOY]${NC} %s\n" "$1"; }
warn() { printf "${YELLOW}[DEPLOY]${NC} %s\n" "$1"; }
fail() { printf "${RED}[DEPLOY]${NC} FAIL: %s\n" "$1"; exit 1; }

# ═══════════════════════════════════════════════════════════════
# STEP 1: Create new release directory
# ═══════════════════════════════════════════════════════════════
log "Step 1/8: Creating new release ${TIMESTAMP}..."
mkdir -p "$NEW_RELEASE"

# Get current source
OLD_RELEASE=$(readlink -f "$CURRENT_LINK" 2>/dev/null || echo "none")
if [[ "$OLD_RELEASE" == "none" || ! -d "$OLD_RELEASE" ]]; then
    fail "Cannot find current release source"
fi
log "Source: $OLD_RELEASE"

# ═══════════════════════════════════════════════════════════════
# STEP 2: Copy canonical source to new release
# ═══════════════════════════════════════════════════════════════
log "Step 2/8: Copying canonical source..."
# Copy everything except node_modules, .next, and runtime data
rsync -a \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.data' \
    "$OLD_RELEASE/" "$NEW_RELEASE/"

log "Source copied to $NEW_RELEASE"

# ═══════════════════════════════════════════════════════════════
# STEP 3: Install dependencies reproducibly from lockfile
# ═══════════════════════════════════════════════════════════════
log "Step 3/9: Installing dependencies via npm ci..."
# npm ci is idempotent and reproducible from package-lock.json
# It removes existing node_modules and installs exactly from the lockfile
if sudo -u "$APP_RUNTIME_USER" bash -lc "cd $NEW_RELEASE && npm ci --ignore-scripts --no-audit --no-fund"; then
    log "Dependencies installed reproducibly from lockfile"
else
    fail "npm ci failed in $NEW_RELEASE"
fi

# ═══════════════════════════════════════════════════════════════
# STEP 4: Setup .data symlink
# ═══════════════════════════════════════════════════════════════
log "Step 4/9: Setting up .data symlink..."
mkdir -p "$NEW_RELEASE/.data"
ln -sfn /opt/eaf/shared/data/uploads "$NEW_RELEASE/.data/uploads"

# ═══════════════════════════════════════════════════════════════
# STEP 4: Build
# ═══════════════════════════════════════════════════════════════
log "Step 5/9: Building..."

# Remove .data symlink before build (Turbopack rejects symlinks outside root)
rm "$NEW_RELEASE/.data/uploads"
log "Temporarily removed .data/uploads symlink for build"

# Build
BUILD_ENV="
export DATABASE_URL=postgresql://eaf_user:eaf_password@localhost:5433/eaf_prod
export DIRECT_URL=postgresql://eaf_user:eaf_password@localhost:5433/eaf_prod
export NODE_ENV=production
cd $NEW_RELEASE
npm run build
"

if sudo -u "$APP_RUNTIME_USER" bash -lc "$BUILD_ENV"; then
    log "Build succeeded"
else
    # Restore symlink before failing
    ln -sfn /opt/eaf/shared/data/uploads "$NEW_RELEASE/.data/uploads"
    fail "Build failed in $NEW_RELEASE"
fi

# Restore .data symlink
ln -sfn /opt/eaf/shared/data/uploads "$NEW_RELEASE/.data/uploads"
log "Restored .data/uploads symlink"

# Verify standalone
if [ ! -f "$NEW_RELEASE/.next/standalone/server.js" ]; then
    ln -sfn /opt/eaf/shared/data/uploads "$NEW_RELEASE/.data/uploads"
    fail "server.js not found in standalone"
fi

if [ ! -d "$NEW_RELEASE/.next/static" ]; then
    fail ".next/static not found"
fi

# ═══════════════════════════════════════════════════════════════
# STEP 5: Clean standalone
# ═══════════════════════════════════════════════════════════════
log "Step 6/9: Cleaning standalone..."
SA="$NEW_RELEASE/.next/standalone"
rm -rf "$SA/tests" "$SA/docs" "$SA/scripts" "$SA/src" "$SA/prisma" "$SA/packages"
rm -rf "$SA/nexus-routes" "$SA/dist"
rm -f "$SA/docker-compose.e2e.yml" "$SA/.antigravity" "$SA/.archives" "$SA/.github" "$SA/.vscode"
rm -f "$SA/eaf.code-workspace" "$SA/arborescence-eaf.txt" "$SA/PLANS_AND_QUOTAS.md"
rm -f "$SA/CHANGELOG.md" "$SA/README.md"
rm -f "$SA/vitest.config.ts" "$SA/playwright.config.ts" "$SA/eslint.config.mjs"
rm -f "$SA/knip.json" "$SA/tsconfig.json" "$SA/tsconfig.test.json" "$SA/tsconfig.worker.json"
rm -f "$SA/postcss.config.mjs" "$SA/next.config.ts" "$SA/middleware.ts" "$SA/package-lock.json"
rm -f "$SA/deploy.sh" "$SA/nginx-eaf.conf" "$SA/ecosystem.config.cjs"
rm -f "$SA/.env.production" 2>/dev/null
rm -rf "$SA/emails" "$SA/ops" "$SA/config" 2>/dev/null

# Copy release metadata
cp "$NEW_RELEASE/.git_sha" "$SA/.git_sha" 2>/dev/null || true
cp "$NEW_RELEASE/.build_time" "$SA/.build_time" 2>/dev/null || true

# Generate RELEASE.json
GIT_SHA=$(cat "$NEW_RELEASE/.git_sha" 2>/dev/null || echo "unknown")
BUILD_TIME=$(cat "$NEW_RELEASE/.build_time" 2>/dev/null || date -u +%Y-%m-%dT%H:%M:%SZ)
cat > "$NEW_RELEASE/RELEASE.json" << EOF
{"version":"1.0.2","git_sha":"$GIT_SHA","build_time":"$BUILD_TIME","release":"$TIMESTAMP","node_env":"production"}
EOF
cp "$NEW_RELEASE/RELEASE.json" "$SA/RELEASE.json" 2>/dev/null || true

log "Standalone cleaned: $(du -sh --exclude=node_modules "$SA" | cut -f1)"

# ═══════════════════════════════════════════════════════════════
# STEP 6: Switch current symlink
# ═══════════════════════════════════════════════════════════════
log "Step 7/9: Switching current..."
ln -sfn "$NEW_RELEASE" "$CURRENT_LINK"
log "current -> $(readlink "$CURRENT_LINK") ($(readlink -f "$CURRENT_LINK"))"

# ═══════════════════════════════════════════════════════════════
# STEP 7: Restart PM2 (EAF only, targeted)
# ═══════════════════════════════════════════════════════════════
log "Step 8/9: Restarting PM2 EAF processes..."
sudo -u "$APP_RUNTIME_USER" env HOME="/opt/nexus" PM2_HOME="/opt/nexus/.pm2" \
    pm2 restart eaf-nextjs eaf-worker eaf-mcp --update-env 2>&1 | tail -10

# Wait for startup
log "Waiting for processes to start..."
sleep 8

# ═══════════════════════════════════════════════════════════════
# STEP 8: Validate
# ═══════════════════════════════════════════════════════════════
log "Step 9/9: Validating..."

# Health check
HEALTH=$(curl -sf --max-time 10 http://127.0.0.1:3000/api/v1/health 2>/dev/null || echo "{}")
STATUS=$(echo "$HEALTH" | python3 -c "import json,sys; print(json.load(sys.stdin).get('status','?'))" 2>/dev/null || echo "?")
DB=$(echo "$HEALTH" | python3 -c "import json,sys; print(json.load(sys.stdin).get('checks',{}).get('db','?'))" 2>/dev/null || echo "?")
if [[ "$STATUS" != "ok" || "$DB" != "ok" ]]; then
    warn "Health check: status=$STATUS db=$DB"
    fail "Health check failed after deploy"
fi
log "Health: status=$STATUS db=$DB"

# PM2 status
PM2_STATUS=$(sudo -u "$APP_RUNTIME_USER" env HOME="/opt/nexus" PM2_HOME="/opt/nexus/.pm2" \
    pm2 list 2>&1 | grep -c "eaf-nextjs.*online\|eaf-worker.*online\|eaf-mcp.*online" || echo "0")
if [[ "$PM2_STATUS" -lt 3 ]]; then
    fail "Not all 3 EAF processes online ($PM2_STATUS/3)"
fi
log "PM2: 3/3 EAF processes online"

# Process CWD verification
for proc in eaf-nextjs eaf-worker eaf-mcp; do
    PID=$(sudo -u "$APP_RUNTIME_USER" env HOME="/opt/nexus" PM2_HOME="/opt/nexus/.pm2" \
        pm2 id "$proc" 2>/dev/null | tr -d ' ' | grep -oP '^\d+' | head -1)
    if [ -n "$PID" ]; then
        CWD=$(readlink -f "/proc/$PID/cwd" 2>/dev/null || echo "?")
        log "$proc PID=$PID CWD=$CWD"
    fi
done

# Run critical checks
log "Running critical checks..."
CRITICAL_CHECKS="check-db-prod.sh check-redis-prod.sh check-rag-prod.sh check-mcp-prod.sh check-worker-prod.sh check-runtime-tree.sh check-release-integrity.sh"
FAILED=0
for check in $CRITICAL_CHECKS; do
    if sudo -u "$APP_RUNTIME_USER" bash -lc "cd $NEW_RELEASE && bash scripts/$check" >/dev/null 2>&1; then
        log "  $check: PASS"
    else
        warn "  $check: FAIL"
        FAILED=$((FAILED + 1))
    fi
done

if [[ $FAILED -gt 0 ]]; then
    fail "$FAILED/$CRITICAL_CHECKS failed"
fi

log "═══════════════════════════════════════════════════════════════"
log "DEPLOYMENT COMPLETE — Release $TIMESTAMP"
log "Release: $NEW_RELEASE"
log "Current: $(readlink -f "$CURRENT_LINK")"
log "═══════════════════════════════════════════════════════════════"
