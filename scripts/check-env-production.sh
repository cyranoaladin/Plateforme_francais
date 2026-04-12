#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# CHECK ENV PRODUCTION - Vérification complète de l'environnement
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

SECRETS_FILE="${SECRETS_FILE:-/opt/eaf/secrets/.env.production}"
ERRORS=0
WARNINGS=0

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

error() { echo -e "${RED}[ERROR]${NC} $1"; ERRORS=$((ERRORS + 1)); }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; WARNINGS=$((WARNINGS + 1)); }
ok() { echo -e "${GREEN}[OK]${NC} $1"; }
info() { echo -e "${BLUE}[INFO]${NC} $1"; }

echo "═══════════════════════════════════════════════════════════════"
echo "  VÉRIFICATION ENVIRONNEMENT PRODUCTION"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# ═══════════════════════════════════════════════════════════════
# 1. FICHIER DE SECRETS
# ═══════════════════════════════════════════════════════════════
info "1. Vérification du fichier de secrets..."

if [[ ! -f "${SECRETS_FILE}" ]]; then
    error "Fichier de secrets introuvable: ${SECRETS_FILE}"
    exit 1
fi

PERMS=$(stat -c %a "${SECRETS_FILE}" 2>/dev/null || stat -f %Lp "${SECRETS_FILE}" 2>/dev/null)
if [[ "${PERMS}" == "600" ]]; then
    ok "Permissions correctes (600)"
else
    error "Permissions incorrectes: ${PERMS} (doit être 600)"
fi

OWNER=$(stat -c %U "${SECRETS_FILE}" 2>/dev/null)
if [[ "${OWNER}" == "eaf" ]]; then
    ok "Propriétaire correct (eaf)"
else
    warn "Propriétaire: ${OWNER} (devrait être eaf)"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 2. VARIABLES OBLIGATOIRES
# ═══════════════════════════════════════════════════════════════
info "2. Variables obligatoires..."

REQUIRED_VARS=(
    "NODE_ENV:production"
    "PORT:3000"
    "NEXT_PUBLIC_APP_URL:https://"
    "SESSION_SECRET:"
    "CSRF_SECRET:"
    "CRON_SECRET:"
    "BILLING_CODE_PEPPER:"
    "DATABASE_URL:postgresql://"
    "MCP_API_KEY:"
)

