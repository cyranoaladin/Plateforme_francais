#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:3000}"

node tests/contracts/bootstrap-roles.mjs >/dev/null

# Prepare teacher class data + one student with CSV injection payload in display name
node <<'EOF'
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const teacher = await prisma.user.findUnique({
    where: { email: 'teacher.contract@eaf.local' },
  });
  if (!teacher) throw new Error('teacher.contract@eaf.local not found');

  await prisma.studentProfile.upsert({
    where: { userId: teacher.id },
    update: { classCode: 'CLSCSV' },
    create: {
      userId: teacher.id,
      displayName: 'Teacher Contract',
      classLevel: 'Première générale',
      targetScore: '14/20',
      onboardingCompleted: true,
      selectedOeuvres: [],
      classCode: 'CLSCSV',
      parcoursProgress: [],
      badges: [],
      preferredObjects: [],
      weakSkills: [],
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'csv.inject.student@eaf.local' },
    update: {},
    create: {
      email: 'csv.inject.student@eaf.local',
      role: 'eleve',
      passwordHash: 'x',
      passwordSalt: 'x',
      profile: {
        create: {
          displayName: '=CMD(1+1)',
          classLevel: 'Première générale',
          targetScore: '10/20',
          onboardingCompleted: true,
          selectedOeuvres: [],
          classCode: 'CLSCSV',
          parcoursProgress: [],
          badges: [],
          preferredObjects: [],
          weakSkills: [],
        },
      },
    },
    include: { profile: true },
  });

  if (student.profile?.classCode !== 'CLSCSV') {
    await prisma.studentProfile.update({
      where: { userId: student.id },
      data: { classCode: 'CLSCSV', displayName: '=CMD(1+1)' },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
EOF

tmp_headers_student="$(mktemp)"
tmp_headers_teacher="$(mktemp)"
tmp_headers_admin="$(mktemp)"
trap 'rm -f "$tmp_headers_student" "$tmp_headers_teacher" "$tmp_headers_admin"' EXIT

# Student bootstrap via register
STUDENT_EMAIL="student.export.$(date +%s).$RANDOM@eaf.local"
curl -sS -D "$tmp_headers_student" -o /dev/null \
  -X POST "${BASE_URL}/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  --data "{\"email\":\"${STUDENT_EMAIL}\",\"password\":\"contract1234\",\"displayName\":\"Student Export\"}"

STUDENT_SESSION="$(grep -i '^set-cookie: eaf_session=' "$tmp_headers_student" | head -n1 | sed -E 's/^set-cookie: eaf_session=([^;]+).*/\1/i')"
if [ -z "${STUDENT_SESSION}" ]; then
  echo "Unable to bootstrap student session"
  exit 1
fi

# Teacher login
curl -sS -D "$tmp_headers_teacher" -o /dev/null \
  -X POST "${BASE_URL}/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  --data '{"email":"teacher.contract@eaf.local","password":"contract1234"}'

TEACHER_SESSION="$(grep -i '^set-cookie: eaf_session=' "$tmp_headers_teacher" | head -n1 | sed -E 's/^set-cookie: eaf_session=([^;]+).*/\1/i')"
if [ -z "${TEACHER_SESSION}" ]; then
  echo "Unable to bootstrap teacher session"
  exit 1
fi

# Admin login
curl -sS -D "$tmp_headers_admin" -o /dev/null \
  -X POST "${BASE_URL}/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  --data '{"email":"admin.contract@eaf.local","password":"contract1234"}'

ADMIN_SESSION="$(grep -i '^set-cookie: eaf_session=' "$tmp_headers_admin" | head -n1 | sed -E 's/^set-cookie: eaf_session=([^;]+).*/\1/i')"
if [ -z "${ADMIN_SESSION}" ]; then
  echo "Unable to bootstrap admin session"
  exit 1
fi

# 1) Student must be forbidden
STATUS_STUDENT="$(curl -sS -o /tmp/export_student.json -w "%{http_code}" \
  -X GET "${BASE_URL}/api/v1/enseignant/export" \
  -H "Cookie: eaf_session=${STUDENT_SESSION}")"
if [ "$STATUS_STUDENT" != "403" ]; then
  echo "Expected 403 for student export, got ${STATUS_STUDENT}"
  exit 1
fi

# 2) Teacher must get CSV
STATUS_TEACHER="$(curl -sS -D /tmp/export_teacher.headers -o /tmp/export_teacher.csv -w "%{http_code}" \
  -X GET "${BASE_URL}/api/v1/enseignant/export" \
  -H "Cookie: eaf_session=${TEACHER_SESSION}")"
if [ "$STATUS_TEACHER" != "200" ]; then
  echo "Expected 200 for teacher export, got ${STATUS_TEACHER}"
  exit 1
fi
if ! grep -qi '^content-type: text/csv' /tmp/export_teacher.headers; then
  echo "Teacher export response is not CSV"
  exit 1
fi
if ! head -n1 /tmp/export_teacher.csv | grep -q '^student_name,email,average_score,last_activity'; then
  echo "Teacher CSV header invalid"
  exit 1
fi
# CSV injection must be neutralized: value starting with '=' is prefixed by apostrophe
if ! grep -q "'=CMD(1+1)" /tmp/export_teacher.csv; then
  echo "CSV injection payload was not neutralized in teacher export"
  exit 1
fi

# 3) Admin must also get CSV (requireUserRole allows admin)
STATUS_ADMIN="$(curl -sS -D /tmp/export_admin.headers -o /tmp/export_admin.csv -w "%{http_code}" \
  -X GET "${BASE_URL}/api/v1/enseignant/export" \
  -H "Cookie: eaf_session=${ADMIN_SESSION}")"
if [ "$STATUS_ADMIN" != "200" ]; then
  echo "Expected 200 for admin export, got ${STATUS_ADMIN}"
  exit 1
fi
if ! grep -qi '^content-type: text/csv' /tmp/export_admin.headers; then
  echo "Admin export response is not CSV"
  exit 1
fi
if ! head -n1 /tmp/export_admin.csv | grep -q '^student_name,email,average_score,last_activity'; then
  echo "Admin CSV header invalid"
  exit 1
fi
if ! grep -q "'=CMD(1+1)" /tmp/export_admin.csv; then
  echo "CSV injection payload was not neutralized in admin export"
  exit 1
fi

echo "Teacher export RBAC assertions passed (student=403, teacher=200 CSV, admin=200 CSV)."
