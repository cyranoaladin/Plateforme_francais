#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# CHECK DB PRODUCTION - Vérification complète de la base de données
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
echo "  CHECK DATABASE PRODUCTION"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Charger les variables
if [[ -f "$SECRETS_FILE" ]]; then
    set -a
    source "$SECRETS_FILE"
    set +a
fi

# 1. Vérifier DATABASE_URL
if [[ -z "${DATABASE_URL:-}" ]]; then
    error "DATABASE_URL non définie"
    exit 1
fi

# 2. Test de connexion
echo "1. Test de connexion PostgreSQL..."
if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    ok "Connexion PostgreSQL OK"
else
    error "Connexion PostgreSQL échouée"
    exit 1
fi

# 3. Vérifier les tables critiques
echo ""
echo "2. Vérification des tables critiques..."

CRITICAL_TABLES=(
    "User"
    "Account"
    "Session"
    "VerificationToken"
    "ActivationCode"
    "Subscription"
    "OralSession"
    "Copie"
    "MemoryEvent"
)

for table in "${CRITICAL_TABLES[@]}"; do
    COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"$table\";" 2>/dev/null | xargs || echo "0")
    if [[ "$COUNT" =~ ^[0-9]+$ ]]; then
        ok "Table $table accessible ($COUNT lignes)"
    else
        error "Table $table inaccessible"
    fi
done

# 4. Vérifier les migrations
echo ""
echo "3. Vérification des migrations..."
MIGRATION_STATUS=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"_prisma_migrations\" WHERE finished_at IS NULL;" 2>/dev/null | xargs || echo "0")
if [[ "$MIGRATION_STATUS" == "0" ]]; then
    ok "Toutes les migrations sont terminées"
else
    error "Migrations en cours ou échouées: $MIGRATION_STATUS"
fi

# 5. Vérifier l'intégrité basique
echo ""
echo "4. Vérification intégrité..."

# Vérifier qu'il y a au moins un utilisateur
USER_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM \"User\";" 2>/dev/null | xargs || echo "0")
if [[ "$USER_COUNT" -gt 0 ]]; then
    ok "$USER_COUNT utilisateurs en base"
else
    warn "Aucun utilisateur en base"
fi

# Vérifier les index
echo ""
echo "5. Vérification des index critiques..."
INDEXES=(
    "User.email"
    "Session.sessionToken"
    "Account.provider_providerAccountId"
)

for idx in "${INDEXES[@]}"; do
    TABLE=$(echo "$idx" | cut -d. -f1)
    COLUMN=$(echo "$idx" | cut -d. -f2)
    HAS_INDEX=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM pg_indexes WHERE tablename = '${TABLE}' AND indexdef LIKE '%${COLUMN}%';" 2>/dev/null | xargs || echo "0")
    if [[ "$HAS_INDEX" -gt 0 ]]; then
        ok "Index sur $TABLE.$COLUMN"
    else
        warn "Index manquant sur $TABLE.$COLUMN"
    fi
done

echo ""
if [[ $ERRORS -eq 0 ]]; then
    echo -e "${GREEN}✅ DATABASE OK${NC}"
    exit 0
else
    echo -e "${RED}❌ DATABASE ERRORS: $ERRORS${NC}"
    exit 1
fi
