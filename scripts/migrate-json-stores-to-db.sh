#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# MIGRATE JSON STORES TO DATABASE
# Migre les données des fallbacks JSON vers PostgreSQL
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

SECRETS_FILE="${SECRETS_FILE:-/opt/eaf/secrets/.env.production}"
DATA_DIR="${DATA_DIR:-/opt/eaf/shared/data}"
BACKUP_DIR="${DATA_DIR}/backup-migration-$(date +%Y%m%d_%H%M%S)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_ok() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "═══════════════════════════════════════════════════════════════"
echo "  MIGRATION JSON STORES -> DATABASE"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Charger les variables
if [[ -f "$SECRETS_FILE" ]]; then
    set -a
    source "$SECRETS_FILE"
    set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
    log_error "DATABASE_URL non configuré"
    exit 1
fi

# Créer backup
mkdir -p "$BACKUP_DIR"
cp "$DATA_DIR"/*.json "$BACKUP_DIR/" 2>/dev/null || true
log_info "Backup créé dans: $BACKUP_DIR"

# ═══════════════════════════════════════════════════════════════
# 1. MIGRATION PREMIUM STORE
# ═══════════════════════════════════════════════════════════════
echo ""
log_info "1. Migration premium-store.json..."

if [[ -f "$DATA_DIR/premium-store.json" ]]; then
    # Vérifier si des données existent
    COUNT=$(cat "$DATA_DIR/premium-store.json" | wc -c || echo "0")
    if [[ $COUNT -gt 10 ]]; then
        log_warn "premium-store.json contient $COUNT bytes"
        log_info "Les données premium doivent être migrées vers Subscription et ActivationCode"
        log_info "Manuel: Vérifier les entrées et créer les subscriptions correspondantes"
        # TODO: Script de migration automatique si format connu
    else
        log_ok "premium-store.json vide ou inexistant"
    fi
else
    log_ok "premium-store.json n'existe pas"
fi

# ═══════════════════════════════════════════════════════════════
# 2. MIGRATION MEMORY STORE
# ═══════════════════════════════════════════════════════════════
echo ""
log_info "2. Migration memory-store.json..."

if [[ -f "$DATA_DIR/memory-store.json" ]]; then
    SIZE=$(stat -c%s "$DATA_DIR/memory-store.json" 2>/dev/null || echo "0")
    if [[ $SIZE -gt 1000 ]]; then
        log_warn "memory-store.json contient $SIZE bytes"
        log_info "Migration vers table MemoryEvent..."
        
        # Vérifier si déjà migré
        DB_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"MemoryEvent\";" 2>/dev/null | xargs || echo "0")
        
        if [[ $DB_COUNT -gt 0 ]]; then
            log_warn "Table MemoryEvent contient déjà $DB_COUNT événements"
            log_info "Vérifier cohérence ou ignorer si migration déjà faite"
        else
            log_info "Aucun événement en DB - migration nécessaire"
            log_info "TODO: Implémenter migration automatique memory-store.json -> MemoryEvent"
        fi
    else
        log_ok "memory-store.json vide ou très petit"
    fi
else
    log_ok "memory-store.json n'existe pas"
fi

# ═══════════════════════════════════════════════════════════════
# 3. MIGRATION ORAL SESSIONS
# ═══════════════════════════════════════════════════════════════
echo ""
log_info "3. Migration oral-sessions.json..."

if [[ -f "$DATA_DIR/oral-sessions.json" ]]; then
    SIZE=$(stat -c%s "$DATA_DIR/oral-sessions.json" 2>/dev/null || echo "0")
    if [[ $SIZE -gt 100 ]]; then
        log_warn "oral-sessions.json contient $SIZE bytes"
        log_info "Les sessions orales doivent être en DB (table OralSession)"
        
        DB_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"OralSession\";" 2>/dev/null | xargs || echo "0")
        log_info "Table OralSession: $DB_COUNT sessions"
    else
        log_ok "oral-sessions.json vide ou très petit"
    fi
else
    log_ok "oral-sessions.json n'existe pas"
fi

# ═══════════════════════════════════════════════════════════════
# 4. MIGRATION EPREUVES STORE
# ═══════════════════════════════════════════════════════════════
echo ""
log_info "4. Migration epreuves-store.json..."

if [[ -f "$DATA_DIR/epreuves-store.json" ]]; then
    SIZE=$(stat -c%s "$DATA_DIR/epreuves-store.json" 2>/dev/null || echo "0")
    if [[ $SIZE -gt 100 ]]; then
        log_warn "epreuves-store.json contient $SIZE bytes"
        log_info "Les épreuves doivent être en DB (table Copie)"
        
        DB_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"Copie\";" 2>/dev/null | xargs || echo "0")
        log_info "Table Copie: $DB_COUNT copies"
    else
        log_ok "epreuves-store.json vide ou très petit"
    fi
else
    log_ok "epreuves-store.json n'existe pas"
fi

# ═══════════════════════════════════════════════════════════════
# RÉSUMÉ
# ═══════════════════════════════════════════════════════════════
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  MIGRATION TERMINÉE"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Backup des fichiers JSON: $BACKUP_DIR"
echo ""
echo "Actions manuelles potentielles:"
echo "  1. Vérifier les données dans les tables DB"
echo "  2. Si tout est OK en DB, supprimer les fichiers JSON:"
echo "     rm $DATA_DIR/*.json"
echo "  3. Sinon, restaurer depuis le backup"
echo ""
