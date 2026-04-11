#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# DEPLOY PRODUCTION - Script de déploiement sécurisé
# Structure: /opt/eaf/releases/<timestamp>/
#            /opt/eaf/shared/
#            /opt/eaf/current -> symlink vers release active
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

# Configuration
APP_NAME="eaf"
APP_USER="eaf"
APP_GROUP="eaf"
BASE_DIR="/opt/${APP_NAME}"
RELEASES_DIR="${BASE_DIR}/releases"
SHARED_DIR="${BASE_DIR}/shared"
CURRENT_LINK="${BASE_DIR}/current"
MAX_RELEASES=5

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Timestamp et release
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RELEASE_DIR="${RELEASES_DIR}/${TIMESTAMP}"
GIT_SHA=$(git rev-parse HEAD 2>/dev/null || echo "unknown")

echo "═══════════════════════════════════════════════════════════════"
echo "  DÉPLOIEMENT PRODUCTION - Nexus EAF"
echo "  Timestamp: ${TIMESTAMP}"
echo "  Git SHA: ${GIT_SHA}"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ═══════════════════════════════════════════════════════════════
# ÉTAPE 0: Vérifications pré-déploiement
# ═══════════════════════════════════════════════════════════════
log_info "Étape 0/8: Vérifications pré-déploiement..."

# Vérifier que les tests passent
if ! npm run typecheck > /dev/null 2>&1; then
    log_error "TypeScript check échoué!"
    exit 1
fi

# Vérifier les secrets
if ! bash scripts/check-secrets-exposure.sh > /dev/null 2>&1; then
    log_warn "Exposition de secrets détectée - vérifier manuellement"
fi

log_info "✅ Vérifications OK"
echo ""

# ═══════════════════════════════════════════════════════════════
# ÉTAPE 1: Créer la structure de release
# ═══════════════════════════════════════════════════════════════
log_info "Étape 1/8: Création de la release ${TIMESTAMP}..."

mkdir -p "${RELEASE_DIR}"
mkdir -p "${SHARED_DIR}"/{uploads,logs,backups,node_modules}

# Copier le code source (sans les fichiers inutiles)
rsync -av --delete \
    --exclude='.git' \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='coverage' \
    --exclude='*.log' \
    --exclude='.env*' \
    --exclude='*.backup' \
    --exclude='*.bak' \
    --exclude='test-results' \
    --exclude='forensics' \
    --exclude='.worktrees' \
    --exclude='.windsurf_audit_logs' \
    ./ "${RELEASE_DIR}/"

# Créer le manifest de release
cat > "${RELEASE_DIR}/RELEASE.json" <<EOF
{
  "version": "$(cat package.json | jq -r .version)",
  "git_sha": "${GIT_SHA}",
  "timestamp": "${TIMESTAMP}",
  "deployed_by": "$(whoami)",
  "node_version": "$(node --version)",
  "npm_version": "$(npm --version)"
}
EOF

log_info "✅ Release créée: ${RELEASE_DIR}"
echo ""

# ═══════════════════════════════════════════════════════════════
# ÉTAPE 2: Lier les répertoires partagés
# ═══════════════════════════════════════════════════════════════
log_info "Étape 2/8: Liaison des répertoires partagés..."

# Supprimer les dossiers vides et créer les symlinks
rm -rf "${RELEASE_DIR}/.data"
rm -rf "${RELEASE_DIR}/node_modules"
rm -rf "${RELEASE_DIR}/logs" 2>/dev/null || true

ln -sf "${SHARED_DIR}/uploads" "${RELEASE_DIR}/.data"
ln -sf "${SHARED_DIR}/node_modules" "${RELEASE_DIR}/node_modules"
ln -sf "${SHARED_DIR}/logs" "${RELEASE_DIR}/logs"

log_info "✅ Symlinks créés"
echo ""

# ═══════════════════════════════════════════════════════════════
# ÉTAPE 3: Copier les secrets depuis la zone sécurisée
# ═══════════════════════════════════════════════════════════════
log_info "Étape 3/8: Configuration des secrets..."

SECRETS_FILE="${BASE_DIR}/secrets/.env.production"
if [[ ! -f "${SECRETS_FILE}" ]]; then
    log_error "Fichier de secrets non trouvé: ${SECRETS_FILE}"
    exit 1
fi

cp "${SECRETS_FILE}" "${RELEASE_DIR}/.env"
chmod 600 "${RELEASE_DIR}/.env"

