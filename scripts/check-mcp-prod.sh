#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# CHECK MCP PRODUCTION
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

BASE_URL="${E2E_BASE_URL:-https://eaf.nexusreussite.academy}"
MCP_URL="http://localhost:3100"
ERRORS=0

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

error() { echo -e "${RED}[ERROR]${NC} $1"; ERRORS=$((ERRORS + 1)); }
ok() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

echo "═══════════════════════════════════════════════════════════════"
echo "  CHECK MCP PRODUCTION"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Vérifier que MCP écoute sur localhost uniquement
info "Vérification binding réseau..."
if ss -tlnp | grep ":3100" | grep -q "127.0.0.1"; then
    ok "MCP bound to 127.0.0.1:3100 (sécurisé)"
elif ss -tlnp | grep -q ":3100"; then
    error "MCP bound to 0.0.0.0:3100 (DANGER - exposé publiquement!)"
else
    error "MCP not listening on port 3100"
fi

# Health check via proxy API
info "Health check via API..."
HEALTH=$(curl -s "${BASE_URL}/api/mcp/health" 2>/dev/null || echo '{}')
if echo "${HEALTH}" | grep -q '"status":"ok"'; then
    ok "MCP health check OK"
else
    error "MCP health check failed"
fi

# Vérifier process systemd
info "Vérification systemd..."
if systemctl is-active --quiet eaf-mcp; then
    ok "eaf-mcp service active"
else
    error "eaf-mcp service inactive"
fi

echo ""
if [[ ${ERRORS} -eq 0 ]]; then
    echo -e "${GREEN}✅ MCP OK${NC}"
    exit 0
else
    echo -e "${RED}❌ MCP ERRORS: ${ERRORS}${NC}"
    exit 1
fi
