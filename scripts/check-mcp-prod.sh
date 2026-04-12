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

echo "=== CHECK MCP PRODUCTION ==="

if [[ -f "$SECRETS_FILE" ]]; then
    while IFS="=" read -r _k _v; do
        [[ -z "$_k" || "$_k" =~ ^# ]] && continue
        export "$_k=$_v"
    done < <(grep -E "^[A-Za-z_][A-Za-z0-9_]*=" "$SECRETS_FILE")
fi

MCP_PORT="${MCP_PORT:-3100}"
MCP_URL="http://127.0.0.1:${MCP_PORT}"

if ss -tlnp 2>/dev/null | grep -q ":${MCP_PORT} "; then
    ok "MCP listening on port $MCP_PORT"
else
    error "MCP not on port $MCP_PORT"
fi

HEALTH_CODE=$(curl -s -m 5 -o /dev/null -w "%{http_code}" "${MCP_URL}/health" 2>/dev/null || echo "000")
if [[ "$HEALTH_CODE" == "200" ]]; then
    ok "MCP health: 200"
else
    warn "MCP health: $HEALTH_CODE"
fi

if [[ -n "${MCP_API_KEY:-}" ]]; then
    TOOLS=$(curl -s -m 10 "${MCP_URL}/mcp" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer ${MCP_API_KEY}" \
        -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' 2>/dev/null || echo '{}')
    COUNT=$(echo "$TOOLS" | python3 -c "import json,sys; d=json.load(sys.stdin); print(len(d.get('result',{}).get('tools',[])))" 2>/dev/null || echo "0")
    if [[ "$COUNT" -gt 0 ]]; then
        ok "MCP tools: $COUNT available"
    else
        error "MCP tools: 0"
    fi

    TNAME=$(echo "$TOOLS" | python3 -c "
import json,sys
d=json.load(sys.stdin)
tools=d.get('result',{}).get('tools',[])
for t in tools:
    n=t.get('name','')
    if 'stats' in n.lower() or 'usage' in n.lower():
        print(n); break
else:
    print(tools[0]['name'] if tools else '')
" 2>/dev/null || echo "")
    if [[ -n "$TNAME" ]]; then
        CALL=$(curl -s -m 15 "${MCP_URL}/mcp" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${MCP_API_KEY}" \
            -d "{\"jsonrpc\":\"2.0\",\"id\":2,\"method\":\"tools/call\",\"params\":{\"name\":\"$TNAME\",\"arguments\":{}}}" 2>/dev/null || echo '{}')
        HAS_ERR=$(echo "$CALL" | python3 -c "import json,sys; print('error' in json.load(sys.stdin))" 2>/dev/null || echo "true")
        if [[ "$HAS_ERR" == "False" ]]; then
            ok "MCP tools/call ($TNAME): success"
        else
            MSG=$(echo "$CALL" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('error',{}).get('message','')[:60])" 2>/dev/null || echo "")
            if echo "$MSG" | grep -qi "pas autoris\|not authoriz"; then
                ok "MCP tools/call ($TNAME): policy reject (expected)"
            else
                warn "MCP tools/call ($TNAME): $MSG"
            fi
        fi
    fi
else
    error "MCP_API_KEY not set"
fi

if [[ $ERRORS -eq 0 ]]; then ok "PASS"; exit 0; else error "FAIL ($ERRORS)"; exit 1; fi
