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
RELEASES_DIR="/opt/eaf/releases"
CURRENT_LINK="/opt/eaf/current"
RESSOURCES_DIR="/srv/eaf_ressources"
BRANCH="${DEPLOY_BRANCH:-main}"
APP_RUNTIME_USER="${APP_RUNTIME_USER:-nexus}"
APP_RUNTIME_HOME="${APP_RUNTIME_HOME:-/opt/nexus}"
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
  --filter=':- .rsyncignore' \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='/.data' \
  --exclude='/ressources/' \
  -e ssh \
  ./ "$SSH_TARGET:$APP_DIR/"

echo "  ✅ Code synchronisé"

echo "[1a/8] Nettoyage artefacts non-production..."
ssh "$SSH_TARGET" "cd $APP_DIR && rm -rf .venv venv .vscode .windsurf .windsurf_audit_logs .windsurfrules .superpowers .claude .codex .archives .qwen forensics UI_UX .env.test .vitest-unit-report.json coverage test-results tests dist .worktrees 2>/dev/null; find packages/mcp-server/dist \\( -name '*.js.map' -o -name '*.d.ts.map' \\) -exec rm -f {} + 2>/dev/null || true; rm -f create-pr-branch.sh test-admin.sh test-manual-flow.sh eaf.code-workspace proxy.ts stryker.conf.json tsconfig.tsbuildinfo 2>/dev/null; rm -f scripts/run-all-tests.sh scripts/test-production-locale.sh scripts/test-402-live.sh _*.ts 2>/dev/null; rm -f *.log arborescence*.txt 2>/dev/null; echo '  ✅ Artefacts nettoyés'"

echo "[1b/8] Préparation de l'utilisateur runtime..."
ssh "$SSH_TARGET" "id -u $APP_RUNTIME_USER >/dev/null 2>&1 || useradd -r -m -d $APP_RUNTIME_HOME -s /bin/bash $APP_RUNTIME_USER; mkdir -p $APP_RUNTIME_HOME/.pm2 /var/log/pm2 $APP_DIR/.data/migration-backups /opt/eaf/shared/uploads; chown -R $APP_RUNTIME_USER:$APP_RUNTIME_USER $APP_RUNTIME_HOME /var/log/pm2 $APP_DIR/.data /opt/eaf/shared/uploads; chown -R root:$APP_RUNTIME_USER $APP_DIR; chmod -R g+rX $APP_DIR; echo '  ✅ Runtime user prêt'"

echo "[1c/8] Secrets hors de l'arbre applicatif..."
ssh "$SSH_TARGET" "bash -s" <<'SECRETS_EOF'
set -euo pipefail
APP_DIR="/opt/eaf_platform"
SECRETS_DIR="/etc/eaf/secrets"

# Créer le répertoire des secrets hors app-tree
mkdir -p "$SECRETS_DIR"
chmod 750 "$SECRETS_DIR"

# Migrer .env → /etc/eaf/secrets/ s'il existe dans le répertoire app et n'est pas déjà un symlink
for env_file in .env .env.local; do
  src="$APP_DIR/$env_file"
  dst="$SECRETS_DIR/$env_file"
  if [ -f "$src" ] && [ ! -L "$src" ]; then
    mv "$src" "$dst"
    echo "  → $env_file déplacé vers $dst"
  fi
  # Créer/mettre à jour le symlink
  if [ -f "$dst" ]; then
    ln -sfn "$dst" "$src"
    chown -h root:root "$src"
    echo "  → Symlink $src → $dst"
  fi
done

# MCP server .env
MCP_ENV="$APP_DIR/packages/mcp-server/.env"
MCP_DST="$SECRETS_DIR/mcp-server.env"
if [ -f "$MCP_ENV" ] && [ ! -L "$MCP_ENV" ]; then
  mv "$MCP_ENV" "$MCP_DST"
fi
if [ -f "$MCP_DST" ]; then
  ln -sfn "$MCP_DST" "$MCP_ENV"
  chown -h root:root "$MCP_ENV"
fi

