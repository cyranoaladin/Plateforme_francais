#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:3000}"
TMP_HEADERS="$(mktemp)"
trap 'rm -f "$TMP_HEADERS"' EXIT

SEED_JSON="$(node tests/contracts/bootstrap-teacher-copies.mjs)"
TEACHER_EMAIL="$(printf '%s' "$SEED_JSON" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(d.teacherEmail)")"
TEACHER_PASSWORD="$(printf '%s' "$SEED_JSON" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(d.teacherPassword)")"
COPIE_SAME="$(printf '%s' "$SEED_JSON" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(d.copieSameClassId)")"
COPIE_OTHER="$(printf '%s' "$SEED_JSON" | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(d.copieOtherClassId)")"

curl -sS -D "$TMP_HEADERS" -o /dev/null \
  -X POST "${BASE_URL}/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  --data "{\"email\":\"${TEACHER_EMAIL}\",\"password\":\"${TEACHER_PASSWORD}\"}"

SESSION_COOKIE="$(grep -i '^set-cookie: eaf_session=' "$TMP_HEADERS" | head -n1 | sed -E 's/^set-cookie: eaf_session=([^;]+).*/\1/i')"
CSRF_COOKIE="$(grep -i '^set-cookie: eaf_csrf=' "$TMP_HEADERS" | head -n1 | sed -E 's/^set-cookie: eaf_csrf=([^;]+).*/\1/i')"

if [ -z "${SESSION_COOKIE}" ] || [ -z "${CSRF_COOKIE}" ]; then
  echo "Failed to bootstrap teacher auth cookies"
  exit 1
fi

STATUS_ALLOWED="$(curl -sS -o /dev/null -w "%{http_code}" \
  -X POST "${BASE_URL}/api/v1/enseignant/corrections/${COPIE_SAME}/comment" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: ${CSRF_COOKIE}" \
  -H "Cookie: eaf_session=${SESSION_COOKIE}; eaf_csrf=${CSRF_COOKIE}" \
  --data '{"comment":"Commentaire enseignant autorise"}')"

if [ "$STATUS_ALLOWED" != "200" ]; then
  echo "Expected 200 on same-class copy, got ${STATUS_ALLOWED}"
  exit 1
fi

STATUS_FORBIDDEN="$(curl -sS -o /dev/null -w "%{http_code}" \
  -X POST "${BASE_URL}/api/v1/enseignant/corrections/${COPIE_OTHER}/comment" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: ${CSRF_COOKIE}" \
  -H "Cookie: eaf_session=${SESSION_COOKIE}; eaf_csrf=${CSRF_COOKIE}" \
  --data '{"comment":"Commentaire enseignant interdit"}')"

if [ "$STATUS_FORBIDDEN" != "403" ]; then
  echo "Expected 403 on out-of-class copy, got ${STATUS_FORBIDDEN}"
  exit 1
fi

echo "Teacher comment RBAC assertions passed (200 same-class, 403 out-of-class)."

