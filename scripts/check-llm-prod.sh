#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# CHECK LLM PRODUCTION
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

SECRETS_FILE="${SECRETS_FILE:-/opt/eaf/secrets/.env.production}"
ERRORS=0
WARNINGS=0

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

error() { echo -e "${RED}[ERROR]${NC} $1"; ERRORS=$((ERRORS + 1)); }
ok() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; WARNINGS=$((WARNINGS + 1)); }

echo "═══════════════════════════════════════════════════════════════"
echo "  CHECK LLM PRODUCTION"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Charger les variables
if [[ -f "$SECRETS_FILE" ]]; then
    set -a
    source "$SECRETS_FILE"
    set +a
fi

# 1. Vérifier qu'au moins un provider est configuré
echo "1. Vérification des providers configurés..."

PROVIDERS=()
[[ -n "${MISTRAL_API_KEY:-}" ]] && PROVIDERS+=("mistral")
[[ -n "${GEMINI_API_KEY:-}" ]] && PROVIDERS+=("gemini")
[[ -n "${OPENAI_API_KEY:-}" ]] && PROVIDERS+=("openai")

if [[ ${#PROVIDERS[@]} -eq 0 ]]; then
    error "AUCUN provider LLM configuré!"
    error "Configurez au moins MISTRAL_API_KEY, GEMINI_API_KEY ou OPENAI_API_KEY"
    exit 1
fi

ok "Providers configurés: ${PROVIDERS[*]}"

# 2. Test Mistral
echo ""
echo "2. Test Mistral API..."
if [[ -n "${MISTRAL_API_KEY:-}" ]]; then
    MISTRAL_TEST=$(curl -s -m 10 \
        -H "Authorization: Bearer $MISTRAL_API_KEY" \
        -H "Content-Type: application/json" \
        -d '{"model":"mistral-small-latest","messages":[{"role":"user","content":"test"}],"max_tokens":10}' \
        "https://api.mistral.ai/v1/chat/completions" 2>/dev/null || echo '{}')
    
    if echo "$MISTRAL_TEST" | grep -q '"choices"'; then
        ok "Mistral API répond"
    else
        error "Mistral API ne répond pas correctement"
        echo "  Response: $(echo "$MISTRAL_TEST" | head -100)"
    fi
else
    warn "Mistral non configuré"
fi

# 3. Test Gemini (si configuré)
echo ""
echo "3. Test Gemini API..."
if [[ -n "${GEMINI_API_KEY:-}" ]]; then
    GEMINI_TEST=$(curl -s -m 10 \
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$GEMINI_API_KEY" \
        -H "Content-Type: application/json" \
        -d '{"contents":[{"parts":[{"text":"test"}]}]}' 2>/dev/null || echo '{}')
    
    if echo "$GEMINI_TEST" | grep -q '"candidates"' || echo "$GEMINI_TEST" | grep -q '"content"'; then
        ok "Gemini API répond"
    else
        error "Gemini API ne répond pas correctement"
    fi
else
    warn "Gemini non configuré"
fi

# 4. Configuration router
echo ""
echo "4. Configuration LLM Router..."
if [[ "${LLM_ROUTER_ENABLED:-false}" == "true" ]]; then
    ok "LLM Router activé"
    ok "Ordre des providers: ${LLM_PROVIDER_ORDER:-default}"
else
    warn "LLM Router désactivé - fallback uniquement sur provider principal"
fi

# 5. Timeout
echo ""
echo "5. Configuration timeout..."
TIMEOUT="${LLM_TIMEOUT_MS:-30000}"
ok "Timeout: ${TIMEOUT}ms"

echo ""
if [[ $ERRORS -eq 0 ]]; then
    echo -e "${GREEN}✅ LLM OK${NC}"
    if [[ $WARNINGS -gt 0 ]]; then
        echo -e "${YELLOW}⚠️  $WARNINGS avertissement(s)${NC}"
    fi
    exit 0
else
    echo -e "${RED}❌ LLM ERRORS: $ERRORS${NC}"
    exit 1
fi
