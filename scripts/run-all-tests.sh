#!/bin/bash
set -e

echo "════════════════════════════════════════════════════════════"
echo "  NEXUS RÉUSSITE — SCRIPT D'EXÉCUTION COMPLÈTE DES TESTS"
echo "════════════════════════════════════════════════════════════"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

echo "📋 Phase 1 — Tests unitaires et intégration"
echo "────────────────────────────────────────────────────────────"
if npm test; then
    echo -e "${GREEN}✅ Tests unitaires : PASSÉS${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ Tests unitaires : ÉCHEC${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

echo "📋 Phase 2 — Tests MCP"
echo "────────────────────────────────────────────────────────────"
if (cd packages/mcp-server && npm test); then
    echo -e "${GREEN}✅ Tests MCP : PASSÉS${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ Tests MCP : ÉCHEC${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

echo "📋 Phase 3 — Build CI"
echo "────────────────────────────────────────────────────────────"
if npm run build:ci; then
    echo -e "${GREEN}✅ Build CI : RÉUSSI${NC}"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${RED}❌ Build CI : ÉCHEC${NC}"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo ""

echo "⚠️  Phase 4 — Tests nécessitant serveur dev"
echo "────────────────────────────────────────────────────────────"
echo -e "${YELLOW}Les tests suivants nécessitent un serveur Next.js actif :${NC}"
echo ""
echo "  1. Tests de contrats API :"
echo "     npm run test:contracts"
echo "     npm run test:contracts:auth"
echo "     npm run test:contracts:teacher-rbac"
echo ""
echo "  2. Tests E2E Playwright :"
echo "     npm run test:e2e"
echo ""
echo "  3. Tests visuels :"
echo "     npm run test:visual"
echo "     npm run test:visual:public"
echo "     npm run test:visual:connected"
echo "     npm run test:visual:mobile"
echo ""
echo -e "${YELLOW}Pour exécuter ces tests :${NC}"
echo "  1. Terminal 1 : npm run dev"
echo "  2. Terminal 2 : npm run test:contracts && npm run test:e2e && npm run test:visual"
echo ""

echo "════════════════════════════════════════════════════════════"
echo "  RÉSUMÉ FINAL"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Tests exécutés : $TOTAL_TESTS"
echo -e "${GREEN}Tests passés   : $PASSED_TESTS${NC}"
if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${RED}Tests échoués  : $FAILED_TESTS${NC}"
fi
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ TOUS LES TESTS EXÉCUTABLES ONT RÉUSSI${NC}"
    echo ""
    echo "⚠️  Tests restants nécessitent serveur dev actif"
    echo "   Infrastructure : 100% prête"
    echo "   Exécution     : Manuelle requise"
    exit 0
else
    echo -e "${RED}❌ CERTAINS TESTS ONT ÉCHOUÉ${NC}"
    echo ""
    echo "Veuillez corriger les erreurs avant de continuer."
    exit 1
fi
