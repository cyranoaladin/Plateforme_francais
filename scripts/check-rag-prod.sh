#!/bin/bash
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

echo "=== CHECK RAG PRODUCTION ==="

if [[ -f "$SECRETS_FILE" ]]; then
    while IFS="=" read -r _k _v; do
        [[ -z "$_k" || "$_k" =~ ^# ]] && continue
        export "$_k=$_v"
    done < <(grep -E "^[A-Za-z_][A-Za-z0-9_]*=" "$SECRETS_FILE")
fi

RAG_API_URL="${RAG_API_URL:-http://127.0.0.1:18001}"

HEALTH=$(curl -s -m 5 "${RAG_API_URL}/health" 2>/dev/null || echo '{}')
if echo "$HEALTH" | grep -q 'healthy\|"ok"'; then
    ok "RAG health: healthy"
else
    error "RAG health: failed"
fi

if [[ -n "${RAG_API_TOKEN:-}" ]]; then
    COLS=$(curl -s -m 5 "${RAG_API_URL}/collections" -H "Authorization: Bearer ${RAG_API_TOKEN}" 2>/dev/null || echo '{}')
    TOTAL=$(echo "$COLS" | python3 -c "import json,sys; print(json.load(sys.stdin).get('total',0))" 2>/dev/null || echo "0")
    if [[ "$TOTAL" -gt 0 ]]; then
        ok "RAG collections: $TOTAL"
    else
        error "RAG collections: 0"
    fi

    SEARCH=$(curl -s -m 10 -X POST "${RAG_API_URL}/search" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${RAG_API_TOKEN}" \
        -d '{"q":"litterature","top_k":2}' 2>/dev/null || echo '{}')
    HITS=$(echo "$SEARCH" | python3 -c "import json,sys; print(len(json.load(sys.stdin).get('hits',[])))" 2>/dev/null || echo "0")
    if [[ "$HITS" -gt 0 ]]; then
        ok "RAG search: $HITS hits"
    else
        error "RAG search: 0 hits"
    fi
else
    error "RAG_API_TOKEN not set"
fi

APP_H=$(curl -s -m 10 "http://127.0.0.1:3000/api/v1/health" 2>/dev/null || echo '{}')
RAG_CK=$(echo "$APP_H" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('checks',{}).get('rag','?'))" 2>/dev/null || echo "?")
if [[ "$RAG_CK" == "ok" ]]; then
    ok "RAG via app health: ok"
else
    warn "RAG via app: $RAG_CK"
fi

if [[ $ERRORS -eq 0 ]]; then ok "PASS"; exit 0; else error "FAIL ($ERRORS)"; exit 1; fi
