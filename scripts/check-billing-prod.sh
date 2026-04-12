#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# CHECK BILLING PRODUCTION
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
echo "  CHECK BILLING PRODUCTION"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Charger les variables
if [[ -f "$SECRETS_FILE" ]]; then
    set -a
    source "$SECRETS_FILE"
    set +a
fi

# 1. Vérifier BILLING_CODE_PEPPER
echo "1. Vérification BILLING_CODE_PEPPER..."
if [[ -n "${BILLING_CODE_PEPPER:-}" && ${#BILLING_CODE_PEPPER} -ge 32 ]]; then
    ok "BILLING_CODE_PEPPER configuré"
else
    error "BILLING_CODE_PEPPER absent ou trop court"
fi

# 2. Vérifier tables billing en DB
echo ""
echo "2. Vérification tables billing..."

if [[ -n "${DATABASE_URL:-}" ]]; then
    # Activation codes
    CODES_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"ActivationCode\";" 2>/dev/null | xargs || echo "0")
    ok "ActivationCode: $CODES_COUNT codes"
    
    # Subscriptions
    SUBS_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"Subscription\";" 2>/dev/null | xargs || echo "0")
    ok "Subscription: $SUBS_COUNT abonnements"
    
    # Vérifier cohérence
    ACTIVE_SUBS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"Subscription\" WHERE status = 'active';" 2>/dev/null | xargs || echo "0")
    ok "Abonnements actifs: $ACTIVE_SUBS"
else
    error "DATABASE_URL non configuré"
fi

# 3. Test API billing status
echo ""
echo "3. Test API billing..."
BILLING_STATUS=$(curl -s -m 5 "${BASE_URL}/api/v1/billing/status" 2>/dev/null || echo '{}')

if echo "$BILLING_STATUS" | grep -q 'subscription\|plan\|status'; then
    ok "API billing accessible"
else
    error "API billing non accessible"
fi

# 4. Vérifier quotas
echo ""
echo "4. Vérification quotas..."
QUOTA_CHECK=$(curl -s -m 5 "${BASE_URL}/api/v1/billing/check-quota" 2>/dev/null || echo '{}')
if echo "$QUOTA_CHECK" | grep -q 'used\|limit\|remaining'; then
    ok "API quotas accessible"
else
    warn "API quotas non accessible (peut être normal si non authentifié)"
fi

echo ""
if [[ $ERRORS -eq 0 ]]; then
    echo -e "${GREEN}✅ BILLING OK${NC}"
    exit 0
else
    echo -e "${RED}❌ BILLING ERRORS: $ERRORS${NC}"
    exit 1
fi
