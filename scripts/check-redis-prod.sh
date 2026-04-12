#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# CHECK REDIS PRODUCTION
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

SECRETS_FILE="${SECRETS_FILE:-/opt/eaf/secrets/.env.production}"
ERRORS=0

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

error() { echo -e "${RED}[ERROR]${NC} $1"; ERRORS=$((ERRORS + 1)); }
ok() { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }

echo "═══════════════════════════════════════════════════════════════"
echo "  CHECK REDIS PRODUCTION"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Charger les variables
if [[ -f "$SECRETS_FILE" ]]; then
    set -a
    source "$SECRETS_FILE"
    set +a
fi

REDIS_URL="${REDIS_URL:-redis://localhost:6379}"

# 1. Vérifier connexion
echo "1. Test de connexion..."
if redis-cli -u "$REDIS_URL" PING > /dev/null 2>&1; then
    ok "Redis PING OK"
else
    error "Redis ne répond pas"
    exit 1
fi

# 2. Test lecture/écriture
echo ""
echo "2. Test lecture/écriture..."
TEST_KEY="healthcheck:$(date +%s)"
TEST_VALUE="ok"

if redis-cli -u "$REDIS_URL" SET "$TEST_KEY" "$TEST_VALUE" EX 10 > /dev/null 2>&1; then
    RETRIEVED=$(redis-cli -u "$REDIS_URL" GET "$TEST_KEY" 2>/dev/null || echo "")
    if [[ "$RETRIEVED" == "$TEST_VALUE" ]]; then
        ok "Lecture/écriture OK"
    else
        error "Lecture/écriture échouée"
    fi
else
    error "SET échoué"
fi

# 3. Vérifier mémoire
echo ""
echo "3. Statistiques mémoire..."
USED_MEMORY=$(redis-cli -u "$REDIS_URL" INFO memory 2>/dev/null | grep used_memory_human | cut -d: -f2 | tr -d '\r' || echo "unknown")
echo "  Mémoire utilisée: $USED_MEMORY"

# 4. Vérifier connexions
echo ""
echo "4. Connexions actives..."
CONNECTED_CLIENTS=$(redis-cli -u "$REDIS_URL" INFO clients 2>/dev/null | grep connected_clients | cut -d: -f2 | tr -d '\r' || echo "0")
echo "  Clients connectés: $CONNECTED_CLIENTS"

# 5. Vérifier persistence
echo ""
echo "5. Persistence..."
RDB_LASTSAVE=$(redis-cli -u "$REDIS_URL" LASTSAVE 2>/dev/null || echo "0")
if [[ "$RDB_LASTSAVE" != "0" ]]; then
    LASTSAVE_HUMAN=$(date -d "@$RDB_LASTSAVE" '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "unknown")
    ok "Dernière sauvegarde RDB: $LASTSAVE_HUMAN"
else
    warn "Pas de sauvegarde RDB détectée"
fi

echo ""
if [[ $ERRORS -eq 0 ]]; then
    echo -e "${GREEN}✅ REDIS OK${NC}"
    exit 0
else
    echo -e "${RED}❌ REDIS ERRORS: $ERRORS${NC}"
    exit 1
fi
