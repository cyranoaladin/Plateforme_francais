#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# CHECK ALL PRODUCTION - Master script de validation
# Lance tous les checks de production
# ═══════════════════════════════════════════════════════════════

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ERRORS=0
WARNINGS=0

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

error() { echo -e "${RED}[FAIL]${NC} $1"; ERRORS=$((ERRORS + 1)); }
ok() { echo -e "${GREEN}[PASS]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; WARNINGS=$((WARNINGS + 1)); }
section() { echo -e "${BLUE}[====]${NC} $1"; }

echo "═══════════════════════════════════════════════════════════════"
echo "  MASTER CHECK - PRODUCTION VALIDATION"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Date: $(date)"
echo "Serveur: $(hostname)"
echo ""

# Liste des checks à exécuter
CHECKS=(
    "check-release-integrity.sh:Release Integrity"
    "check-env-production.sh:Environment Variables"
    "check-db-prod.sh:Database"
    "check-redis-prod.sh:Redis"
    "check-mcp-prod.sh:MCP Server"
    "check-worker-prod.sh:Worker Queue"
    "check-llm-prod.sh:LLM Providers"
    "check-rag-prod.sh:RAG Service"
    "check-memory-prod.sh:Memory/Profil/Parcours"
    "check-billing-prod.sh:Billing"
    "smoke-test-production.sh:Smoke Tests HTTP"
)

# Exécuter chaque check
for check_def in "${CHECKS[@]}"; do
    SCRIPT="${check_def%%:*}"
    NAME="${check_def##*:}"
    
    section "Checking: $NAME"
    
    if [[ -f "$SCRIPT_DIR/$SCRIPT" ]]; then
        if bash "$SCRIPT_DIR/$SCRIPT" > /tmp/check-$$.log 2>&1; then
            ok "$NAME"
        else
            error "$NAME"
            cat /tmp/check-$$.log | sed 's/^/    /'
        fi
    else
        warn "$NAME - script non trouvé"
    fi
    echo ""
done

# Résumé
echo "═══════════════════════════════════════════════════════════════"
echo "  RÉSUMÉ"
echo "═══════════════════════════════════════════════════════════════"
echo ""

if [[ $ERRORS -eq 0 && $WARNINGS -eq 0 ]]; then
    echo -e "${GREEN}✅ TOUS LES CHECKS PASSENT${NC}"
    echo ""
    echo "La plateforme est prête pour la production."
    exit 0
elif [[ $ERRORS -eq 0 ]]; then
    echo -e "${YELLOW}⚠️  TOUS LES CHECKS CRITIQUES PASSENT${NC}"
    echo -e "${YELLOW}   $WARNINGS avertissement(s)${NC}"
    echo ""
    echo "La plateforme est fonctionnelle mais avec des avertissements."
    exit 0
else
    echo -e "${RED}❌ $ERRORS CHECK(S) EN ÉCHEC${NC}"
    if [[ $WARNINGS -gt 0 ]]; then
        echo -e "${YELLOW}   $WARNINGS avertissement(s)${NC}"
    fi
    echo ""
    echo "La plateforme N'EST PAS prête pour la production."
    exit 1
fi
