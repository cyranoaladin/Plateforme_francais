#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# CHECK MEMORY / PROFIL / PARCOURS PRODUCTION
# Vérifie que la mémoire durable des élèves fonctionne correctement
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

SECRETS_FILE="${SECRETS_FILE:-/opt/eaf/secrets/.env.production}"
BASE_URL="${E2E_BASE_URL:-https://eaf.nexusreussite.academy}"
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
echo "  CHECK MEMORY / PROFIL / PARCOURS PRODUCTION"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Charger les variables
if [[ -f "$SECRETS_FILE" ]]; then
    set -a
    source "$SECRETS_FILE"
    set +a
fi

# 1. Vérifier les tables de mémoire en DB
echo "1. Vérification des tables de mémoire en DB..."

if [[ -n "${DATABASE_URL:-}" ]]; then
    # MemoryEvent
    MEMORY_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"MemoryEvent\";" 2>/dev/null | xargs || echo "0")
    ok "Table MemoryEvent: $MEMORY_COUNT événements"
    
    # Timeline events
    TIMELINE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"TimelineEvent\";" 2>/dev/null | xargs || echo "0")
    ok "Table TimelineEvent: $TIMELINE_COUNT événements"
    
    # Vérifier qu'il n'y a pas de divergences majeures
    if [[ "$MEMORY_COUNT" -eq 0 && "$TIMELINE_COUNT" -gt 0 ]]; then
        warn "MemoryEvent vide mais TimelineEvent contient des données"
    fi
else
    error "DATABASE_URL non configuré"
fi

# 2. Vérifier les fallback JSON (doivent être résynchronisés ou vides)
echo ""
echo "2. Vérification des fallbacks JSON..."

DATA_DIR="/opt/eaf/shared/data"
if [[ -d "$DATA_DIR" ]]; then
    for file in memory-store.json premium-store.json oral-sessions.json epreuves-store.json; do
        FILEPATH="$DATA_DIR/$file"
        if [[ -f "$FILEPATH" ]]; then
            SIZE=$(stat -c%s "$FILEPATH" 2>/dev/null || echo "0")
            if [[ $SIZE -gt 1000 ]]; then
                warn "$file existe et contient ${SIZE} bytes (doit être migré vers DB)"
            else
                ok "$file existe mais est petit (${SIZE} bytes)"
            fi
        else
            ok "$file n'existe pas (OK si tout en DB)"
        fi
    done
else
    warn "Répertoire data non trouvé"
fi

# 3. Vérifier cohérence profil utilisateur
echo ""
echo "3. Vérification cohérence profils..."

if [[ -n "${DATABASE_URL:-}" ]]; then
    # Vérifier que tous les users ont un profil
    USERS_WITHOUT_PROFILE=$(psql "$DATABASE_URL" -t -c "
        SELECT COUNT(*) FROM \"User\" u 
        LEFT JOIN \"StudentProfile\" sp ON u.id = sp.\"userId\" 
        WHERE sp.id IS NULL AND u.role = 'STUDENT';
    " 2>/dev/null | xargs || echo "0")
    
    if [[ "$USERS_WITHOUT_PROFILE" -eq 0 ]]; then
        ok "Tous les étudiants ont un profil"
    else
        warn "$USERS_WITHOUT_PROFILE étudiants sans profil"
    fi
    
    # Vérifier les parcours
    PARCOURS_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"StudentProfile\" WHERE parcours IS NOT NULL;" 2>/dev/null | xargs || echo "0")
    ok "$PARCOURS_COUNT profils avec parcours configuré"
fi

# 4. Vérifier API mémoire
echo ""
echo "4. Test API mémoire (via health)..."
HEALTH=$(curl -s -m 5 "${BASE_URL}/api/v1/memory/timeline?limit=1" 2>/dev/null || echo '{}')
if echo "$HEALTH" | grep -q 'timeline\|events\|\['; then
    ok "API mémoire accessible"
else
    error "API mémoire non accessible"
fi

# 5. Vérifier worker queue pour mémoire
echo ""
echo "5. Vérification worker mémoire..."
if systemctl is-active --quiet eaf-worker; then
    ok "Worker actif (traite les événements mémoire)"
else
    error "Worker inactif - la mémoire asynchrone ne fonctionne pas"
fi

echo ""
if [[ $ERRORS -eq 0 ]]; then
    echo -e "${GREEN}✅ MEMORY / PROFIL / PARCOURS OK${NC}"
    if [[ $WARNINGS -gt 0 ]]; then
        echo -e "${YELLOW}⚠️  $WARNINGS avertissement(s) - vérifier les fallbacks JSON${NC}"
    fi
    exit 0
else
    echo -e "${RED}❌ MEMORY ERRORS: $ERRORS${NC}"
    exit 1
fi
