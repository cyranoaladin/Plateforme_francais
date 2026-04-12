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

echo "=== CHECK BILLING PRODUCTION ==="

if [[ -f "$SECRETS_FILE" ]]; then
    while IFS="=" read -r _k _v; do
        [[ -z "$_k" || "$_k" =~ ^# ]] && continue
        export "$_k=$_v"
    done < <(grep -E "^[A-Za-z_][A-Za-z0-9_]*=" "$SECRETS_FILE")
fi

if [[ -n "${BILLING_CODE_PEPPER:-}" ]]; then
    ok "BILLING_CODE_PEPPER configured"
else
    error "BILLING_CODE_PEPPER not set"
fi

if [[ -n "${DATABASE_URL:-}" ]]; then
    for table in ActivationCode Subscription; do
        COUNT=$(psql "$DATABASE_URL" -t -c "SELECT count(*) FROM \"$table\";" 2>/dev/null | tr -d ' ' || echo "?")
        if [[ "$COUNT" != "?" ]]; then
            ok "$table: $COUNT rows"
        else
            warn "$table inaccessible"
        fi
    done
fi

HEALTH=$(curl -s -m 10 "http://127.0.0.1:3000/api/v1/health" 2>/dev/null || echo '{}')
BILL=$(echo "$HEALTH" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('features',{}).get('auth_billing','?'))" 2>/dev/null || echo "?")
if [[ "$BILL" == "ok" ]]; then
    ok "Billing via health: ok"
else
    warn "Billing via health: $BILL"
fi

if [[ $ERRORS -eq 0 ]]; then ok "PASS"; exit 0; else error "FAIL ($ERRORS)"; exit 1; fi
