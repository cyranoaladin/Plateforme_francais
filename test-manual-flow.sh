#!/bin/bash
set -x
API_BASE="http://localhost:3000/api/v1"
COOKIE_JAR="/tmp/cookies.txt"

# Clean up
rm -f "$COOKIE_JAR"

echo "=== 1. Admin Login ==="
ADMIN_RESP=$(curl -s -c "$COOKIE_JAR" -X POST "${API_BASE}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@eaf.local","password":"AdminTest2026!"}')
echo "Login: $ADMIN_RESP"

echo "=== 2. Get CSRF Token ==="
CSRF=$(curl -s -b "$COOKIE_JAR" "${API_BASE}/csrf" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "CSRF: $CSRF"

echo "=== 3. Generate PREMIUM Code ==="
CODE_RESP=$(curl -s -b "$COOKIE_JAR" -X POST "${API_BASE}/admin/activation-codes" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $CSRF" \
  -d '{"plan":"PREMIUM","durationDays":30}')
echo "Code response: $CODE_RESP"

# Extract code
GENERATED_CODE=$(echo "$CODE_RESP" | grep -o '"plainCode":"[^"]*"' | cut -d'"' -f4)
echo "Generated code: $GENERATED_CODE"

echo "=== 4. Logout Admin ==="
curl -s -b "$COOKIE_JAR" -X POST "${API_BASE}/auth/logout" > /dev/null 2>&1 || true
rm -f "$COOKIE_JAR"

echo "=== 5. Student (FREE) Login ==="
STUDENT_RESP=$(curl -s -c "$COOKIE_JAR" -X POST "${API_BASE}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"eleve.free@eaf.local","password":"FreeTest2026!"}')
echo "Student login: $STUDENT_RESP"

echo "=== 6. Get Student CSRF ==="
STUDENT_CSRF=$(curl -s -b "$COOKIE_JAR" "${API_BASE}/csrf" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
echo "Student CSRF: $STUDENT_CSRF"

echo "=== 7. Check Current Plan ==="
curl -s -b "$COOKIE_JAR" "${API_BASE}/auth/me" | grep -o '"plan":"[^"]*"'

echo "=== 8. Redeem Code ==="
REDEEM_RESP=$(curl -s -b "$COOKIE_JAR" -X POST "${API_BASE}/billing/redeem-code" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $STUDENT_CSRF" \
  -d "{\"code\":\"$GENERATED_CODE\"}")
echo "Redeem response: $REDEEM_RESP"

echo "=== 9. Verify Upgraded Plan ==="
curl -s -b "$COOKIE_JAR" "${API_BASE}/auth/me" | grep -o '"plan":"[^"]*"'

echo "=== 10. Cleanup ==="
rm -f "$COOKIE_JAR"

echo "=== TEST COMPLETE ==="
