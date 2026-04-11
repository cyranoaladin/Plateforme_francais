#!/usr/bin/env bash
###############################################################################
# SMOKE TEST PRODUCTION — NEXUS RÉUSSITE EAF
# Usage: bash scripts/smoke-test-production.sh [HOST]
# HOST par défaut : http://localhost:3000
###############################################################################

set -euo pipefail
HOST="${1:-http://localhost:3000}"
PASS=0
FAIL=0
WARNINGS=0

green() { printf '\033[32m✓\033[0m %s\n' "$1"; PASS=$((PASS+1)); }
red()   { printf '\033[31m✗\033[0m %s\n' "$1"; FAIL=$((FAIL+1)); }
warn()  { printf '\033[33m⚠\033[0m %s\n' "$1"; WARNINGS=$((WARNINGS+1)); }

check_http() {
  local desc="$1" url="$2" expected="${3:-200}"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")
  if echo "$expected" | grep -qw "$code"; then
    green "$desc (HTTP $code)"
  else
    red "$desc (attendu $expected, obtenu $code)"
  fi
}

check_json() {
  local desc="$1" url="$2" jq_expr="$3" expected="$4"
  local value
  value=$(curl -s --max-time 10 "$url" | python3 -c "
import json,sys
try:
  d = json.load(sys.stdin)
  keys = '$jq_expr'.strip('.').split('.')
  v = d
  for k in keys:
    if k: v = v[k]
  print(str(v))
except Exception as e:
  print('ERROR:' + str(e))
" 2>/dev/null || echo "ERROR")
  if [ "$value" = "$expected" ]; then
    green "$desc ($value)"
  else
    red "$desc (attendu '$expected', obtenu '$value')"
  fi
}

echo "═══════════════════════════════════════════════════════"
echo "SMOKE TEST PRODUCTION — $HOST"
echo "═══════════════════════════════════════════════════════"
echo ""

# ─── Infrastructure ────────────────────────────────────────────────────────
echo "── Infrastructure ──────────────────────────────────────"
check_json "Health status=ok"       "$HOST/api/v1/health"   ".status" "ok"
check_json "MCP status=healthy"     "$HOST/api/mcp/health"  ".status" "healthy"
check_json "RAG status=ok"          "$HOST/api/v1/rag/health" ".status" "ok"

# ─── Pages publiques ───────────────────────────────────────────────────────
echo ""
echo "── Pages publiques ─────────────────────────────────────"
check_http "Landing page /"              "$HOST/"
check_http "CGU"                         "$HOST/cgu"
check_http "CGV"                         "$HOST/cgv"
check_http "Mentions légales"            "$HOST/mentions-legales"
check_http "Politique confidentialité"   "$HOST/politique-de-confidentialite"
check_http "Sitemap"                     "$HOST/sitemap.xml"
check_http "Robots.txt"                  "$HOST/robots.txt"

# ─── Authentification ──────────────────────────────────────────────────────
echo ""
echo "── Authentification ────────────────────────────────────"
check_http "Login page"        "$HOST/login"
check_http "/auth/me → 401"    "$HOST/api/v1/auth/me"   "401"

# ─── API protégées (sans auth → 401) ──────────────────────────────────────
echo ""
echo "── API protégées (sans auth) ───────────────────────────"
check_http "Student profile → 401"     "$HOST/api/v1/student/profile"    "401"
check_http "Billing status → 401"      "$HOST/api/v1/billing/status"     "401"
check_http "Ressources → 401"          "$HOST/api/v1/ressources"         "401"
check_http "Admin users → 401/403"     "$HOST/api/v1/admin/users"        "401 403"

# ─── Ressources physiques ──────────────────────────────────────────────────
echo ""
echo "── Ressources physiques ────────────────────────────────"
RESSOURCES_DIR="/srv/eaf_ressources"
if [ -d "$RESSOURCES_DIR" ]; then
  RESSOURCES_COUNT=$(find -L "$RESSOURCES_DIR" -type f 2>/dev/null | wc -l || echo "0")
  if [ "$RESSOURCES_COUNT" -ge 100 ]; then
    green "Volume ressources : $RESSOURCES_COUNT fichiers (≥ 100)"
  else
    red "Volume ressources : $RESSOURCES_COUNT fichiers (attendu ≥ 100)"
  fi
else
  warn "Répertoire ressources $RESSOURCES_DIR absent (test local ?)"
fi

APP_DIR="/opt/eaf_platform"
if [ -d "$APP_DIR/.data/uploads" ]; then
  UPLOADS_COUNT=$(find "$APP_DIR/.data/uploads" -type f 2>/dev/null | wc -l || echo "0")
  green "Uploads racine : $UPLOADS_COUNT fichiers"
else
  warn "Répertoire uploads absent (test local ?)"
fi

# ─── JSON stores (doivent être absents en prod) ─────────────────────────
echo ""
echo "── File stores (doivent être absents) ──────────────────"
if [ -d "$APP_DIR/.data" ]; then
  if ls "$APP_DIR/.data/"*.json 2>/dev/null | head -1 > /dev/null 2>&1; then
    red "Fichiers JSON actifs en .data/ — doivent être absents"
  else
    green "Aucun fichier JSON actif en .data/"
  fi
else
  green "Pas de répertoire .data (test local)"
fi

# ─── PM2 ───────────────────────────────────────────────────────────────────
echo ""
echo "── PM2 ─────────────────────────────────────────────────"
if command -v pm2 &>/dev/null; then
  pm2 jlist 2>/dev/null \
  | python3 -c "
import json, sys
try:
  procs = json.load(sys.stdin)
  # eaf-nextjs-blue is required; eaf-mcp and eaf-worker are optional
  required = ['eaf-nextjs-blue']
  optional = ['eaf-mcp', 'eaf-worker']
  for name in required:
    proc = next((p for p in procs if p.get('name') == name), None)
    if proc and proc.get('pm2_env', {}).get('status') == 'online':
      print(f'  ✓ {name}: online')
    else:
      print(f'  ✗ {name}: OFFLINE ou absent')
  for name in optional:
    proc = next((p for p in procs if p.get('name') == name), None)
    if proc and proc.get('pm2_env', {}).get('status') == 'online':
      print(f'  ✓ {name}: online')
    else:
      print(f'  ⚠ {name}: absent (optionnel)')
except:
  print('  ⚠ Impossible de lire PM2 jlist')
" 2>/dev/null || warn "PM2 non accessible"
else
  warn "PM2 non installé (test local ?)"
fi

# ─── Crons ─────────────────────────────────────────────────────────────────
echo ""
echo "── Crons ───────────────────────────────────────────────"
if [ -f /etc/cron.d/nexus-backup ]; then
  if grep -q backup /etc/cron.d/nexus-backup 2>/dev/null; then
    green "Cron backup uploads configuré"
  else
    warn "Cron backup présent mais contenu inattendu"
  fi
else
  warn "Cron backup uploads absent (/etc/cron.d/nexus-backup)"
fi

# ─── Base de données ───────────────────────────────────────────────────────
echo ""
echo "── Base de données ─────────────────────────────────────"
if command -v node &>/dev/null && [ -d "$APP_DIR/node_modules/@prisma/client" ] 2>/dev/null; then
  cd "$APP_DIR" 2>/dev/null && node -e "
const {PrismaClient}=require('@prisma/client');
const p=new PrismaClient();
(async()=>{
  try {
    const [users,events,sessions] = await Promise.all([
      p.user.count(),
      p.memoryEvent.count(),
      p.session.count(),
    ]);
    console.log('  users:', users);
    console.log('  memory_events:', events);
    console.log('  sessions:', sessions);
  } catch(e) { console.log('  ⚠ DB query failed:', e.message); }
  await p.\$disconnect();
})();
" 2>/dev/null || warn "Impossible de requêter la DB"
else
  warn "Node/Prisma non disponible pour le check DB"
fi

# ─── Build info ────────────────────────────────────────────────────────────
echo ""
echo "── Build info ──────────────────────────────────────────"
HEALTH_JSON=$(curl -s --max-time 10 "$HOST/api/v1/health" 2>/dev/null || echo "{}")
SHA=$(echo "$HEALTH_JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('release',{}).get('gitSha','unknown'))" 2>/dev/null || echo "unknown")
BUILD_TIME=$(echo "$HEALTH_JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('release',{}).get('buildTime','unknown'))" 2>/dev/null || echo "unknown")
green "SHA servi : $SHA"
green "Build time : $BUILD_TIME"

# ─── Résumé ────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════"
echo "RÉSUMÉ : PASS=$PASS | FAIL=$FAIL | WARN=$WARNINGS"
if [ "$FAIL" -eq 0 ]; then
  printf '\033[32m✅ Tous les checks passent — Production opérationnelle\033[0m\n'
  exit 0
else
  printf '\033[31m❌ %d check(s) échoué(s) — Corrections requises\033[0m\n' "$FAIL"
  exit 1
fi
