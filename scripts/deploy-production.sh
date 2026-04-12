#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# DEPLOY PRODUCTION - Script de déploiement systemd + releases
# Architecture: systemd (web + mcp + worker) + releases/
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

# Configuration
APP_NAME="eaf"
APP_USER="eaf"
APP_GROUP="eaf"
BASE_DIR="/opt/${APP_NAME}"
RELEASES_DIR="${BASE_DIR}/releases"
SHARED_DIR="${BASE_DIR}/shared"
SECRETS_DIR="${BASE_DIR}/secrets"
CURRENT_LINK="${BASE_DIR}/current"
MAX_RELEASES=5

# Services systemd
SERVICES="eaf-web eaf-mcp eaf-worker"

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

# Timestamp et release
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RELEASE_DIR="${RELEASES_DIR}/${TIMESTAMP}"
GIT_SHA=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

echo "═══════════════════════════════════════════════════════════════"
echo "  DÉPLOIEMENT PRODUCTION - Nexus EAF"
echo "  Architecture: systemd + releases"
echo "  Timestamp: ${TIMESTAMP}"
echo "  Git: ${GIT_BRANCH}@${GIT_SHA:0:8}"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ═══════════════════════════════════════════════════════════════
# ÉTAPE 0: Vérifications pré-déploiement
# ═══════════════════════════════════════════════════════════════
log_step "0/8: Vérifications pré-déploiement..."

# Vérifier que nous sommes sur la bonne branche
if [[ "${GIT_BRANCH}" != "main" && "${GIT_BRANCH}" != "master" && "${FORCE_DEPLOY:-false}" != "true" ]]; then
    log_warn "Branche actuelle: ${GIT_BRANCH} (pas main/master)"
    log_warn "Utiliser FORCE_DEPLOY=true pour forcer le déploiement"
    exit 1
fi

# Vérifier les tests
log_info "Vérification TypeScript..."
if ! npm run typecheck > /tmp/deploy-typecheck.log 2>&1; then
    log_error "TypeScript check échoué!"
    cat /tmp/deploy-typecheck.log
    exit 1
fi

# Vérifier les secrets
log_info "Vérification des secrets..."
if ! bash scripts/check-secrets-exposure.sh > /tmp/deploy-secrets.log 2>&1; then
    log_warn "Exposition de secrets détectée - vérifier /tmp/deploy-secrets.log"
fi

log_info "✅ Vérifications OK"
echo ""

# ═══════════════════════════════════════════════════════════════
# ÉTAPE 1: Créer la structure de release
# ═══════════════════════════════════════════════════════════════
log_step "1/8: Création de la release ${TIMESTAMP}..."

mkdir -p "${RELEASE_DIR}"
mkdir -p "${SHARED_DIR}"/{uploads,data,logs,backups,tmp}

# Copier le code source (sans les fichiers inutiles)
log_info "Copie du code source..."
rsync -a --delete \
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
    --exclude='docs/CLAUDE_FINAL_PROD_AUDIT' \
    ./ "${RELEASE_DIR}/"

