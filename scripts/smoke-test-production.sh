#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# SMOKE TEST PRODUCTION
# Tests de santé rapides à exécuter sur le serveur de production
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

BASE_URL="${E2E_BASE_URL:-https://eaf.nexusreussite.academy}"
TIMEOUT=10
ERRORS=0

echo "═══════════════════════════════════════════════════════════════"
echo "  SMOKE TESTS - Production"
echo "  URL: ${BASE_URL}"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok() { echo -e "${GREEN}✅${NC} $1"; }
warn() { echo -e "${YELLOW}⚠️${NC} $1"; }
error() { echo -e "${RED}❌${NC} $1"; ERRORS=$((ERRORS + 1)); }

# ═══════════════════════════════════════════════════════════════
# 1. HEALTH CHECK BASIQUE
# ═══════════════════════════════════════════════════════════════
echo "1️⃣ Health Check HTTP..."

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time ${TIMEOUT} "${BASE_URL}/" || echo "000")
if [[ "${HTTP_CODE}" == "200" ]]; then
    ok "Homepage HTTP 200"
else
    error "Homepage HTTP ${HTTP_CODE}"
fi

# ═══════════════════════════════════════════════════════════════
# 2. API HEALTH
# ═══════════════════════════════════════════════════════════════
echo ""
echo "2️⃣ API Health Check..."

API_HEALTH=$(curl -s --max-time ${TIMEOUT} "${BASE_URL}/api/v1/health" || echo '{}')
if echo "${API_HEALTH}" | grep -q '"status":"ok"'; then
    ok "API Health OK"
else
    error "API Health failed"
    echo "    Response: ${API_HEALTH}"
fi

# ═══════════════════════════════════════════════════════════════
# 3. PAGES PUBLIQUES CRITIQUES
# ═══════════════════════════════════════════════════════════════
echo ""
echo "3️⃣ Pages publiques..."

PAGES=(
    "/login"
    "/pricing"
    "/contact"
    "/cgu"
    "/cgv"
    "/mentions-legales"
    "/politique-de-confidentialite"
)

for page in "${PAGES[@]}"; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time ${TIMEOUT} "${BASE_URL}${page}" || echo "000")
    if [[ "${HTTP_CODE}" == "200" ]]; then
        ok "${page} - HTTP 200"
    else
        error "${page} - HTTP ${HTTP_CODE}"
    fi
done

# ═══════════════════════════════════════════════════════════════
# 4. REDIRECTIONS HTTPS
# ═══════════════════════════════════════════════════════════════
echo ""
echo "4️⃣ Sécurité HTTPS..."

# Vérifier les headers de sécurité
HEADERS=$(curl -sI --max-time ${TIMEOUT} "${BASE_URL}/" || echo "")
if echo "${HEADERS}" | grep -qi "strict-transport-security"; then
    ok "HSTS header present"
else
    warn "HSTS header manquant"
fi

# ═══════════════════════════════════════════════════════════════
# 5. API CSRF
# ═══════════════════════════════════════════════════════════════
echo ""
echo "5️⃣ API CSRF Token..."

CSRF_RESPONSE=$(curl -s --max-time ${TIMEOUT} "${BASE_URL}/api/v1/csrf" || echo '{}')
if echo "${CSRF_RESPONSE}" | grep -q '"token"'; then
    ok "CSRF token endpoint OK"
else
    error "CSRF token endpoint failed"
fi

# ═══════════════════════════════════════════════════════════════
# 6. RAG HEALTH
# ═══════════════════════════════════════════════════════════════
echo ""
echo "6️⃣ RAG Health..."

RAG_HEALTH=$(curl -s --max-time ${TIMEOUT} "${BASE_URL}/api/v1/rag/health" || echo '{}')
if echo "${RAG_HEALTH}" | grep -q '"status"'; then
    ok "RAG Health endpoint accessible"
else
    warn "RAG Health endpoint non disponible (peut être normal)"
fi

# ═══════════════════════════════════════════════════════════════
# 7. MCP HEALTH
# ═══════════════════════════════════════════════════════════════
echo ""
echo "7️⃣ MCP Health..."

MCP_HEALTH=$(curl -s --max-time ${TIMEOUT} "${BASE_URL}/api/mcp/health" || echo '{}')
if echo "${MCP_HEALTH}" | grep -q '"status"'; then
    ok "MCP Health endpoint OK"
else
    warn "MCP Health endpoint non disponible"
fi

# ═══════════════════════════════════════════════════════════════
# 8. ROBOTS.TXT & SITEMAP
# ═══════════════════════════════════════════════════════════════
echo ""
echo "8️⃣ SEO Fichiers..."

ROBOTS=$(curl -s -o /dev/null -w "%{http_code}" --max-time ${TIMEOUT} "${BASE_URL}/robots.txt" || echo "000")
if [[ "${ROBOTS}" == "200" ]]; then
    ok "robots.txt accessible"
else
    warn "robots.txt non accessible (HTTP ${ROBOTS})"
fi

SITEMAP=$(curl -s -o /dev/null -w "%{http_code}" --max-time ${TIMEOUT} "${BASE_URL}/sitemap.xml" || echo "000")
if [[ "${SITEMAP}" == "200" ]]; then
    ok "sitemap.xml accessible"
else
    warn "sitemap.xml non accessible (HTTP ${SITEMAP})"
fi

# ═══════════════════════════════════════════════════════════════
# 9. TEMPS DE RÉPONSE
# ═══════════════════════════════════════════════════════════════
echo ""
echo "9️⃣ Performance (TTFB)..."

TTFB=$(curl -s -o /dev/null -w "%{time_starttransfer}" --max-time ${TIMEOUT} "${BASE_URL}/" || echo "999")
TTFB_MS=$(echo "${TTFB} * 1000" | bc | cut -d. -f1)

if [[ ${TTFB_MS} -lt 500 ]]; then
    ok "TTFB: ${TTFB_MS}ms (excellent)"
elif [[ ${TTFB_MS} -lt 1000 ]]; then
    ok "TTFB: ${TTFB_MS}ms (bon)"
elif [[ ${TTFB_MS} -lt 2000 ]]; then
    warn "TTFB: ${TTFB_MS}ms (acceptable)"
else
    error "TTFB: ${TTFB_MS}ms (lent)"
fi

# ═══════════════════════════════════════════════════════════════
# RÉSULTAT
# ═══════════════════════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════════════════════════"
if [[ ${ERRORS} -eq 0 ]]; then
    echo -e "  ${GREEN}✅ SMOKE TESTS PASSÉS${NC}"
    echo "═══════════════════════════════════════════════════════════════"
    exit 0
else
    echo -e "  ${RED}❌ ${ERRORS} ERREUR(S)${NC}"
    echo "═══════════════════════════════════════════════════════════════"
    exit 1
fi