# Permissions strictes sur les secrets réels
find "$SECRETS_DIR" -type f -exec chmod 640 {} \; -exec chown root:root {} \;

# Supprimer les backups d'env dans l'arbre app
rm -f "$APP_DIR/.env.backup" "$APP_DIR/.env.test" 2>/dev/null || true

echo "  ✅ Secrets dans $SECRETS_DIR (symlinks depuis $APP_DIR)"
SECRETS_EOF

echo "[1d/8] Vérification du volume ressources durable..."
ssh "$SSH_TARGET" "mkdir -p $RESSOURCES_DIR"
REMOTE_RESOURCE_COUNT=$(ssh "$SSH_TARGET" "find -L $RESSOURCES_DIR -type f 2>/dev/null | wc -l")
if [ "${REMOTE_RESOURCE_COUNT:-0}" -lt 100 ]; then
  if [ -d "./ressources" ]; then
    echo "  → Ressources distantes insuffisantes (${REMOTE_RESOURCE_COUNT:-0}). Synchronisation depuis la machine locale..."
    rsync -az --delete ./ressources/ "$SSH_TARGET:$RESSOURCES_DIR/"
    REMOTE_RESOURCE_COUNT=$(ssh "$SSH_TARGET" "find -L $RESSOURCES_DIR -type f 2>/dev/null | wc -l")
  fi
fi
if [ "${REMOTE_RESOURCE_COUNT:-0}" -lt 100 ]; then
  echo "❌ Volume ressources invalide ou incomplet: ${REMOTE_RESOURCE_COUNT:-0} fichiers dans $RESSOURCES_DIR"
  echo "   Ajoutez les ressources localement ou copiez-les manuellement sur le serveur avant de relancer."
  exit 1
fi
echo "  ✅ $REMOTE_RESOURCE_COUNT fichiers ressources disponibles dans $RESSOURCES_DIR"

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

# Pre-migration backup (safety net)
BACKUP_DIR="/opt/backups"
mkdir -p "\$BACKUP_DIR"
BACKUP_FILE="\$BACKUP_DIR/pre_migration_\$(date +%Y%m%d_%H%M%S).dump"
echo "  Creating pre-migration backup: \$BACKUP_FILE"
sudo -u postgres pg_dump -Fc "\$DB_NAME" > "\$BACKUP_FILE" 2>/dev/null || echo "  ⚠ Backup skipped (empty DB or first deploy)"

npx prisma migrate deploy
EOF

echo "[4b/8] Archivage des file stores legacy..."
ssh "$SSH_TARGET" "cd $APP_DIR && LEGACY_FILES='.data/memory-store.json .data/oral-sessions.json .data/premium-store.json .data/epreuves-store.json'; ACTIVE=''; for file in \$LEGACY_FILES; do if [ -f \$file ]; then ACTIVE=\"\$ACTIVE \$file\"; fi; done; if [ -n \"\${ACTIVE# }\" ]; then ARCHIVE_DIR=.data/migration-backups/\$(date +%Y%m%d_%H%M%S)_deploy_archive; mkdir -p \"\$ARCHIVE_DIR\"; mv \$ACTIVE \"\$ARCHIVE_DIR\"/; echo \"  Archived legacy stores to \$ARCHIVE_DIR\"; else echo '  No active legacy file stores'; fi"

echo "[4c/8] Sauvegarde préventive des uploads standalone avant build..."
ssh "$SSH_TARGET" "if [ -d $APP_DIR/.next/standalone/.data/uploads ]; then COUNT=\$(find $APP_DIR/.next/standalone/.data/uploads -type f 2>/dev/null | wc -l); if [ \$COUNT -gt 0 ]; then echo '  ⚠ '\$COUNT' fichiers détectés dans standalone/.data/uploads — migration vers /opt/eaf/shared/uploads/'; rsync -a $APP_DIR/.next/standalone/.data/uploads/ /opt/eaf/shared/uploads/ 2>/dev/null || true; fi; fi"

