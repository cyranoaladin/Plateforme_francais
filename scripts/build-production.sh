#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# BUILD PRODUCTION — Canonical build script for server-side builds
# Usage: bash scripts/build-production.sh
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DATA_SYMLINK="$APP_DIR/.data/uploads"
DATA_SYMLINK_TARGET=""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() { printf "${GREEN}[BUILD]${NC} %s\n" "$1"; }
warn() { printf "${YELLOW}[WARN]${NC} %s\n" "$1"; }
fail() { printf "${RED}[FAIL]${NC} %s\n" "$1"; exit 1; }

log "Starting production build from $APP_DIR"

# Step 1: Handle .data symlink that breaks Turbopack
if [ -L "$DATA_SYMLINK" ]; then
    DATA_SYMLINK_TARGET=$(readlink "$DATA_SYMLINK")
    warn "Detected .data/uploads symlink -> $DATA_SYMLINK_TARGET"
    warn "Removing temporarily (Turbopack rejects symlinks outside project root)"
    rm "$DATA_SYMLINK"
    log "Symlink removed temporarily"
else
    log "No .data/uploads symlink found (clean)"
fi

# Step 2: Export required env
export DATABASE_URL="${DATABASE_URL:-postgresql://eaf_user:eaf_password@localhost:5433/eaf_prod}"
export DIRECT_URL="${DIRECT_URL:-postgresql://eaf_user:eaf_password@localhost:5433/eaf_prod}"
export NODE_ENV=production

log "DB: ${DATABASE_URL%%:*}:...@${DATABASE_URL##*@}"

# Step 3: Build
log "Running npm run build..."
cd "$APP_DIR"
if npm run build; then
    log "Build succeeded"
else
    if [ -n "$DATA_SYMLINK_TARGET" ] && [ ! -L "$DATA_SYMLINK" ]; then
        ln -s "$DATA_SYMLINK_TARGET" "$DATA_SYMLINK"
        warn "Restored .data/uploads symlink after build failure"
    fi
    fail "Build failed"
fi

# Step 4: Restore symlink
if [ -n "$DATA_SYMLINK_TARGET" ] && [ ! -L "$DATA_SYMLINK" ]; then
    ln -s "$DATA_SYMLINK_TARGET" "$DATA_SYMLINK"
    log "Restored .data/uploads -> $DATA_SYMLINK_TARGET"
fi

# Step 5: Verify
if [ -f "$APP_DIR/.next/standalone/server.js" ]; then
    log "server.js: OK"
else
    fail "server.js not found in standalone"
fi

if [ -d "$APP_DIR/.next/static" ]; then
    log ".next/static: OK"
else
    fail ".next/static not found"
fi

log "Production build complete"
