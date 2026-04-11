#!/bin/bash
# setup-github-secrets.sh
# Script pour configurer les secrets GitHub via gh CLI
# Prérequis: gh auth login (être authentifié sur GitHub CLI)

set -euo pipefail

echo "🔐 Configuration des secrets GitHub pour Nexus EAF"
echo "==================================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Vérifier gh CLI
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) n'est pas installé${NC}"
    echo "   Installation: https://cli.github.com/"
    exit 1
fi

# Vérifier authentification
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Non authentifié sur GitHub${NC}"
    echo "   Exécutez: gh auth login"
    exit 1
fi

# Détecter le repo
echo -e "${BLUE}ℹ️  Détection du repository...${NC}"
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")

if [ -z "$REPO" ]; then
    # Essayer de lire depuis git
    if [ -d ".git" ]; then
        REPO=$(git remote -v | grep origin | head -1 | sed 's/.*github.com[:/]//; s/.git.*//; s/ .*//')
    fi
fi

if [ -z "$REPO" ]; then
    echo -e "${YELLOW}⚠️  Repository non détecté automatiquement${NC}"
    read -p "Entrez le nom du repo (format: owner/repo): " REPO
else
    echo -e "${GREEN}✅ Repository détecté: $REPO${NC}"
    read -p "Confirmer le repo [$REPO]: " CONFIRM
    REPO=${CONFIRM:-$REPO}
fi

echo ""
echo "Configuration pour: $REPO"
echo ""

# Fonction pour demander un secret
ask_secret() {
    local name=$1
    local description=$2
    local default_value=${3:-}
    
    echo -e "${BLUE}$name${NC}"
    echo "  $description"
    
    if [ -n "$default_value" ]; then
        read -p "  Valeur [$default_value]: " value
        value=${value:-$default_value}
    else
        read -sp "  Valeur (cachée): " value
        echo ""
    fi
    
    echo "$value"
}

# Fonction pour définir un secret
define_secret() {
    local name=$1
    local value=$2
    
    if [ -n "$value" ]; then
        echo "$value" | gh secret set "$name" -R "$REPO" --body - &> /dev/null
        if [ $? -eq 0 ]; then
            echo -e "  ${GREEN}✅ $name configuré${NC}"
        else
            echo -e "  ${RED}❌ Erreur lors de la configuration de $name${NC}"
        fi
    else
        echo -e "  ${YELLOW}⚠️  $name ignoré (valeur vide)${NC}"
    fi
}

echo "---------------------------------------------------"
echo "SECRETS DE PRODUCTION (obligatoires pour le deploy)"
echo "---------------------------------------------------"

# Secrets obligatoires
echo ""
echo -e "${YELLOW}1. Base de données${NC}"
PROD_DATABASE_URL=$(ask_secret "PROD_DATABASE_URL" "URL PostgreSQL de production (postgresql://user:pass@host:5432/eaf_prod)")

echo ""
echo -e "${YELLOW}2. Redis${NC}"
PROD_REDIS_URL=$(ask_secret "PROD_REDIS_URL" "URL Redis de production (redis://:password@host:6379)")