# --- 5. Build Next.js ---
echo "[5/8] Build Next.js (production)..."
LOCAL_GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
echo "  → Build SHA: $LOCAL_GIT_SHA"
BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
ssh "$SSH_TARGET" "cd $APP_DIR && printf 'BUILD_GIT_SHA=%s\nBUILD_TIME=%s\nHEALTH_CHECK_READY=true\n' '$LOCAL_GIT_SHA' '$BUILD_TIME' > .release.env"
ssh "$SSH_TARGET" "cd $APP_DIR && printf '%s\n' '$LOCAL_GIT_SHA' > .git_sha && printf '%s\n' '$BUILD_TIME' > .build_time"
# Remove legacy symlinks that break Turbopack before build.
ssh "$SSH_TARGET" "cd $APP_DIR && { [ -L ressources ] && rm ressources || true; } && { [ -L public/ressources ] && rm public/ressources || true; }"
ssh "$SSH_TARGET" "cd $APP_DIR && npx prisma generate --schema=prisma/schema.prisma"
ssh "$SSH_TARGET" "cd $APP_DIR && BUILD_GIT_SHA=$LOCAL_GIT_SHA BUILD_TIME=$BUILD_TIME NODE_ENV=production npm run build"
ssh "$SSH_TARGET" "cd $APP_DIR && if [ -d .next/standalone ]; then cp -f .git_sha .build_time .next/standalone/; fi"
# Sync server chunks missing from standalone (Turbopack sometimes omits action chunks)
ssh "$SSH_TARGET" "cd $APP_DIR && rsync -a --ignore-existing .next/server/chunks/ .next/standalone/.next/server/chunks/ 2>/dev/null && echo '  ✅ Server chunks synced to standalone'"

# --- 5b. Fix permissions on standalone .env ---
echo "[5b/8] Correction des permissions du .env standalone..."
ssh "$SSH_TARGET" "cd $APP_DIR && if [ -f .next/standalone/.env ]; then chown root:$APP_RUNTIME_USER .next/standalone/.env && chmod 640 .next/standalone/.env && echo '  ✅ Permissions .env corrigées (root:$APP_RUNTIME_USER, 640)'; fi"
# Also ensure the main .env symlink is readable
ssh "$SSH_TARGET" "cd $APP_DIR && if [ -L .env ]; then chmod 640 .env 2>/dev/null || true; fi"

# --- 6. Build MCP server ---
echo "[6/8] Build MCP server..."
ssh "$SSH_TARGET" "cd $APP_DIR && npm run mcp:build"
ssh "$SSH_TARGET" "find $APP_DIR/packages/mcp-server/dist \( -name '*.js.map' -o -name '*.d.ts.map' \) -delete 2>/dev/null || true"
ssh "$SSH_TARGET" "rm -rf $APP_DIR/packages/mcp-server/src/ $APP_DIR/packages/mcp-server/tests/ 2>/dev/null"
echo "  ✅ MCP build terminé (src/ et source maps supprimés)"

echo "[6b/8] Publication de la release active..."
ssh "$SSH_TARGET" "bash -s" <<EOF
set -euo pipefail
APP_DIR="$APP_DIR"
RELEASES_DIR="$RELEASES_DIR"
CURRENT_LINK="$CURRENT_LINK"
APP_RUNTIME_USER="$APP_RUNTIME_USER"
RELEASE_ID="\$(date +%Y%m%d_%H%M%S)"
RELEASE_DIR="\$RELEASES_DIR/\$RELEASE_ID"

mkdir -p "\$RELEASE_DIR"
rsync -a --delete "\$APP_DIR/" "\$RELEASE_DIR/"
chown -R root:"\$APP_RUNTIME_USER" "\$RELEASE_DIR"
chmod -R g+rX "\$RELEASE_DIR"

ln -sfn "\$RELEASE_DIR" "\$CURRENT_LINK"
chown -h root:root "\$CURRENT_LINK"

# Keep rollback useful without accumulating unbounded 1GB+ releases.
find "\$RELEASES_DIR" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' \
  | sort -rn \
  | awk 'NR>5 {print \$2}' \
  | xargs -r rm -rf

echo "  ✅ Release active: \$RELEASE_DIR"
EOF

