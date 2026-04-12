#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# CHECK LLM PRODUCTION — Robuste
# ═══════════════════════════════════════════════════════════════
set -euo pipefail
SECRETS_FILE="${SECRETS_FILE:-/opt/eaf/secrets/.env.production}"
ERRORS=0
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
error() { printf "${RED}[ERROR]${NC} %s\n" "$1"; ERRORS=$((ERRORS + 1)); }
ok() { printf "${GREEN}[OK]${NC} %s\n" "$1"; }
warn() { printf "${YELLOW}[WARN]${NC} %s\n" "$1"; }

echo "=== CHECK LLM PRODUCTION ==="

# Load env
if [[ -f "$SECRETS_FILE" ]]; then
    while IFS="=" read -r _k _v; do
        [[ -z "$_k" || "$_k" =~ ^# ]] && continue
        export "$_k=$_v"
    done < <(grep -E "^[A-Za-z_][A-Za-z0-9_]*=" "$SECRETS_FILE")
fi

# 1. Config check
echo "1. Configuration LLM..."
if [[ -n "${MISTRAL_API_KEY:-}" ]]; then
    ok "MISTRAL_API_KEY configuré"
else
    error "MISTRAL_API_KEY non configuré"
fi

if [[ -n "${MISTRAL_STANDARD_MODEL:-}" ]]; then
    ok "Model: $MISTRAL_STANDARD_MODEL"
else
    warn "MISTRAL_STANDARD_MODEL non configuré"
fi

# 2. Test Mistral API with minimal request (safe, non-destructive)
echo ""
echo "2. Test API Mistral..."
if [[ -n "${MISTRAL_API_KEY:-}" ]]; then
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 https://api.mistral.ai/v1/models \
        -H "Authorization: Bearer ${MISTRAL_API_KEY}" 2>/dev/null || echo "000")
    if [[ "$STATUS" == "200" ]]; then
        ok "Mistral API reachable (HTTP $STATUS)"
    elif [[ "$STATUS" == "401" || "$STATUS" == "403" ]]; then
        warn "Mistral API responded but auth issue (HTTP $STATUS)"
    elif [[ "$STATUS" == "503" || "$STATUS" == "502" ]]; then
        warn "Mistral API temporarily unavailable (HTTP $STATUS)"
    elif [[ "$STATUS" == "429" ]]; then
        warn "Mistral API rate limited (HTTP $STATUS)"
    else
        error "Mistral API unreachable (HTTP $STATUS)"
    fi
else
    error "Cannot test API: no key"
fi

# 3. App health validates LLM integration
echo ""
echo "3. LLM via app health..."
APP_HEALTH=$(curl -s -m 10 "http://127.0.0.1:3000/api/v1/health" 2>/dev/null || echo '{}')
LLM_CHECK=$(echo "$APP_HEALTH" | python3 -c "import json,sys; print(json.load(sys.stdin).get('env',{}).get('llm','?'))" 2>/dev/null || echo "?")
if [[ "$LLM_CHECK" == "ok" ]]; then
    ok "App LLM integration: ok"
else
    error "App LLM integration: $LLM_CHECK"
fi

if [[ $ERRORS -eq 0 ]]; then ok "PASS"; exit 0; else error "FAIL ($ERRORS)"; exit 1; fi
