#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# CHECK WORKER PRODUCTION
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

ERRORS=0

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

error() { echo -e "${RED}[ERROR]${NC} $1"; ERRORS=$((ERRORS + 1)); }
ok() { echo -e "${GREEN}[OK]${NC} $1"; }

echo "═══════════════════════════════════════════════════════════════"
echo "  CHECK WORKER PRODUCTION"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Vérifier process systemd
if systemctl is-active --quiet eaf-worker; then
    ok "eaf-worker service active"
else
    error "eaf-worker service inactive"
fi

# Vérifier logs récents (pas d'erreurs critiques)
RECENT_ERRORS=$(journalctl -u eaf-worker --since "5 minutes ago" -p err 2>/dev/null | wc -l)
if [[ ${RECENT_ERRORS} -eq 0 ]]; then
    ok "Pas d'erreurs récentes dans les logs"
else
    error "${RECENT_ERRORS} erreurs récentes dans les logs"
fi

# Vérifier que le worker consomme des jobs (vérifier activité)
RECENT_LOGS=$(journalctl -u eaf-worker --since "1 minute ago" 2>/dev/null | wc -l)
if [[ ${RECENT_LOGS} -gt 0 ]]; then
    ok "Worker produit des logs (actif)"
else
    warn "Worker peu de logs récents"
fi

echo ""
if [[ ${ERRORS} -eq 0 ]]; then
    echo -e "${GREEN}✅ WORKER OK${NC}"
    exit 0
else
    echo -e "${RED}❌ WORKER ERRORS: ${ERRORS}${NC}"
    exit 1
fi