# --- 7. Sync Nginx config + SSL (first run only for certbot) ---
echo "[7/8] Synchronisation Nginx..."
ssh "$SSH_TARGET" "cat > /etc/nginx/sites-available/$DOMAIN" < scripts/nginx-eaf.conf
SSL_CERT_LINE="    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;"
SSL_KEY_LINE="    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;"
ssh "$SSH_TARGET" "bash -s" <<EOF
set -euo pipefail
if [ -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem ] && [ -f /etc/letsencrypt/live/$DOMAIN/privkey.pem ]; then
  python3 - <<'PY'
from pathlib import Path

domain = "$DOMAIN"
config_path = Path(f"/etc/nginx/sites-available/{domain}")
text = config_path.read_text()

replacements = {
    f"    # ssl_certificate     /etc/letsencrypt/live/{domain}/fullchain.pem;":
        """$SSL_CERT_LINE""",
    f"    # ssl_certificate_key /etc/letsencrypt/live/{domain}/privkey.pem;":
        """$SSL_KEY_LINE""",
    "    # include /etc/letsencrypt/options-ssl-nginx.conf;":
        "    include /etc/letsencrypt/options-ssl-nginx.conf;",
    "    # ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;":
        "    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;",
}

for source, target in replacements.items():
    text = text.replace(source, target)

config_path.write_text(text)
PY
fi
EOF
ssh "$SSH_TARGET" "ln -sfn /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN"

if [ "$FIRST_RUN" = "--first-run" ]; then
  echo "  → Activation du vhost (première installation)..."
  ssh "$SSH_TARGET" "rm -f /etc/nginx/sites-enabled/default"
fi

ssh "$SSH_TARGET" "nginx -t && systemctl reload nginx"
echo "  ✅ Configuration Nginx synchronisée"

if [ "$FIRST_RUN" = "--first-run" ]; then
  echo "  → Génération du certificat SSL Let's Encrypt..."
  ssh "$SSH_TARGET" "certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@nexusreussite.academy --redirect"
  echo "  ✅ Certificat SSL installé"
else
  echo "  → Certificat existant conservé"
fi

echo "[7b/8] Vérification du volume ressources durable..."
ssh "$SSH_TARGET" "COUNT=\$(find -L $RESSOURCES_DIR -type f 2>/dev/null | wc -l); if [ \"\$COUNT\" -lt 100 ]; then echo '  ❌ Volume ressources invalide: '\$COUNT' fichiers'; exit 1; else echo '  ✅ '\$COUNT' fichiers ressources accessibles dans $RESSOURCES_DIR'; fi"

echo "[7d/8] Configuration du backup quotidien des uploads..."
ssh "$SSH_TARGET" "cat > /etc/cron.d/nexus-backup <<'EOF'
# Backup quotidien des uploads (03:00 heure serveur)
0 3 * * * $APP_RUNTIME_USER cd $APP_DIR && bash scripts/backup-uploads.sh >> /var/log/nexus-backup.log 2>&1
EOF
chmod 644 /etc/cron.d/nexus-backup
systemctl reload cron 2>/dev/null || service cron reload 2>/dev/null || true
cat /etc/cron.d/nexus-backup"

echo "[7e/8] Configuration du healthcheck horaire..."
ssh "$SSH_TARGET" "cat > /etc/cron.d/nexus-healthcheck <<'EOF'
# Vérification santé applicative toutes les heures
0 * * * * $APP_RUNTIME_USER curl -s http://localhost:3000/api/v1/health | python3 -c \"import json,sys; d=json.load(sys.stdin); s=d['status']; exit(0 if s=='ok' else 1)\" || echo \"HEALTH FAIL at \$(date)\" >> /var/log/nexus-health.log 2>&1
EOF
chmod 644 /etc/cron.d/nexus-healthcheck
systemctl reload cron 2>/dev/null || service cron reload 2>/dev/null || true
cat /etc/cron.d/nexus-healthcheck"