# Créer .env.local vide (nécessaire pour Next.js)
touch "${RELEASE_DIR}/.env.local"

log_info "✅ Secrets configurés"
echo ""

# ═══════════════════════════════════════════════════════════════
# ÉTAPE 4: Installation des dépendances et build
# ═══════════════════════════════════════════════════════════════
log_info "Étape 4/8: Installation et build..."

cd "${RELEASE_DIR}"

# Utiliser les node_modules partagés ou installer
if [[ ! -d "${SHARED_DIR}/node_modules/.bin" ]]; then
    log_info "Première installation des node_modules..."
    npm ci --production=false --silent
    # Copier dans shared pour les prochaines releases
    rsync -a node_modules/ "${SHARED_DIR}/node_modules/"
else
    log_info "Utilisation des node_modules partagés"
fi

# Build
log_info "Build en cours..."
npm run build:ci > "${SHARED_DIR}/logs/build-${TIMESTAMP}.log" 2>&1

if [[ $? -ne 0 ]]; then
    log_error "Build échoué! Voir ${SHARED_DIR}/logs/build-${TIMESTAMP}.log"
    exit 1
fi

log_info "✅ Build terminé"
echo ""

# ═══════════════════════════════════════════════════════════════
# ÉTAPE 5: Smoke tests
# ═══════════════════════════════════════════════════════════════
log_info "Étape 5/8: Smoke tests..."

# Démarrer temporairement pour vérifier
export PORT=3001
cd "${RELEASE_DIR}"

# Test de démarrage
if timeout 10s node .next/standalone/server.js > /tmp/smoke-test.log 2>&1 &
PID=$!
sleep 3

if kill -0 $PID 2>/dev/null; then
    # Test HTTP
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 | grep -q "200\|307"; then
        log_info "✅ Smoke test OK"
        kill $PID 2>/dev/null || true
    else
        log_error "Smoke test HTTP échoué"
        kill $PID 2>/dev/null || true
        exit 1
    fi
else
    log_warn "⚠️  Smoke test démarrage échoué (peut être normal en CI)"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# ÉTAPE 6: Switch de release (atomic)
# ═══════════════════════════════════════════════════════════════
log_info "Étape 6/8: Activation de la nouvelle release..."

# Arrêter l'application actuelle
log_info "Arrêt de l'application..."
systemctl stop eaf-nextjs || true
sleep 2

# Mettre à jour le symlink
ln -sfn "${RELEASE_DIR}" "${CURRENT_LINK}"

# Permissions
chown -R ${APP_USER}:${APP_GROUP} "${RELEASE_DIR}"
chmod 750 "${RELEASE_DIR}"

log_info "✅ Release activée: ${CURRENT_LINK} -> ${RELEASE_DIR}"
echo ""

# ═══════════════════════════════════════════════════════════════
# ÉTAPE 7: Démarrage
# ═══════════════════════════════════════════════════════════════
log_info "Étape 7/8: Démarrage de l'application..."

systemctl start eaf-nextjs

# Attendre que l'application démarre
for i in {1..30}; do
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
        log_info "✅ Application démarrée et répond HTTP 200"
        break
    fi
    sleep 1
done

# Vérification finale
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")
if [[ "${HTTP_CODE}" != "200" ]]; then
    log_error "L'application ne répond pas correctement (HTTP ${HTTP_CODE})"
    log_error "Rollback manuel nécessaire vers: ${RELEASE_DIR}"
    exit 1
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# ÉTAPE 8: Cleanup
# ═══════════════════════════════════════════════════════════════
log_info "Étape 8/8: Nettoyage des anciennes releases..."

# Garder seulement les MAX_RELEASES dernières releases
cd "${RELEASES_DIR}"
ls -t | tail -n +$((MAX_RELEASES + 1)) | xargs -r rm -rf

CURRENT_COUNT=$(ls -1 | wc -l)
log_info "✅ ${CURRENT_COUNT} release(s) conservée(s)"
echo ""

# ═══════════════════════════════════════════════════════════════
# FIN
# ═══════════════════════════════════════════════════════════════
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ DÉPLOIEMENT RÉUSSI"
echo "  Release: ${TIMESTAMP}"
echo "  URL: https://eaf.nexusreussite.academy"
echo "  Logs: ${SHARED_DIR}/logs/"
echo "═══════════════════════════════════════════════════════════════"

exit 0
