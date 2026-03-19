#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:3000}"
SPEC_PATH="/work/openapi.auth.yaml"
EMAIL="contract.$(date +%s).$RANDOM@eaf.local"
PASSWORD="contract1234"
TMP_HEADERS="$(mktemp)"
trap 'rm -f "$TMP_HEADERS"' EXIT

curl -sS -D "$TMP_HEADERS" -o /dev/null \
  -X POST "${BASE_URL}/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  --data "{\"email\":\"${EMAIL}\",\"password\":\"${PASSWORD}\",\"displayName\":\"Contract User\"}"

SESSION_COOKIE="$(grep -i '^set-cookie: eaf_session=' "$TMP_HEADERS" | head -n1 | sed -E 's/^set-cookie: eaf_session=([^;]+).*/\1/i')"
CSRF_COOKIE="$(grep -i '^set-cookie: eaf_csrf=' "$TMP_HEADERS" | head -n1 | sed -E 's/^set-cookie: eaf_csrf=([^;]+).*/\1/i')"

if [ -z "${SESSION_COOKIE}" ] || [ -z "${CSRF_COOKIE}" ]; then
  echo "Failed to bootstrap auth cookies for contract tests"
  exit 1
fi

docker run --rm \
  --network host \
  -v "$(pwd)/tests/contracts:/work" \
  schemathesis/schemathesis:stable \
  run "$SPEC_PATH" \
  --url "$BASE_URL" \
  --mode=positive \
  --generation-allow-x00 false \
  --phases fuzzing \
  --header "Cookie: eaf_session=${SESSION_COOKIE}; eaf_csrf=${CSRF_COOKIE}" \
  --header "X-CSRF-Token: ${CSRF_COOKIE}" \
  --checks all \
  --exclude-checks unsupported_method \
  --stateful=none \
  --max-examples=30

