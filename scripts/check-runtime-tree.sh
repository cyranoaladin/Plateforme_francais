#!/bin/bash
set -euo pipefail
ERRORS=0
RED='\033[0;31m'; GREEN='\033[0;32m'; NC='\033[0m'
error() { echo -e "${RED}[ERROR]${NC} $1"; ERRORS=$((ERRORS + 1)); }
ok() { echo -e "${GREEN}[OK]${NC} $1"; }

echo "=== CHECK RUNTIME TREE ==="

CURRENT=$(readlink -f /opt/eaf/current)

# 1. Symlink
if [[ -L /opt/eaf/current ]]; then
    ok "Symlink -> $(readlink /opt/eaf/current)"
else
    error "Not a symlink"
fi

# 2. Release dir
if [[ -d "$CURRENT" ]]; then
    ok "Release: $CURRENT"
else
    error "Release dir missing"
fi

# 3. Build artifacts
[[ -d "$CURRENT/.next/standalone" ]] && ok ".next/standalone exists" || error ".next/standalone missing"
[[ -d "$CURRENT/.next/static" ]] && ok ".next/static exists" || error ".next/static missing"
[[ -f "$CURRENT/.next/standalone/server.js" ]] && ok "server.js exists" || error "server.js missing"

# 4. node_modules not a symlink
if [[ ! -L "$CURRENT/node_modules" ]]; then
    ok "node_modules is real dir"
else
    error "node_modules is symlink"
fi

# 5. Shared uploads
if [[ -d /opt/eaf/shared/uploads ]]; then
    COPIES=$(find /opt/eaf/shared/uploads/copies -type f 2>/dev/null | wc -l)
    DOCS=$(find /opt/eaf/shared/uploads/documents -type f 2>/dev/null | wc -l)
    ok "Shared uploads: $COPIES copies, $DOCS docs"
else
    error "Shared uploads missing"
fi

# 6. .data/uploads
if [[ -d "$CURRENT/.data/uploads" || -L "$CURRENT/.data/uploads" ]]; then
    ok ".data/uploads -> $(readlink -f $CURRENT/.data/uploads 2>/dev/null || echo local)"
else
    error ".data/uploads missing"
fi

if [[ $ERRORS -eq 0 ]]; then ok "PASS"; exit 0; else error "FAIL ($ERRORS)"; exit 1; fi
