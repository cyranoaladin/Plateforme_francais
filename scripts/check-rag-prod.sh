#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# CHECK RAG PRODUCTION
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

SECRETS_FILE="${SECRETS_FILE:-/opt/eaf/secrets/.env.production}"
BASE_URL="${E2E_BASE_URL:-https://eaf.nexusreussite.academy}"
ERRORS=0

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

error() { echo -e "${RED}[ERROR]${NC} $1"; ERRORS=$((ERRORS + 1)); }
ok() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

echo "═══════════════════════════════════════════════════════════════"
echo "  CHECK RAG PRODUCTION"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Charger les variables
if [[ -f "$SECRETS_FILE" ]]; then
    set -a
    source "$SECRETS_FILE"
    set +a
fi

RAG_API_URL="${RAG_API_URL:-}"

if [[ -z "$RAG_API_URL" ]]; then
    warn "RAG_API_URL non configuré - RAG non disponible"
    exit 0
fi

# 1. Health check endpoint
echo "1. Health check RAG..."
HEALTH=$(curl -s -m 5 "${BASE_URL}/api/v1/rag/health" 2>/dev/null || echo '{}')

if echo "$HEALTH" | grep -q '"status":"ok"' || echo "$HEALTH" | grep -q '"status":"healthy"'; then
    ok "RAG health endpoint OK"
else
    error "RAG health endpoint failed"
    echo "  Response: $HEALTH"
fi

# 2. Test requête RAG
echo ""
echo "2. Test requête RAG..."
QUERY_PAYLOAD='{"query":"méthode dissertation","top_k":3}'
RESPONSE=$(curl -s -m 10 -X POST \
    -H "Content-Type: application/json" \
    -d "$QUERY_PAYLOAD" \
    "${BASE_URL}/api/v1/rag/search" 2>/dev/null || echo '{}')

# Vérifier si c'est un tableau de résultats ou une erreur
if echo "$RESPONSE" | grep -q '\[.*\]'; then
    RESULTS_COUNT=$(echo "$RESPONSE" | grep -o '"id"' | wc -l)
    if [[ $RESULTS_COUNT -gt 0 ]]; then
        ok "RAG retourne $RESULTS_COUNT résultats"
    else
        warn "RAG retourne 0 résultats (peut être normal)"
    fi
elif echo "$RESPONSE" | grep -q 'error'; then
    error "RAG retourne une erreur"
    echo "  Response: $RESPONSE"
else
    warn "Réponse RAG inattendue"
fi

# 3. Vérifier timeout
echo ""
echo "3. Vérification timeout..."
START_TIME=$(date +%s%N)
curl -s -m 5 "${BASE_URL}/api/v1/rag/search" -X POST \
    -H "Content-Type: application/json" \
    -d '{"query":"test"}' > /dev/null 2>&1 || true
END_TIME=$(date +%s%N)
ELAPSED_MS=$(( (END_TIME - START_TIME) / 1000000 ))

if [[ $ELAPSED_MS -lt 5000 ]]; then
    ok "Temps de réponse: ${ELAPSED_MS}ms"
else
    warn "Temps de réponse lent: ${ELAPSED_MS}ms"
fi

echo ""
if [[ $ERRORS -eq 0 ]]; then
    echo -e "${GREEN}✅ RAG OK${NC}"
    exit 0
else
    echo -e "${RED}❌ RAG ERRORS: $ERRORS${NC}"
    exit 1
fi
