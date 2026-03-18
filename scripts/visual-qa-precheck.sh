#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
# Nexus Réussite EAF — Précheck QA visuelle
# Vérifie tous les prérequis avant génération des baselines
# ═══════════════════════════════════════════════════════════

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "  ${GREEN}✓${NC} $1"; }
fail() { echo -e "  ${RED}✗${NC} $1"; ERRORS=$((ERRORS + 1)); }
warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }

ERRORS=0

echo ""
echo "══════════════════════════════════════════════"
echo "  Nexus Réussite — Précheck QA visuelle"
echo "══════════════════════════════════════════════"
echo ""

# 1. Node / npm
echo "1. Environnement Node"
if command -v node &>/dev/null; then
  pass "Node $(node --version)"
else
  fail "Node.js non trouvé"
fi

# 2. Playwright
echo "2. Playwright"
if npx playwright --version &>/dev/null; then
  pass "Playwright $(npx playwright --version 2>/dev/null)"
else
  fail "Playwright non installé (npm install)"
fi

# 3. Fichiers d'environnement
echo "3. Configuration"
if [ -f .env.local ]; then
  pass ".env.local présent"
else
  fail ".env.local manquant"
fi

if grep -q DATABASE_URL .env.local 2>/dev/null; then
  DB_PORT=$(grep DATABASE_URL .env.local | grep -oP ':\K[0-9]+(?=/)')
  pass "DATABASE_URL configuré (port $DB_PORT)"
else
  fail "DATABASE_URL absent de .env.local"
fi

# 4. PostgreSQL
echo "4. PostgreSQL"
if command -v pg_isready &>/dev/null; then
  if pg_isready -p "${DB_PORT:-5433}" -q 2>/dev/null; then
    pass "PostgreSQL accessible sur le port $DB_PORT"
  else
    # Vérifier si un cluster tourne sur un autre port
    RUNNING_PORT=$(pg_lsclusters 2>/dev/null | grep online | awk '{print $3}' | head -1)
    if [ -n "$RUNNING_PORT" ] && [ "$RUNNING_PORT" != "${DB_PORT:-5433}" ]; then
      fail "PostgreSQL actif sur le port $RUNNING_PORT mais .env.local attend le port $DB_PORT"
      warn "Solution : modifier DATABASE_URL dans .env et .env.local (port $RUNNING_PORT)"
    else
      fail "PostgreSQL non accessible sur le port $DB_PORT"
    fi
  fi
else
  fail "pg_isready non trouvé"
fi

# 5. Extension pgvector
echo "5. Extension pgvector"
if [ -f "/usr/share/postgresql/${PG_MAJOR:-16}/extension/vector.control" ] 2>/dev/null; then
  pass "pgvector installé"
else
  PG_MAJOR=$(pg_lsclusters 2>/dev/null | grep online | awk '{print $1}' | head -1)
  if [ -f "/usr/share/postgresql/${PG_MAJOR}/extension/vector.control" ] 2>/dev/null; then
    pass "pgvector installé (PostgreSQL $PG_MAJOR)"
  else
    fail "pgvector non installé"
    warn "Solution : sudo apt install postgresql-${PG_MAJOR:-16}-pgvector"
  fi
fi

# 6. Prisma
echo "6. Prisma"
if npx prisma --version &>/dev/null; then
  pass "Prisma disponible"
else
  fail "Prisma non disponible"
fi

# 7. Seed
echo "7. Données de test"
if [ -f scripts/seed.ts ]; then
  pass "Script de seed présent"
else
  fail "scripts/seed.ts manquant"
fi

# 8. Tests visuels
echo "8. Suites de tests"
for f in tests/visual/visual-regression.spec.ts tests/visual/connected-visual.spec.ts tests/visual/mobile-visual.spec.ts tests/visual/auth.setup.ts; do
  if [ -f "$f" ]; then
    pass "$(basename $f)"
  else
    fail "$(basename $f) manquant"
  fi
done

# Résumé
echo ""
echo "══════════════════════════════════════════════"
if [ "$ERRORS" -eq 0 ]; then
  echo -e "  ${GREEN}Tous les prérequis sont satisfaits.${NC}"
  echo ""
  echo "  Prochaines étapes :"
  echo "    npx prisma db push"
  echo "    npm run db:seed"
  echo "    npm run dev                                    # terminal 1"
  echo "    E2E_BASE_URL=http://localhost:3000 npm run test:visual:update  # terminal 2"
else
  echo -e "  ${RED}$ERRORS prérequis manquant(s).${NC}"
  echo "  Corrigez les points ci-dessus avant de générer les baselines."
fi
echo "══════════════════════════════════════════════"
echo ""

exit $ERRORS
