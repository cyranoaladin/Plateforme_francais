#!/usr/bin/env bash
set -euo pipefail

TARGET_URL="${1:-https://eaf.nexusreussite.academy}"

docker run -d --name zap \
  -p 8080:8080 \
  ghcr.io/zaproxy/zaproxy:stable \
  zap.sh -daemon -port 8080 -host 0.0.0.0

trap 'docker rm -f zap >/dev/null 2>&1 || true' EXIT

docker exec zap zap-cli active-scan \
  --scanners all \
  --recursive \
  "${TARGET_URL}/api/v1"

docker exec zap zap-cli report \
  -o /tmp/zap-report.html \
  -f html

HIGH_ALERTS=$(docker exec zap zap-cli alerts --alert-level High | wc -l | tr -d ' ')
if [ "$HIGH_ALERTS" -gt "0" ]; then
  echo "HIGH alerts detected: $HIGH_ALERTS"
  exit 1
fi

