#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:3000}"
SPEC_FORBIDDEN="/work/openapi.teacher.forbidden.yaml"
SPEC_ALLOWED="/work/openapi.teacher.allowed.yaml"

node tests/contracts/bootstrap-roles.mjs

tmp_headers_student="$(mktemp)"
tmp_headers_teacher="$(mktemp)"
trap 'rm -f "$tmp_headers_student" "$tmp_headers_teacher"' EXIT

# Student bootstrap via register
STUDENT_EMAIL="student.contract.$(date +%s).$RANDOM@eaf.local"
curl -sS -D "$tmp_headers_student" -o /dev/null \
  -X POST "${BASE_URL}/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  --data "{\"email\":\"${STUDENT_EMAIL}\",\"password\":\"contract1234\",\"displayName\":\"Student Contract\"}"

STUDENT_SESSION="$(grep -i '^set-cookie: eaf_session=' "$tmp_headers_student" | head -n1 | sed -E 's/^set-cookie: eaf_session=([^;]+).*/\1/i')"
STUDENT_CSRF="$(grep -i '^set-cookie: eaf_csrf=' "$tmp_headers_student" | head -n1 | sed -E 's/^set-cookie: eaf_csrf=([^;]+).*/\1/i')"

if [ -z "${STUDENT_SESSION}" ] || [ -z "${STUDENT_CSRF}" ]; then
  echo "Unable to bootstrap student cookies"
  exit 1
fi

# Teacher login
curl -sS -D "$tmp_headers_teacher" -o /dev/null \
  -X POST "${BASE_URL}/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  --data '{"email":"teacher.contract@eaf.local","password":"contract1234"}'

TEACHER_SESSION="$(grep -i '^set-cookie: eaf_session=' "$tmp_headers_teacher" | head -n1 | sed -E 's/^set-cookie: eaf_session=([^;]+).*/\1/i')"
TEACHER_CSRF="$(grep -i '^set-cookie: eaf_csrf=' "$tmp_headers_teacher" | head -n1 | sed -E 's/^set-cookie: eaf_csrf=([^;]+).*/\1/i')"

if [ -z "${TEACHER_SESSION}" ] || [ -z "${TEACHER_CSRF}" ]; then
  echo "Unable to bootstrap teacher cookies"
  exit 1
fi

# Forbidden contracts with student role
docker run --rm \
  --network host \
  -v "$(pwd)/tests/contracts:/work" \
  schemathesis/schemathesis:stable \
  run "$SPEC_FORBIDDEN" \
  --url "$BASE_URL" \
  --header "Cookie: eaf_session=${STUDENT_SESSION}; eaf_csrf=${STUDENT_CSRF}" \
  --header "X-CSRF-Token: ${STUDENT_CSRF}" \
  --checks all \
  --stateful=none \
  --max-examples=20

# Allowed contracts with teacher role
docker run --rm \
  --network host \
  -v "$(pwd)/tests/contracts:/work" \
  schemathesis/schemathesis:stable \
  run "$SPEC_ALLOWED" \
  --url "$BASE_URL" \
  --header "Cookie: eaf_session=${TEACHER_SESSION}; eaf_csrf=${TEACHER_CSRF}" \
  --header "X-CSRF-Token: ${TEACHER_CSRF}" \
  --checks all \
  --stateful=none \
  --max-examples=20

