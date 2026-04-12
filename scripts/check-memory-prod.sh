#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# CHECK MEMORY PRODUCTION — Robuste
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

echo "=== CHECK MEMORY PRODUCTION ==="

# Load env
if [[ -f "$SECRETS_FILE" ]]; then
    while IFS="=" read -r _k _v; do
        [[ -z "$_k" || "$_k" =~ ^# ]] && continue
        export "$_k=$_v"
    done < <(grep -E "^[A-Za-z_][A-Za-z0-9_]*=" "$SECRETS_FILE")
fi

# 1. DB-backed: no JSON fallback files
echo "1. Vérification stockage DB-backed..."
for f in oral-sessions.json epreuves-store.json memory.json events.json; do
    if [[ -f "/opt/eaf/current/$f" ]]; then
        error "$f existe (devrait être en DB)"
    else
        ok "$f DB-backed"
    fi
done

# 2. DB coherence
echo ""
echo "2. Vérification tables via DB..."
if [[ -n "${DATABASE_URL:-}" ]]; then
    # User count
    UC=$(psql "$DATABASE_URL" -t -c 'SELECT count(*) FROM "User";' 2>/dev/null | tr -d ' ' || echo "?")
    if [[ "$UC" != "?" ]]; then
        ok "Users: $UC"
    else
        error "Table User inaccessible"
    fi

    # Session count
    SC=$(psql "$DATABASE_URL" -t -c 'SELECT count(*) FROM "Session";' 2>/dev/null | tr -d ' ' || echo "?")
    if [[ "$SC" != "?" ]]; then
        ok "Sessions: $SC"
    else
        warn "Table Session inaccessible"
    fi

    # MemoryEvent table check
    ME_EXISTS=$(psql "$DATABASE_URL" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='MemoryEvent';" 2>/dev/null | tr -d ' ' || echo "0")
    if [[ "$ME_EXISTS" == "1" ]]; then
        MEC=$(psql "$DATABASE_URL" -t -c 'SELECT count(*) FROM "MemoryEvent";' 2>/dev/null | tr -d ' ' || echo "?")
        ok "MemoryEvent: $MEC events"
    else
        warn "MemoryEvent table absent (migration pending)"
    fi
else
    error "DATABASE_URL non disponible"
fi

# 3. Worker online (for async memory operations)
echo ""
echo "3. Worker pour mémoire asynchrone..."
if env HOME=/opt/nexus PM2_HOME=/opt/nexus/.pm2 pm2 describe eaf-worker 2>/dev/null | grep -q "status.*online"; then
    ok "Worker online"
else
    error "Worker not online"
fi

if [[ $ERRORS -eq 0 ]]; then ok "PASS"; exit 0; else error "FAIL ($ERRORS)"; exit 1; fi