echo "[7f/8] Configuration de la rotation des logs PM2..."
ssh "$SSH_TARGET" "sudo -u $APP_RUNTIME_USER env HOME=$APP_RUNTIME_HOME PM2_HOME=$APP_RUNTIME_HOME/.pm2 pm2 module:list | grep -q pm2-logrotate || sudo -u $APP_RUNTIME_USER env HOME=$APP_RUNTIME_HOME PM2_HOME=$APP_RUNTIME_HOME/.pm2 pm2 install pm2-logrotate"
ssh "$SSH_TARGET" "sudo -u $APP_RUNTIME_USER env HOME=$APP_RUNTIME_HOME PM2_HOME=$APP_RUNTIME_HOME/.pm2 pm2 set pm2-logrotate:max_size 50M && sudo -u $APP_RUNTIME_USER env HOME=$APP_RUNTIME_HOME PM2_HOME=$APP_RUNTIME_HOME/.pm2 pm2 set pm2-logrotate:retain 7"

# --- 8. Restart PM2 ---
echo "[8/8] Redémarrage des services PM2..."
ssh "$SSH_TARGET" "for app in eaf-nextjs-blue eaf-nextjs-green eaf-mcp eaf-worker; do pm2 delete \"\$app\" 2>/dev/null || true; done"
ssh "$SSH_TARGET" "sudo -u $APP_RUNTIME_USER env HOME=$APP_RUNTIME_HOME PM2_HOME=$APP_RUNTIME_HOME/.pm2 pm2 delete eaf-nextjs-blue eaf-nextjs-green eaf-mcp eaf-worker 2>/dev/null || true"
ssh "$SSH_TARGET" "fuser -k 3100/tcp 2>/dev/null || true; sleep 2"
ssh "$SSH_TARGET" "sudo -u $APP_RUNTIME_USER env HOME=$APP_RUNTIME_HOME PM2_HOME=$APP_RUNTIME_HOME/.pm2 pm2 startOrRestart /opt/eaf/ecosystem.config.cjs --env production --update-env"
ssh "$SSH_TARGET" "sudo -u $APP_RUNTIME_USER env HOME=$APP_RUNTIME_HOME PM2_HOME=$APP_RUNTIME_HOME/.pm2 pm2 save"

# --- 9. Smoke test post-deploy ---
echo "[9/9] Smoke test post-déploiement..."
sleep 5  # laisser PM2 démarrer proprement

HEALTH_URL="https://$DOMAIN/api/v1/health"
echo "  → GET $HEALTH_URL"

HEALTH_STATUS=$(curl -s --max-time 15 "$HEALTH_URL" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','unknown'))" 2>/dev/null || echo "unreachable")

if [ "$HEALTH_STATUS" = "ok" ]; then
  echo "  ✅ Health check OK (status: ok)"
elif [ "$HEALTH_STATUS" = "degraded" ]; then
  echo "  ⚠️  Health check DEGRADED — vérifier RAG ou voice"
  echo "     curl -s $HEALTH_URL | jq ."
else
  echo ""
  echo "  ❌ SMOKE TEST ÉCHOUÉ — statut reçu: $HEALTH_STATUS"
  echo "     Vérifiez les logs : ssh $SSH_TARGET 'pm2 logs --lines 50'"
  echo ""
  exit 1
fi

echo "  → Legacy file stores on active path"
ssh "$SSH_TARGET" "cd $APP_DIR && ls .data/*.json 2>/dev/null || echo 'none'"

echo ""
echo "========================================="
echo "  ✅ Déploiement terminé !"
echo "========================================="
echo ""
echo "  🌐 https://$DOMAIN"
echo ""
echo "  Vérifications :"
echo "    curl -s https://$DOMAIN/api/v1/health"
echo "    ssh $SSH_TARGET 'sudo -u $APP_RUNTIME_USER env HOME=$APP_RUNTIME_HOME PM2_HOME=$APP_RUNTIME_HOME/.pm2 pm2 status'"
echo "    ssh $SSH_TARGET 'sudo -u $APP_RUNTIME_USER env HOME=$APP_RUNTIME_HOME PM2_HOME=$APP_RUNTIME_HOME/.pm2 pm2 logs --lines 20'"
echo ""
