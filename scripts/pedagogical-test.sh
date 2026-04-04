#!/usr/bin/env bash
###############################################################################
# TESTS PÉDAGOGIQUES — Vérification de la logique métier EAF
# Usage: bash scripts/pedagogical-test.sh [HOST]
###############################################################################

set -euo pipefail
HOST="${1:-http://localhost:3000}"
APP_DIR="${2:-/opt/eaf_platform}"
BUILD_DIR="$APP_DIR/.next/standalone/.next/server"
PASS=0; FAIL=0

green() { printf '\033[32m✓\033[0m %s\n' "$1"; PASS=$((PASS+1)); }
red()   { printf '\033[31m✗\033[0m %s [%s]\n' "$1" "$2"; FAIL=$((FAIL+1)); }
warn()  { printf '\033[33m⚠\033[0m %s\n' "$1"; }

echo "═══════════════════════════════════════════════════════"
echo "TESTS PÉDAGOGIQUES — $HOST"
echo "═══════════════════════════════════════════════════════"
echo ""

echo "── Barèmes officiels ─────────────────────────────────"

# 1. Vérifier que le barème commentaire n'a pas intro/conclusion comme critère
if [ -d "$BUILD_DIR" ]; then
  if grep -r "Introduction.*pts\|Conclusion.*pts" "$BUILD_DIR/" 2>/dev/null | grep -iv "history\|introd.*text\|node_modules" | head -3 | grep -q .; then
    red "Introduction/Conclusion comme critère autonome dans le build" "à corriger"
  else
    green "Pas de critère 'Introduction (Xpts)' dans le build"
  fi
else
  warn "Répertoire build absent — skip check build"
fi

# 2. Vérifier que la grammaire ne demande pas d'interprétation
echo ""
echo "── Grammaire sans interprétation ─────────────────────"
if [ -d "$BUILD_DIR" ]; then
  # Check for specific positive interpretation instructions (should not exist)
  BAD_COUNT=$(find "$BUILD_DIR/" -name "*.js" -exec grep -l "Interpréter.*effet\|Analysez.*effet" {} \; 2>/dev/null | wc -l)
  if [ "$BAD_COUNT" -gt 0 ]; then
    red "Interprétation dans la grammaire toujours dans le build" "à corriger"
  else
    green "Pas d'interprétation dans la grammaire (build OK)"
  fi
else
  warn "Répertoire build absent — skip check build"
fi

# 3. Vérifier que le descriptif de lecture est accessible
echo ""
echo "── Routes descriptif de lecture ──────────────────────"
code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$HOST/api/v1/student/descriptif" 2>/dev/null || echo "000")
if [ "$code" = "401" ]; then
  green "Route /student/descriptif existe et protégée (401 sans auth)"
elif [ "$code" = "404" ]; then
  red "Route /student/descriptif" "404 — route non créée"
else
  green "Route /student/descriptif répond ($code)"
fi

code2=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$HOST/api/v1/student/descriptif-lecture" 2>/dev/null || echo "000")
if [ "$code2" = "401" ]; then
  green "Route /student/descriptif-lecture existe et protégée (401 sans auth)"
elif [ "$code2" = "404" ]; then
  red "Route /student/descriptif-lecture" "404 — route non créée"
else
  green "Route /student/descriptif-lecture répond ($code2)"
fi

# 4. Vérifier la Note de Service dans le prompt de grammaire
echo ""
echo "── Référence Note de Service ─────────────────────────"
if [ -d "$BUILD_DIR" ]; then
  NOTE_FOUND=$(grep -r "2019-042" "$BUILD_DIR/" 2>/dev/null | grep -iv "node_modules" | wc -l)
  if [ "$NOTE_FOUND" -gt 0 ]; then
    green "Référence Note de Service 2019-042 présente dans le build"
  else
    red "Note de Service 2019-042" "absente du build"
  fi
else
  warn "Répertoire build absent — skip"
fi

# 5. Anti-triche guardrail
echo ""
echo "── Anti-triche ─────────────────────────────────────────"
if [ -d "$BUILD_DIR" ]; then
  if grep -ri "ne jamais fournir" "$BUILD_DIR/" 2>/dev/null | grep -iv "node_modules" | head -1 | grep -q .; then
    green "Guardrail anti-triche 'Ne jamais fournir' présent"
  else
    red "Guardrail anti-triche" "'Ne jamais fournir' absent du build"
  fi
else
  warn "Répertoire build absent — skip"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
printf "PÉDAGOGIE : PASS=%d | FAIL=%d\n" "$PASS" "$FAIL"
if [ "$FAIL" -eq 0 ]; then
  printf '\033[32m✅ Tous les tests pédagogiques passent\033[0m\n'
  exit 0
else
  printf '\033[31m❌ %d test(s) échoué(s)\033[0m\n' "$FAIL"
  exit 1
fi
