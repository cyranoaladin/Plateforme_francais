#!/usr/bin/env bash
# ==============================================================================
# deploy.sh — Deploy Nexus Réussite EAF to VPS via SSH
# Usage: ./scripts/deploy.sh [user@host] [--first-run]
#
# Examples:
#   ./scripts/deploy.sh root@203.0.113.10
#   ./scripts/deploy.sh eaf@eaf.nexusreussite.academy --first-run
# ==============================================================================
set -euo pipefail

DOMAIN="eaf.nexusreussite.academy"
APP_DIR="/opt/eaf_platform"
RESSOURCES_DIR="/srv/eaf_ressources"
BRANCH="${DEPLOY_BRANCH:-main}"
SSH_TARGET="${1:?Usage: $0 user@host [--first-run]}"
FIRST_RUN="${2:-}"

echo "========================================="
echo "  Nexus Réussite EAF — Deployment"
echo "  Target: $SSH_TARGET"
echo "  Domain: $DOMAIN"
echo "  Branch: $BRANCH"
echo "========================================="

# --- Pre-flight checks ---
echo "[0/8] Vérifications locales..."
if ! ssh -o ConnectTimeout=5 "$SSH_TARGET" "echo ok" &>/dev/null; then
  echo "❌ Impossible de se connecter à $SSH_TARGET"
  echo "   Vérifiez votre clé SSH et l'adresse du serveur."
  exit 1
fi
echo "  ✅ Connexion SSH OK"

# --- 1. Sync code to server ---
echo "[1/8] Synchronisation du code vers le serveur..."
rsync -avz --delete \
  --exclude='.git' \
  --exclude='.worktrees' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.env' \
  --exclude='.env.local' \
  --exclude='.env.backup' \
  --exclude='.data' \
  --exclude='/ressources/' \
  --exclude='coverage' \
  --exclude='test-results' \
  --exclude='.antigravity' \
  --exclude='*.log' \
  --exclude='*.tsbuildinfo' \
  --exclude='*.js.map' \
  --exclude='*.d.ts.map' \
  --exclude='packages/mcp-server/dist/' \
  --exclude='packages/mcp-server/node_modules/' \
  --exclude='docs/eaf_arborescence_prod*.txt' \
  --exclude='docs/eaf_arbo_*.txt' \
  -e ssh \
  ./ "$SSH_TARGET:$APP_DIR/"

echo "  ✅ Code synchronisé"

echo "[1a/8] Nettoyage artefacts non-production..."
ssh "$SSH_TARGET" "cd $APP_DIR && rm -rf .venv .vscode .windsurf .windsurf_audit_logs .windsurfrules .superpowers forensics .claude UI_UX .env.test .vitest-unit-report.json coverage test-results 2>/dev/null; find packages/mcp-server/dist \\( -name '*.js.map' -o -name '*.d.ts.map' \\) -exec rm -f {} + 2>/dev/null || true; rm -f commit-and-push.sh create-pr-branch.sh test-admin.sh test-manual-flow.sh eaf.code-workspace proxy.ts stryker.conf.json tsconfig.tsbuildinfo 2>/dev/null; rm -f *.log 2>/dev/null; echo '  ✅ Artefacts nettoyés'"

echo "[1b/8] Préparation du volume ressources durable (symlink après build)..."
ssh "$SSH_TARGET" "mkdir -p $RESSOURCES_DIR"
# Retirer le symlink temporairement pour que Turbopack ne le traverse pas pendant le build
ssh "$SSH_TARGET" "[ -L $APP_DIR/ressources ] && rm -f $APP_DIR/ressources || true"

# --- 2. Install dependencies on server ---
echo "[2/8] Installation des dépendances..."
ssh "$SSH_TARGET" "cd $APP_DIR && npm ci --production=false --no-audit --no-fund"

# --- 3. Install MCP server dependencies ---
echo "[3/8] Installation des dépendances MCP..."
ssh "$SSH_TARGET" "cd $APP_DIR && npm install --workspace=packages/mcp-server --ignore-scripts"

