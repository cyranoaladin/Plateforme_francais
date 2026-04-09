#!/usr/bin/env bash
###############################################################################
# TESTS D'INTÉGRATION PRODUCTION — avec sessions authentifiées réelles
# Usage: bash scripts/integration-test-production.sh [HOST] [EMAIL] [PASSWORD]
###############################################################################

set -euo pipefail
HOST="${1:-http://localhost:3000}"
TEST_EMAIL="${2:-}"
TEST_PASSWORD="${3:-}"
PASS=0; FAIL=0
ELEVE_COOKIE=""

green() { printf '\033[32m✓\033[0m %s\n' "$1"; PASS=$((PASS+1)); }
red()   { printf '\033[31m✗\033[0m %s [%s]\n' "$1" "$2"; FAIL=$((FAIL+1)); }

check_api() {
  local desc="$1" method="$2" url="$3" expected_status="$4" data="${5:-}"
  local actual
  if [ -n "$data" ]; then
    actual=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" \
      -H "Content-Type: application/json" \
      -H "Cookie: $ELEVE_COOKIE" \
      --max-time 20 \
      -d "$data" \
      "$HOST$url" 2>/dev/null || echo "000")
  else
    actual=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" \
      -H "Cookie: $ELEVE_COOKIE" \
      --max-time 20 \
      "$HOST$url" 2>/dev/null || echo "000")
  fi
  if echo "$expected_status" | grep -qw "$actual"; then
    green "$desc (HTTP $actual)"
  else
    red "$desc" "attendu $expected_status, obtenu $actual"
  fi
}

if [ -z "$TEST_EMAIL" ] || [ -z "$TEST_PASSWORD" ]; then
  echo "Usage: $0 [HOST] EMAIL PASSWORD"
  echo "  Fournissez un email et mot de passe d'un compte élève existant."
  echo "  Exemple: $0 http://localhost:3000 eleve@test.local MonMotDePasse123!"
  exit 1
fi

echo "═══════════════════════════════════════════════════════"
echo "TESTS D'INTÉGRATION PRODUCTION — $HOST"
echo "═══════════════════════════════════════════════════════"
echo ""

# ─── Login ─────────────────────────────────────────────────────────────────
echo "── Authentification ────────────────────────────────────"
LOGIN_RESPONSE=$(curl -si -X POST "$HOST/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" \
  --max-time 10 2>/dev/null)

# Capture all three cookies (eaf_csrf, eaf_session, eaf_role) and join them
ELEVE_COOKIE=$(echo "$LOGIN_RESPONSE" | grep -i "set-cookie:" | \
  sed 's/[Ss]et-[Cc]ookie: \([^;]*\).*/\1/' | paste -sd '; ' - || echo "")

# Verify eaf_session is present (required by middleware)
SESSION_CHECK=$(echo "$LOGIN_RESPONSE" | grep -i "set-cookie:.*eaf_session" | head -1)

if [ -n "$SESSION_CHECK" ]; then
  green "Login élève réussi"
else
  red "Login élève" "cookie eaf_session absent — vérifiez les identifiants"
  echo "Abort: impossible de tester sans session"
  exit 1
fi

# ─── Profil et mémoire ─────────────────────────────────────────────────────
echo ""
echo "── Profil et mémoire ───────────────────────────────────"
check_api "GET /auth/me"              GET  "/api/v1/auth/me"              "200"
check_api "GET /student/profile"      GET  "/api/v1/student/profile"      "200"
check_api "GET /student/recapitulatif" GET "/api/v1/student/recapitulatif" "200"

# ─── Billing ───────────────────────────────────────────────────────────────
echo ""
echo "── Billing et quotas ───────────────────────────────────"
check_api "GET /billing/status"       GET  "/api/v1/billing/status"                      "200"
check_api "GET /billing/check-quota QUIZ" GET "/api/v1/billing/check-quota?feature=QUIZ_PER_DAY" "200"

# ─── Ressources ────────────────────────────────────────────────────────────
echo ""
echo "── Ressources et bibliothèque ──────────────────────────"
check_api "GET /ressources"           GET  "/api/v1/ressources"           "200"

# ─── Oral ──────────────────────────────────────────────────────────────────
echo ""
echo "── Atelier Oral ────────────────────────────────────────"
check_api "GET /oral/capabilities"    GET  "/api/v1/oral/capabilities"    "200"

# ─── Quiz ──────────────────────────────────────────────────────────────────
echo ""
echo "── Quiz adaptatif ──────────────────────────────────────"
check_api "POST /quiz/generate"       POST "/api/v1/quiz/generate" "200 201 400 429" \
  '{"theme":"grammaire","niveau":"premiere"}'

# ─── Carnet de lecture ─────────────────────────────────────────────────────
echo ""
echo "── Carnet de lecture ───────────────────────────────────"
check_api "GET /carnet"               GET  "/api/v1/carnet"               "200"

# ─── Badges et gamification ────────────────────────────────────────────────
echo ""
echo "── Gamification ────────────────────────────────────────"
check_api "GET /badges/list"          GET  "/api/v1/badges/list"          "200"

# ─── Descriptif de lecture ─────────────────────────────────────────────────
echo ""
echo "── Descriptif de lecture ─────────────────────────────────"
check_api "GET /student/descriptif"   GET  "/api/v1/student/descriptif"   "200"
check_api "GET /student/descriptif-lecture" GET "/api/v1/student/descriptif-lecture" "200"

# ─── Exam info ─────────────────────────────────────────────────────────────
echo ""
echo "── Infos examen ────────────────────────────────────────"
check_api "GET /exam-info"            GET  "/api/v1/exam-info"            "200"

# ─── MCP ───────────────────────────────────────────────────────────────────
echo ""
echo "── MCP Server ──────────────────────────────────────────"
check_api "GET /api/mcp/health"       GET  "/api/mcp/health"             "200"

# ─── Cron routes (sans secret → 401/403) ─────────────────────────────────
echo ""
echo "── Cron routes ─────────────────────────────────────────"
check_api "GET /cron/session-cleanup (sans secret → 401/403)" \
  GET "/api/v1/cron/session-cleanup" "401 403 405"

# ─── Résumé ────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════"
printf "RÉSUMÉ : PASS=%d | FAIL=%d\n" "$PASS" "$FAIL"
if [ "$FAIL" -eq 0 ]; then
  printf '\033[32m✅ Tous les tests d'\''intégration passent\033[0m\n'
  exit 0
else
  printf '\033[31m❌ %d test(s) échoué(s)\033[0m\n' "$FAIL"
  exit 1
fi
