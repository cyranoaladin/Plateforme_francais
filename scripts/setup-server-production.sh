#!/bin/bash
# setup-server-production.sh
# Script de configuration initiale du serveur de production
# À exécuter sur root@88.99.254.59 avant le premier déploiement blue-green

set -euo pipefail

echo "🚀 Configuration initiale du serveur Nexus EAF Production"
echo "=========================================================="

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Vérifier root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Ce script doit être exécuté en root${NC}"
    exit 1
fi

# 1. Vérifier nginx installé
if ! command -v nginx &> /dev/null; then
    echo -e "${RED}❌ Nginx n'est pas installé${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Nginx détecté${NC}"

# 2. Ajouter limit_req_zone dans nginx.conf si pas déjà présent
NGINX_CONF="/etc/nginx/nginx.conf"

if grep -q "limit_req_zone.*zone=api" "$NGINX_CONF"; then
    echo -e "${YELLOW}⚠️  limit_req_zone api déjà présent dans nginx.conf${NC}"
else
    echo "📝 Ajout limit_req_zone dans nginx.conf..."
    # Créer un backup
    cp "$NGINX_CONF" "${NGINX_CONF}.backup.$(date +%Y%m%d_%H%M%S)"
    
    # Insérer après la ligne 'http {'
    sed -i '/^http {/a\    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;\n    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;' "$NGINX_CONF"
    echo -e "${GREEN}✅ limit_req_zone ajouté${NC}"
fi

# 3. Créer le répertoire conf.d
mkdir -p /etc/nginx/conf.d

# 4. Créer le fichier upstream initial (slot blue = port 3000)
UPSTREAM_FILE="/etc/nginx/conf.d/upstream-active.conf"
echo "📝 Création de $UPSTREAM_FILE..."
cat > "$UPSTREAM_FILE" << 'EOF'
upstream eaf_backend { server 127.0.0.1:3000; keepalive 32; }
EOF
echo -e "${GREEN}✅ Upstream créé (port 3000 - slot blue)${NC}"

# 5. Créer le fichier de slot actif
echo "blue" > /etc/nginx/conf.d/active-slot.txt
echo -e "${GREEN}✅ Slot actif initialisé: blue${NC}"

# 6. Copier la configuration du site
if [ -f "ops/nginx/eaf-nexus.conf" ]; then
    echo "📝 Copie de la configuration nginx..."
    cp ops/nginx/eaf-nexus.conf /etc/nginx/sites-available/eaf-nexus.conf
    
    # Activer le site
    ln -sf /etc/nginx/sites-available/eaf-nexus.conf /etc/nginx/sites-enabled/eaf-nexus.conf
    echo -e "${GREEN}✅ Configuration nginx activée${NC}"
else
    echo -e "${YELLOW}⚠️  ops/nginx/eaf-nexus.conf non trouvé localement${NC}"
    echo "    Ce fichier doit être déployé via git dans /var/www/eaf-blue"
fi

# 7. Créer les répertoires de déploiement
mkdir -p /var/www/eaf-blue
mkdir -p /var/www/eaf-green
mkdir -p /var/log/pm2
chown -R nexus:nexus /var/www/eaf-* 2>/dev/null || true
chown -R nexus:nexus /var/log/pm2 2>/dev/null || true
echo -e "${GREEN}✅ Répertoires de déploiement créés${NC}"

# 8. Tester nginx
echo "🔍 Test de la configuration nginx..."
if nginx -t; then
    echo -e "${GREEN}✅ Configuration nginx valide${NC}"
    
    echo "🔄 Rechargement nginx..."
    nginx -s reload
    echo -e "${GREEN}✅ Nginx rechargé${NC}"
else
    echo -e "${RED}❌ Erreur dans la configuration nginx${NC}"
    echo "    Vérifiez les erreurs ci-dessus"
    exit 1
fi

# 9. Vérifier les répertoires ressources
mkdir -p /srv/eaf_ressources
chown -R nexus:nexus /srv/eaf_ressources 2>/dev/null || true
echo -e "${GREEN}✅ Répertoire ressources créé: /srv/eaf_ressources${NC}"

echo ""
echo "=========================================================="
echo -e "${GREEN}✅ Configuration serveur terminée !${NC}"
echo ""
echo "Prochaines étapes:"
echo "  1. Déployer le code: git clone dans /var/www/eaf-blue"
echo "  2. Configurer les secrets GitHub (voir scripts/setup-github-secrets.sh)"
echo "  3. Lancer le premier déploiement via CI/CD"
echo ""
echo "Vérification rapide:"
echo "  cat /etc/nginx/conf.d/upstream-active.conf"
echo "  cat /etc/nginx/conf.d/active-slot.txt"
echo "  nginx -t"
