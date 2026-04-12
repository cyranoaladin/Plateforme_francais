#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# ROLLBACK PRODUCTION - Retour à la release précédente
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

BASE_DIR="/opt/eaf"
RELEASES_DIR="${BASE_DIR}/releases"
CURRENT_LINK="${BASE_DIR}/current"
SERVICES="eaf-web eaf-mcp eaf-worker"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "═══════════════════════════════════════════════════════════════"
echo "  ROLLBACK PRODUCTION - Nexus EAF"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Obtenir la release actuelle
CURRENT_RELEASE=$(readlink -f "${CURRENT_LINK}" 2>/dev/null || echo "none")
CURRENT_NAME=$(basename "${CURRENT_RELEASE}" 2>/dev/null || echo "none")

echo "Release actuelle: ${CURRENT_NAME}"
echo ""

# Lister les releases disponibles
echo "Releases disponibles:"
ls -lt "${RELEASES_DIR}" | tail -n +2 | head -10 | awk '{print "  " $9 " (" $6 " " $7 " " $8 ")"}'
echo ""

# Trouver la release précédente
PREVIOUS_NAME=$(ls -t "${RELEASES_DIR}" | grep -v "^${CURRENT_NAME}$" | head -1)

if [[ -z "${PREVIOUS_NAME}" ]]; then
    log_error "Aucune release précédente trouvée!"
    exit 1
fi

PREVIOUS_RELEASE="${RELEASES_DIR}/${PREVIOUS_NAME}"

echo "Release cible pour rollback: ${PREVIOUS_NAME}"
echo ""

# Confirmation
if [[ "${FORCE_ROLLBACK:-false}" != "true" ]]; then
    read -p "Confirmer le rollback? (yes/no): " CONFIRM
    if [[ "${CONFIRM}" != "yes" ]]; then
        echo "Rollback annulé."
        exit 0
    fi
fi

# Arrêter les services
log_info "Arrêt des services..."
systemctl stop ${SERVICES} 2>/dev/null || true
sleep 2

# Switch symlink
log_info "Switch vers ${PREVIOUS_NAME}..."
ln -sfn "${PREVIOUS_RELEASE}" "${CURRENT_LINK}"

# Démarrer les services
log_info "Démarrage des services..."
systemctl daemon-reload
for service in ${SERVICES}; do
    systemctl start ${service}
done

# Attendre
sleep 10

# Vérifier
for service in ${SERVICES}; do
    if systemctl is-active --quiet ${service}; then
        log_info "✅ ${service} démarré"
    else
        log_error "❌ ${service} en échec"
    fi
done

# Test HTTP
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")
if [[ "${HTTP_CODE}" == "200" ]]; then
    log_info "✅ Application répond HTTP 200"
else
    log_error "❌ Application ne répond pas correctement (HTTP ${HTTP_CODE})"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ROLLBACK TERMINÉ"
echo "  Nouvelle release active: ${PREVIOUS_NAME}"
echo "═══════════════════════════════════════════════════════════════"