# --- 4. Prisma generate & migrate ---
echo "[4/8] Prisma generate & migrate..."
ssh "$SSH_TARGET" "bash -s" <<EOF
set -euo pipefail
cd "$APP_DIR"
DATABASE_URL_VALUE="\$(grep -m1 '^DATABASE_URL=' .env .env.local 2>/dev/null | head -n1 | cut -d= -f2- || true)"
if [ -n "\$DATABASE_URL_VALUE" ]; then
  readarray -t DB_INFO < <(DATABASE_URL_VALUE="\$DATABASE_URL_VALUE" python3 - <<'PY'
import os
from urllib.parse import urlparse
raw = os.environ.get('DATABASE_URL_VALUE', '')
if raw:
    parsed = urlparse(raw)
    if parsed.hostname in ('localhost', '127.0.0.1') and parsed.path.lstrip('/') and parsed.username:
        print(parsed.path.lstrip('/'))
        print(parsed.username)
PY
)
  DB_NAME="\${DB_INFO[0]:-}"
  DB_USER="\${DB_INFO[1]:-}"
  if [ -n "\$DB_NAME" ] && [ -n "\$DB_USER" ]; then
    if ! sudo -u postgres psql -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '\$DB_NAME'" | grep -q 1; then
      sudo -u postgres createdb -O "\$DB_USER" "\$DB_NAME"
    fi
    sudo -u postgres psql -d "\$DB_NAME" -c 'CREATE EXTENSION IF NOT EXISTS vector;'

    TABLE_COUNT="\$(sudo -u postgres psql -d "\$DB_NAME" -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")"
    FAILED_MIGRATION_COUNT="\$(sudo -u postgres psql -d "\$DB_NAME" -tAc "SELECT count(*) FROM _prisma_migrations WHERE finished_at IS NULL AND rolled_back_at IS NULL;" 2>/dev/null || echo 0)"
    if [ "\${TABLE_COUNT// /}" = "1" ] && [ "\${FAILED_MIGRATION_COUNT// /}" != "0" ]; then
      sudo -u postgres dropdb --if-exists "\$DB_NAME"
      sudo -u postgres createdb -O "\$DB_USER" "\$DB_NAME"
      sudo -u postgres psql -d "\$DB_NAME" -c 'CREATE EXTENSION IF NOT EXISTS vector;'
    fi
  fi
fi
npx prisma generate
npx prisma migrate deploy
EOF

# --- 5. Build Next.js ---
echo "[5/8] Build Next.js (production)..."
LOCAL_GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
echo "  → Build SHA: $LOCAL_GIT_SHA"
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
ssh "$SSH_TARGET" "cd $APP_DIR && printf 'BUILD_GIT_SHA=%s\nBUILD_TIME=%s\n' '$LOCAL_GIT_SHA' '$BUILD_TIME' > .release.env"
ssh "$SSH_TARGET" "cd $APP_DIR && printf '%s\n' '$LOCAL_GIT_SHA' > .git_sha && printf '%s\n' '$BUILD_TIME' > .build_time"
# Remove symlinks that break Turbopack before build (restored in step 7b)
ssh "$SSH_TARGET" "cd $APP_DIR && { [ -L ressources ] && rm ressources || true; } && { [ -L public/ressources ] && rm public/ressources || true; }"
ssh "$SSH_TARGET" "cd $APP_DIR && BUILD_GIT_SHA=$LOCAL_GIT_SHA BUILD_TIME=$BUILD_TIME NODE_ENV=production npm run build"
ssh "$SSH_TARGET" "cd $APP_DIR && if [ -d .next/standalone ]; then cp -f .git_sha .build_time .next/standalone/; fi"

# --- 6. Build MCP server ---
echo "[6/8] Build MCP server..."
ssh "$SSH_TARGET" "cd $APP_DIR && npm run mcp:build"
ssh "$SSH_TARGET" "find $APP_DIR/packages/mcp-server/dist \( -name '*.js.map' -o -name '*.d.ts.map' \) -delete 2>/dev/null || true"
ssh "$SSH_TARGET" "rm -rf $APP_DIR/packages/mcp-server/src/ $APP_DIR/packages/mcp-server/tests/ 2>/dev/null"
echo "  ✅ MCP build terminé (src/ et source maps supprimés)"

# --- 7. Setup Nginx + SSL (first run only) ---
if [ "$FIRST_RUN" = "--first-run" ]; then
  echo "[7/8] Configuration Nginx + SSL (première installation)..."

  # Copy nginx config
  ssh "$SSH_TARGET" "cat > /etc/nginx/sites-available/$DOMAIN" < scripts/nginx-eaf.conf
  ssh "$SSH_TARGET" "ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/"
  ssh "$SSH_TARGET" "rm -f /etc/nginx/sites-enabled/default"
  ssh "$SSH_TARGET" "nginx -t && systemctl reload nginx"

  # SSL certificate
  echo "  → Génération du certificat SSL Let's Encrypt..."
  ssh "$SSH_TARGET" "certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@nexusreussite.academy --redirect"
  echo "  ✅ Certificat SSL installé"
else
  echo "[7/8] Nginx — pas de reconfiguration (pas --first-run)"
fi

# --- 7b. Rétablir le symlink ressources après le build ---
echo "[7b/8] Rétablissement du symlink ressources..."
ssh "$SSH_TARGET" "ln -sfn $RESSOURCES_DIR $APP_DIR/ressources"
echo "  ✅ Symlink $APP_DIR/ressources → $RESSOURCES_DIR"

# --- 8. Restart PM2 ---
echo "[8/8] Redémarrage des services PM2..."
ssh "$SSH_TARGET" "cd $APP_DIR && pm2 startOrRestart ecosystem.config.cjs --env production --update-env"
ssh "$SSH_TARGET" "pm2 save"

echo ""
echo "========================================="
echo "  ✅ Déploiement terminé !"
echo "========================================="
echo ""
echo "  🌐 https://$DOMAIN"
echo ""
echo "  Vérifications :"
echo "    curl -s https://$DOMAIN/api/v1/health"
echo "    ssh $SSH_TARGET 'pm2 status'"
echo "    ssh $SSH_TARGET 'pm2 logs --lines 20'"
echo ""