# Créer le manifest de release
cat > "${RELEASE_DIR}/RELEASE.json" <<EOF
{
  "version": "$(node -p "require('./package.json').version")",
  "git_sha": "${GIT_SHA}",
  "git_branch": "${GIT_BRANCH}",
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
log_step "2/8: Liaison des répertoires partagés..."

# Créer les symlinks
rm -rf "${RELEASE_DIR}/.data"
ln -sf "${SHARED_DIR}/data" "${RELEASE_DIR}/.data"
ln -sf "${SHARED_DIR}/uploads" "${RELEASE_DIR}/public/uploads" 2>/dev/null || true
ln -sf "${SHARED_DIR}/logs" "${RELEASE_DIR}/logs"
ln -sf "${SHARED_DIR}/tmp" "${RELEASE_DIR}/tmp"

log_info "✅ Symlinks créés"
echo ""

# ═══════════════════════════════════════════════════════════════
# ÉTAPE 3: Vérifier les secrets
# ═══════════════════════════════════════════════════════════════
log_step "3/8: Vérification des secrets..."

SECRETS_FILE="${SECRETS_DIR}/.env.production"
if [[ ! -f "${SECRETS_FILE}" ]]; then
    log_error "Fichier de secrets non trouvé: ${SECRETS_FILE}"
    log_error "Créer le fichier avec: sudo mkdir -p ${SECRETS_DIR} && sudo chmod 700 ${SECRETS_DIR}"
    exit 1
fi

# Vérifier les permissions
PERMS=$(stat -c %a "${SECRETS_FILE}" 2>/dev/null || echo "644")
if [[ "${PERMS}" != "600" ]]; then
    log_warn "Permissions sur ${SECRETS_FILE}: ${PERMS} (devrait être 600)"
    chmod 600 "${SECRETS_FILE}"
fi

# Vérifier les variables obligatoires
REQUIRED_VARS=("SESSION_SECRET" "CSRF_SECRET" "DATABASE_URL" "MISTRAL_API_KEY")
MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -q "^${var}=" "${SECRETS_FILE}" || grep -q "^${var}=$" "${SECRETS_FILE}"; then
        MISSING_VARS+=("${var}")
    fi
done

if [[ ${#MISSING_VARS[@]} -gt 0 ]]; then
    log_error "Variables obligatoires manquantes: ${MISSING_VARS[*]}"
    exit 1
fi

log_info "✅ Secrets configurés"
echo ""

# ═══════════════════════════════════════════════════════════════
# ÉTAPE 4: Installation des dépendances et build
# ═══════════════════════════════════════════════════════════════
log_step "4/8: Installation et build..."

cd "${RELEASE_DIR}"

# Installation des dépendances
log_info "Installation npm..."
npm ci --silent > "${SHARED_DIR}/logs/npm-${TIMESTAMP}.log" 2>&1

# Build de l'application
log_info "Build Next.js..."
npm run build > "${SHARED_DIR}/logs/build-${TIMESTAMP}.log" 2>&1
if [[ $? -ne 0 ]]; then
    log_error "Build échoué! Voir ${SHARED_DIR}/logs/build-${TIMESTAMP}.log"
    exit 1
fi

# Build du worker
log_info "Build worker..."
npm run build:worker >> "${SHARED_DIR}/logs/build-${TIMESTAMP}.log" 2>&1

# Build du MCP
log_info "Build MCP..."
cd "${RELEASE_DIR}/packages/mcp-server"
npm ci --silent 2>/dev/null || npm install --silent
npm run build > "${SHARED_DIR}/logs/build-mcp-${TIMESTAMP}.log" 2>&1

cd "${RELEASE_DIR}"

log_info "✅ Build terminé"
echo ""

# ═══════════════════════════════════════════════════════════════
# ÉTAPE 5: Smoke tests
# ═══════════════════════════════════════════════════════════════
log_step "5/8: Smoke tests..."

# Charger les variables pour le test
set -a
source "${SECRETS_FILE}"
set +a

# Test de démarrage web
log_info "Test démarrage web..."
PORT=3001 timeout 10s node .next/standalone/server.js > /tmp/smoke-web.log 2>&1 &
WEB_PID=$!
sleep 3

if kill -0 $WEB_PID 2>/dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 || echo "000")
    if [[ "${HTTP_CODE}" == "200" ]]; then
        log_info "✅ Web smoke test OK"
    else
        log_warn "⚠️ Web HTTP ${HTTP_CODE}"
    fi
    kill $WEB_PID 2>/dev/null || true
else
    log_warn "⚠️ Web démarrage échoué"
fi

log_info "✅ Smoke tests terminés"
echo ""

# ═══════════════════════════════════════════════════════════════
# ÉTAPE 6: Switch de release (atomic)
# ═══════════════════════════════════════════════════════════════
log_step "6/8: Activation de la nouvelle release..."

# Arrêter les services
log_info "Arrêt des services..."
systemctl stop ${SERVICES} 2>/dev/null || true
sleep 2

# Mettre à jour le symlink
ln -sfn "${RELEASE_DIR}" "${CURRENT_LINK}"

# Permissions
chown -R ${APP_USER}:${APP_GROUP} "${RELEASE_DIR}"
find "${RELEASE_DIR}" -type d -exec chmod 750 {} \;
find "${RELEASE_DIR}" -type f -exec chmod 640 {} \;

# Scripts exécutables
chmod +x "${RELEASE_DIR}/scripts/"*.sh 2>/dev/null || true

log_info "✅ Release activée: ${CURRENT_LINK} -> ${RELEASE_DIR}"
echo ""

# ═══════════════════════════════════════════════════════════════
# ÉTAPE 7: Démarrage
# ═══════════════════════════════════════════════════════════════
log_step "7/8: Démarrage des services..."

# Recharger systemd pour prendre en compte les nouveaux services
systemctl daemon-reload

# Démarrer les services
for service in ${SERVICES}; do
    log_info "Démarrage ${service}..."
    systemctl start ${service}
done

# Attendre que les services démarrent
log_info "Attente démarrage (15s)..."
sleep 15

# Vérifier l'état des services
FAILED_SERVICES=""
for service in ${SERVICES}; do
    if ! systemctl is-active --quiet ${service}; then
        FAILED_SERVICES="${FAILED_SERVICES} ${service}"
        log_error "${service} failed to start"
        systemctl status ${service} --no-pager -l
    fi
done

if [[ -n "${FAILED_SERVICES}" ]]; then
    log_error "Services en échec:${FAILED_SERVICES}"
    log_error "Rollback manuel nécessaire!"
    exit 1
fi

# Test HTTP final
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")
if [[ "${HTTP_CODE}" != "200" ]]; then
    log_error "Application ne répond pas (HTTP ${HTTP_CODE})"
    exit 1
fi

log_info "✅ Tous les services démarrés"
echo ""

# ═══════════════════════════════════════════════════════════════
# ÉTAPE 8: Cleanup
# ═══════════════════════════════════════════════════════════════
log_step "8/8: Nettoyage des anciennes releases..."

cd "${RELEASES_DIR}"
ls -t | tail -n +$((MAX_RELEASES + 1)) | xargs -r rm -rf

CURRENT_COUNT=$(ls -1 | wc -l)
log_info "✅ ${CURRENT_COUNT} release(s) conservée(s)"
echo ""

# ═══════════════════════════════════════════════════════════════
# FIN
# ═══════════════════════════════════════════════════════════════
echo "═══════════════════════════════════════════════════════════════"
echo -e "  ${GREEN}✅ DÉPLOIEMENT RÉUSSI${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Release: ${TIMESTAMP}"
echo "Git: ${GIT_BRANCH}@${GIT_SHA:0:8}"
echo "URL: https://eaf.nexusreussite.academy"
echo ""
echo "Services:"
for service in ${SERVICES}; do
    STATUS=$(systemctl is-active ${service})
    echo "  - ${service}: ${STATUS}"
done
echo ""
echo "Commandes utiles:"
echo "  sudo systemctl status eaf-web"
echo "  sudo journalctl -u eaf-web -f"
echo "  sudo /opt/eaf/current/scripts/rollback-production.sh"
echo ""

exit 0