for var_def in "${REQUIRED_VARS[@]}"; do
    VAR_NAME="${var_def%%:*}"
    VAR_PREFIX="${var_def##*:}"
    
    VALUE=$(grep "^${VAR_NAME}=" "${SECRETS_FILE}" 2>/dev/null | cut -d= -f2- | head -1 || echo "")
    
    if [[ -z "${VALUE}" ]]; then
        error "${VAR_NAME} est vide ou manquant"
        continue
    fi
    
    if [[ -n "${VAR_PREFIX}" && "${VALUE}" != "${VAR_PREFIX}"* ]]; then
        if [[ "${VAR_NAME}" != "SESSION_SECRET" && "${VAR_NAME}" != "CSRF_SECRET" && "${VAR_NAME}" != "CRON_SECRET" && "${VAR_NAME}" != "BILLING_CODE_PEPPER" && "${VAR_NAME}" != "MCP_API_KEY" ]]; then
            error "${VAR_NAME} ne commence pas par ${VAR_PREFIX}"
            continue
        fi
    fi
    
    # Vérifier les secrets faibles
    if [[ "${VAR_NAME}" == *"SECRET"* || "${VAR_NAME}" == *"PEPPER"* || "${VAR_NAME}" == *"API_KEY"* ]]; then
        if [[ "${VALUE}" == *"change"* || "${VALUE}" == *"test"* || "${VALUE}" == *"123"* || ${#VALUE} -lt 16 ]]; then
            error "${VAR_NAME} semble être une valeur faible ou de test"
            continue
        fi
    fi
    
    ok "${VAR_NAME}"
done

echo ""

# ═══════════════════════════════════════════════════════════════
# 3. LLM PROVIDERS
# ═══════════════════════════════════════════════════════════════
info "3. Fournisseurs LLM..."

LLM_KEYS=0
for var in MISTRAL_API_KEY GEMINI_API_KEY OPENAI_API_KEY; do
    VALUE=$(grep "^${var}=" "${SECRETS_FILE}" 2>/dev/null | cut -d= -f2- | head -1 || echo "")
    if [[ -n "${VALUE}" && ${#VALUE} -gt 10 ]]; then
        LLM_KEYS=$((LLM_KEYS + 1))
        ok "${var} configuré"
    fi
done

if [[ ${LLM_KEYS} -eq 0 ]]; then
    error "Aucun fournisseur LLM configuré (MISTRAL_API_KEY, GEMINI_API_KEY ou OPENAI_API_KEY)"
elif [[ ${LLM_KEYS} -eq 1 ]]; then
    warn "Un seul fournisseur LLM configuré (pas de fallback)"
else
    ok "${LLM_KEYS} fournisseurs LLM configurés"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 4. SERVICES OPTIONNELS
# ═══════════════════════════════════════════════════════════════
info "4. Services optionnels..."

# Redis
REDIS_URL=$(grep "^REDIS_URL=" "${SECRETS_FILE}" 2>/dev/null | cut -d= -f2- | head -1 || echo "")
if [[ -n "${REDIS_URL}" ]]; then
    ok "Redis configuré"
else
    warn "Redis non configuré (optionnel mais recommandé)"
fi

# Email
SMTP_PASS=$(grep "^SMTP_PASS=" "${SECRETS_FILE}" 2>/dev/null | cut -d= -f2- | head -1 || echo "")
if [[ -n "${SMTP_PASS}" && ${#SMTP_PASS} -gt 5 ]]; then
    ok "Email configuré"
else
    warn "Email non configuré (optionnel mais recommandé)"
fi

# RAG
RAG_URL=$(grep "^RAG_API_URL=" "${SECRETS_FILE}" 2>/dev/null | cut -d= -f2- | head -1 || echo "")
if [[ -n "${RAG_URL}" ]]; then
    ok "RAG configuré"
else
    warn "RAG non configuré (optionnel mais recommandé)"
fi

echo ""

# ═══════════════════════════════════════════════════════════════
# 5. STRUCTURE DE RÉPERTOIRES
# ═══════════════════════════════════════════════════════════════
info "5. Structure de répertoires..."

for dir in /opt/eaf/current /opt/eaf/releases /opt/eaf/shared /opt/eaf/secrets; do
    if [[ -d "${dir}" ]]; then
        ok "${dir} existe"
    else
        error "${dir} n'existe pas"
    fi
done

echo ""

# ═══════════════════════════════════════════════════════════════
# 6. SERVICES SYSTEMD
# ═══════════════════════════════════════════════════════════════
info "6. Services systemd..."

for service in eaf-web eaf-mcp eaf-worker; do
    if systemctl list-unit-files | grep -q "^${service}.service"; then
        ok "${service} installé"
        
        if systemctl is-active --quiet ${service}; then
            ok "${service} actif"
        else
            warn "${service} inactif"
        fi
    else
        error "${service} non installé"
    fi
done

echo ""

# ═══════════════════════════════════════════════════════════════
# RÉSULTAT
# ═══════════════════════════════════════════════════════════════
echo "═══════════════════════════════════════════════════════════════"
if [[ ${ERRORS} -eq 0 && ${WARNINGS} -eq 0 ]]; then
    echo -e "  ${GREEN}✅ ENVIRONNEMENT VALIDE${NC}"
    echo "═══════════════════════════════════════════════════════════════"
    exit 0
elif [[ ${ERRORS} -eq 0 ]]; then
    echo -e "  ${YELLOW}⚠️  ENVIRONNEMENT VALIDE AVEC AVERTISSEMENTS${NC}"
    echo "  Warnings: ${WARNINGS}"
    echo "═══════════════════════════════════════════════════════════════"
    exit 0
else
    echo -e "  ${RED}❌ ENVIRONNEMENT INVALIDE${NC}"
    echo "  Erreurs: ${ERRORS}"
    echo "  Warnings: ${WARNINGS}"
    echo "═══════════════════════════════════════════════════════════════"
    exit 1
fi