echo ""
echo -e "${YELLOW}3. Secrets de sécurité (≥ 32 caractères recommandé)${NC}"
# Générer des valeurs aléatoires par défaut
default_session=$(openssl rand -hex 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
default_csrf=$(openssl rand -hex 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
default_cron=$(openssl rand -hex 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
default_mcp=$(openssl rand -hex 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
default_billing=$(openssl rand -hex 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)

PROD_SESSION_SECRET=$(ask_secret "PROD_SESSION_SECRET" "Secret de session" "$default_session")
PROD_CSRF_SECRET=$(ask_secret "PROD_CSRF_SECRET" "Secret CSRF" "$default_csrf")
PROD_CRON_SECRET=$(ask_secret "PROD_CRON_SECRET" "Secret pour routes cron" "$default_cron")
PROD_MCP_API_KEY=$(ask_secret "PROD_MCP_API_KEY" "Clé API MCP" "$default_mcp")
PROD_BILLING_CODE_PEPPER=$(ask_secret "PROD_BILLING_CODE_PEPPER" "Pepper pour codes de facturation" "$default_billing")

echo ""
echo -e "${YELLOW}4. API externe${NC}"
PROD_MISTRAL_API_KEY=$(ask_secret "PROD_MISTRAL_API_KEY" "Clé API Mistral (laisser vide si mock)" "")

echo ""
echo -e "${YELLOW}5. Configuration applicative${NC}"
PROD_NEXT_PUBLIC_APP_URL=$(ask_secret "PROD_NEXT_PUBLIC_APP_URL" "URL publique" "https://eaf.nexusreussite.academy")

echo ""
echo -e "${YELLOW}6. SSH pour déploiement${NC}"
PROD_HOST=$(ask_secret "PROD_HOST" "IP ou hostname du serveur" "88.99.254.59")
PROD_USER=$(ask_secret "PROD_USER" "Utilisateur SSH" "root")

echo ""
echo -e "${YELLOW}7. Clé SSH${NC}"
echo "  Collez la clé privée SSH complète (début: -----BEGIN OPENSSH PRIVATE KEY-----)"
echo "  Appuyez sur Entrée, puis Ctrl+D (ou Cmd+D sur Mac) pour terminer:"
PROD_SSH_KEY=$(cat)

echo ""
echo "---------------------------------------------------"
echo "RÉCAPITULATIF"
echo "---------------------------------------------------"

# Afficher ce qui va être configuré (sans les valeurs sensibles)
echo ""
echo "Les secrets suivants vont être configurés pour $REPO:"
[ -n "$PROD_DATABASE_URL" ] && echo "  ✅ PROD_DATABASE_URL"
[ -n "$PROD_REDIS_URL" ] && echo "  ✅ PROD_REDIS_URL"
[ -n "$PROD_SESSION_SECRET" ] && echo "  ✅ PROD_SESSION_SECRET"
[ -n "$PROD_CSRF_SECRET" ] && echo "  ✅ PROD_CSRF_SECRET"
[ -n "$PROD_CRON_SECRET" ] && echo "  ✅ PROD_CRON_SECRET"
[ -n "$PROD_MCP_API_KEY" ] && echo "  ✅ PROD_MCP_API_KEY"
[ -n "$PROD_BILLING_CODE_PEPPER" ] && echo "  ✅ PROD_BILLING_CODE_PEPPER"
[ -n "$PROD_MISTRAL_API_KEY" ] && echo "  ✅ PROD_MISTRAL_API_KEY"
[ -n "$PROD_NEXT_PUBLIC_APP_URL" ] && echo "  ✅ PROD_NEXT_PUBLIC_APP_URL"
[ -n "$PROD_HOST" ] && echo "  ✅ PROD_HOST"
[ -n "$PROD_USER" ] && echo "  ✅ PROD_USER"
[ -n "$PROD_SSH_KEY" ] && echo "  ✅ PROD_SSH_KEY"

echo ""
read -p "Confirmer la configuration? [Y/n]: " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]] && [ -n "$confirm" ]; then
    echo "Annulation."
    exit 0
fi

echo ""
echo "📝 Configuration des secrets..."
echo ""

# Définir les secrets
define_secret "PROD_DATABASE_URL" "$PROD_DATABASE_URL"
define_secret "PROD_REDIS_URL" "$PROD_REDIS_URL"
define_secret "PROD_SESSION_SECRET" "$PROD_SESSION_SECRET"
define_secret "PROD_CSRF_SECRET" "$PROD_CSRF_SECRET"
define_secret "PROD_CRON_SECRET" "$PROD_CRON_SECRET"
define_secret "PROD_MCP_API_KEY" "$PROD_MCP_API_KEY"
define_secret "PROD_BILLING_CODE_PEPPER" "$PROD_BILLING_CODE_PEPPER"
define_secret "PROD_MISTRAL_API_KEY" "$PROD_MISTRAL_API_KEY"
define_secret "PROD_NEXT_PUBLIC_APP_URL" "$PROD_NEXT_PUBLIC_APP_URL"
define_secret "PROD_HOST" "$PROD_HOST"
define_secret "PROD_USER" "$PROD_USER"
define_secret "PROD_SSH_KEY" "$PROD_SSH_KEY"

echo ""
echo "==================================================="
echo -e "${GREEN}✅ Configuration des secrets terminée !${NC}"
echo ""
echo "Vérifier les secrets:"
echo "  gh secret list -R $REPO"
