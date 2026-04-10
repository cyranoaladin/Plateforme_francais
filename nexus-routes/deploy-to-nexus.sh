#!/bin/bash
# Script de déploiement des routes API manquantes sur Nexus
# Usage: ./deploy-to-nexus.sh root@nexusreussite.academy

set -euo pipefail

REMOTE_HOST="${1:-root@nexusreussite.academy}"
LOCAL_ROUTES_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Déploiement des routes API Nexus ==="
echo "Hôte distant: $REMOTE_HOST"
echo ""

# Vérifier la connexion SSH
echo "→ Vérification connexion SSH..."
ssh -o ConnectTimeout=5 "$REMOTE_HOST" "echo 'Connexion OK'" || {
  echo "❌ Impossible de se connecter à $REMOTE_HOST"
  exit 1
}

# Créer les répertoires distants et copier les fichiers
echo "→ Création des répertoires et copie des fichiers..."

ssh "$REMOTE_HOST" "mkdir -p /opt/nexus/app/api/admin/directeur/stats"
ssh "$REMOTE_HOST" "mkdir -p /opt/nexus/app/api/admin/users/search"
ssh "$REMOTE_HOST" "mkdir -p /opt/nexus/app/api/assistant/coaches/\[id\]"
ssh "$REMOTE_HOST" "mkdir -p /opt/nexus/app/api/assistant/students/credits"
ssh "$REMOTE_HOST" "mkdir -p /opt/nexus/app/api/coach/sessions/\[sessionId\]"
ssh "$REMOTE_HOST" "mkdir -p /opt/nexus/app/api/invoices/\[id\]/pdf"
ssh "$REMOTE_HOST" "mkdir -p /opt/nexus/app/api/invoices/\[id\]/receipt"
ssh "$REMOTE_HOST" "mkdir -p /opt/nexus/app/api/payments/bank-transfer/confirm"
ssh "$REMOTE_HOST" "mkdir -p /opt/nexus/app/api/programme/maths-1ere/progress"
ssh "$REMOTE_HOST" "mkdir -p /opt/nexus/app/api/programme/maths-terminale/progress"
ssh "$REMOTE_HOST" "mkdir -p /opt/nexus/app/api/students/\[studentId\]"
ssh "$REMOTE_HOST" "mkdir -p /opt/nexus/app/api/students/\[studentId\]/badges"
ssh "$REMOTE_HOST" "mkdir -p /opt/nexus/app/stages/fevrier-2026/bilan/\[reservationId\]"

# Copier les fichiers
scp "$LOCAL_ROUTES_DIR/admin/directeur/stats/route.ts" "$REMOTE_HOST:/opt/nexus/app/api/admin/directeur/stats/route.ts"
scp "$LOCAL_ROUTES_DIR/admin/users/search/route.ts" "$REMOTE_HOST:/opt/nexus/app/api/admin/users/search/route.ts"
scp "$LOCAL_ROUTES_DIR/assistant/coaches/\[id\]/route.ts" "$REMOTE_HOST:/opt/nexus/app/api/assistant/coaches/\[id\]/route.ts"
scp "$LOCAL_ROUTES_DIR/assistant/students/credits/route.ts" "$REMOTE_HOST:/opt/nexus/app/api/assistant/students/credits/route.ts"
scp "$LOCAL_ROUTES_DIR/coach/sessions/\[sessionId\]/route.ts" "$REMOTE_HOST:/opt/nexus/app/api/coach/sessions/\[sessionId\]/route.ts"
scp "$LOCAL_ROUTES_DIR/invoices/\[id\]/pdf/route.ts" "$REMOTE_HOST:/opt/nexus/app/api/invoices/\[id\]/pdf/route.ts"
scp "$LOCAL_ROUTES_DIR/invoices/\[id\]/receipt/route.ts" "$REMOTE_HOST:/opt/nexus/app/api/invoices/\[id\]/receipt/route.ts"
scp "$LOCAL_ROUTES_DIR/payments/bank-transfer/confirm/route.ts" "$REMOTE_HOST:/opt/nexus/app/api/payments/bank-transfer/confirm/route.ts"
scp "$LOCAL_ROUTES_DIR/programme/maths-1ere/progress/route.ts" "$REMOTE_HOST:/opt/nexus/app/api/programme/maths-1ere/progress/route.ts"
scp "$LOCAL_ROUTES_DIR/programme/maths-terminale/progress/route.ts" "$REMOTE_HOST:/opt/nexus/app/api/programme/maths-terminale/progress/route.ts"
scp "$LOCAL_ROUTES_DIR/students/\[studentId\]/route.ts" "$REMOTE_HOST:/opt/nexus/app/api/students/\[studentId\]/route.ts"
scp "$LOCAL_ROUTES_DIR/students/\[studentId\]/badges/route.ts" "$REMOTE_HOST:/opt/nexus/app/api/students/\[studentId\]/badges/route.ts"
scp "$LOCAL_ROUTES_DIR/stages/fevrier-2026/bilan/\[reservationId\]/page.tsx" "$REMOTE_HOST:/opt/nexus/app/stages/fevrier-2026/bilan/\[reservationId\]/page.tsx"

echo "→ Fichiers copiés. Lancement du build..."

# Build et reload
ssh "$REMOTE_HOST" "cd /opt/nexus && npm run typecheck 2>&1 | tail -10"
ssh "$REMOTE_HOST" "cd /opt/nexus && npm run build 2>&1 | tail -10"
ssh "$REMOTE_HOST" "cd /opt/nexus && pm2 reload ecosystem.config.js"

echo ""
echo "=== Déploiement terminé ==="
echo "Vérification: curl https://nexusreussite.academy/api/health"
