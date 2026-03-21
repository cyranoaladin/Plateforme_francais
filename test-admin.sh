#!/bin/bash
set -x
API_BASE="http://localhost:3000/api/v1"
COOKIE_JAR="/tmp/cookies.txt"

# Clean up
rm -f "$COOKIE_JAR"

echo "=== 1. Admin Login ==="
curl -s -c "$COOKIE_JAR" -X POST "${API_BASE}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@eaf.local","password":"AdminTest2026!"}'
echo ""

echo "=== 2. Get CSRF Token ==="
CSRF=$(curl -s -b "$COOKIE_JAR" "${API_BASE}/csrf" | grep -o '"csrfToken":"[^"]*"' | cut -d'"' -f4)
echo "CSRF: $CSRF"

echo "=== 3. Generate PREMIUM Code ==="
curl -s -b "$COOKIE_JAR" -X POST "${API_BASE}/admin/activation-codes" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF" \
  -d '{"plan":"PREMIUM","durationDays":30}'
echo ""
