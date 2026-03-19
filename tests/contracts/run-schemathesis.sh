#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:3000}"
SPEC_PATH="/work/openapi.public.yaml"

docker run --rm \
  --network host \
  -v "$(pwd)/tests/contracts:/work" \
  schemathesis/schemathesis:stable \
  run "$SPEC_PATH" \
  --url "$BASE_URL" \
  --mode=positive \
  --generation-allow-x00 false \
  --phases fuzzing \
  --checks all \
  --exclude-checks unsupported_method \
  --max-examples=30

