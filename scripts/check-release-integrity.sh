#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# CHECK RELEASE INTEGRITY
# Vérifie que la release en cours est complète et cohérente
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

BASE_DIR="${BASE_DIR:-/opt/eaf}"
CURRENT_LINK="${BASE_DIR}/current"
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
echo "  CHECK RELEASE INTEGRITY"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# 1. Vérifier le symlink current
echo "1. Vérification du symlink current..."
if [[ -L "$CURRENT_LINK" ]]; then
    CURRENT_TARGET=$(readlink -f "$CURRENT_LINK")
    ok "Current pointe vers: $CURRENT_TARGET"
else
    error "Symlink current n'existe pas"
    exit 1
fi

# 2. Vérifier que c'est une release valide
echo ""
echo "2. Vérification de la release..."
RELEASE_DIR="$CURRENT_TARGET"

if [[ ! -d "$RELEASE_DIR" ]]; then
    error "Répertoire release inexistant: $RELEASE_DIR"
    exit 1
fi

# 3. Vérifier les fichiers critiques
echo ""
echo "3. Vérification des fichiers critiques..."

CRITICAL_FILES=(
    ".next/standalone/server.js"
    "package.json"
    "RELEASE.json"
)

for file in "${CRITICAL_FILES[@]}"; do
    if [[ -f "$RELEASE_DIR/$file" ]]; then
        ok "$file présent"
    else
        error "$file MANQUANT"
    fi
done

# 4. Vérifier le build MCP
echo ""
echo "4. Vérification du build MCP..."
if [[ -f "$RELEASE_DIR/packages/mcp-server/dist/index.js" ]]; then
    ok "MCP build présent"
else
    error "MCP build MANQUANT"
fi

# 5. Vérifier le build worker
echo ""
echo "5. Vérification du build worker..."
if [[ -f "$RELEASE_DIR/dist/worker/src/lib/queue/start-worker.js" ]]; then
    ok "Worker build présent"
else
    error "Worker build MANQUANT"
fi

# 6. Vérifier RELEASE.json
echo ""
echo "6. Vérification du manifest RELEASE.json..."
if [[ -f "$RELEASE_DIR/RELEASE.json" ]]; then
    GIT_SHA=$(cat "$RELEASE_DIR/RELEASE.json" | grep -o '"git_sha":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
    VERSION=$(cat "$RELEASE_DIR/RELEASE.json" | grep -o '"version":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
    ok "Version: $VERSION"
    ok "Git SHA: ${GIT_SHA:0:8}"
else
    warn "RELEASE.json manquant"
fi

# 7. Vérifier les symlinks shared
echo ""
echo "7. Vérification des symlinks..."
SYMLINKS=("logs" ".data")
for link in "${SYMLINKS[@]}"; do
    if [[ -L "$RELEASE_DIR/$link" ]]; then
        TARGET=$(readlink "$RELEASE_DIR/$link")
        ok "$link -> $TARGET"
    else
        warn "$link n'est pas un symlink"
    fi
done

# 8. Vérifier que .env n'existe pas dans la release (sécurité)
echo ""
echo "8. Vérification sécurité (pas de .env dans release)..."
if [[ -f "$RELEASE_DIR/.env" ]]; then
    error ".env trouvé dans la release (DANGER)"
else
    ok "Pas de .env dans la release (sécurisé)"
fi

# 9. Vérifier permissions
echo ""
echo "9. Vérification des permissions..."
OWNER=$(stat -c %U "$RELEASE_DIR" 2>/dev/null || echo "unknown")
if [[ "$OWNER" == "eaf" ]]; then
    ok "Propriétaire: eaf"
else
    warn "Propriétaire: $OWNER (devrait être eaf)"
fi

echo ""
if [[ $ERRORS -eq 0 ]]; then
    echo -e "${GREEN}✅ RELEASE INTEGRITY OK${NC}"
    exit 0
else
    echo -e "${RED}❌ RELEASE ERRORS: $ERRORS${NC}"
    exit 1
fi
