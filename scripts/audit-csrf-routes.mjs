#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const API_ROOT = path.resolve(process.cwd(), 'src/app/api');

// Pre-authentication routes: no session cookie exists, CSRF not applicable
const EXEMPT_POST_ROUTES = new Set([
  'src/app/api/v1/auth/login/route.ts',
  'src/app/api/v1/auth/register/route.ts',
  'src/app/api/v1/auth/forgot-password/route.ts', // public, rate-limited, no session
  'src/app/api/v1/auth/reset-password/route.ts', // token-based auth, no session
  'src/app/api/v1/cron/revision-reminders/route.ts',
  'src/app/api/v1/cron/weekly-reports/route.ts',
  'src/app/api/v1/metrics/vitals/route.ts',
  'src/app/api/v1/payments/clictopay/callback/route.ts',
  'src/app/api/v1/student/descriptif/route.ts', // re-exports from recapitulatif (has validateCsrf)
]);

const MUTATIVE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
const shouldListFiles = process.argv.includes('--list-files');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(abs));
    } else if (entry.isFile() && entry.name === 'route.ts') {
      files.push(abs);
    }
  }
  return files;
}

function asRepoPath(abs) {
  return path.relative(process.cwd(), abs).replaceAll(path.sep, '/');
}

function hasMutativeHandler(content) {
  return MUTATIVE_METHODS.some((m) => (
    content.includes(`export async function ${m}`) ||
    content.includes(`export const ${m} =`) ||
    content.includes(`export const ${m}=`) ||
    new RegExp(`export\\s*\\{[^}]*\\b${m}\\b[^}]*\\}`).test(content)
  ));
}

function isExempt(repoPath, content) {
  const hasPost =
    content.includes('export async function POST') ||
    content.includes('export const POST =') ||
    content.includes('export const POST=') ||
    /export\s*\{[^}]*\bPOST\b[^}]*\}/.test(content);
  if (!hasPost) {
    return false;
  }
  return EXEMPT_POST_ROUTES.has(repoPath);
}

const CRON_ROUTES = new Set([
  'src/app/api/v1/cron/revision-reminders/route.ts',
  'src/app/api/v1/cron/weekly-reports/route.ts',
]);

const violations = [];
const routeFiles = walk(API_ROOT);

if (shouldListFiles) {
  const sorted = routeFiles.map(asRepoPath).sort();
  for (const file of sorted) {
    console.log(file);
  }
  process.exit(0);
}

for (const abs of routeFiles) {
  const repoPath = asRepoPath(abs);
  const content = fs.readFileSync(abs, 'utf8');
  if (!hasMutativeHandler(content)) {
    continue;
  }

  // Cron routes: must use CRON_SECRET, not CSRF
  if (CRON_ROUTES.has(repoPath)) {
    if (!content.includes('validateCronSecret') && !content.includes('CRON_SECRET')) {
      violations.push(`${repoPath} [CRON SANS AUTH]`);
    }
    continue;
  }

  if (isExempt(repoPath, content)) {
    continue;
  }
  if (!content.includes('validateCsrf')) {
    violations.push(repoPath);
  }
}

if (violations.length > 0) {
  console.error('CSRF audit failed. Missing validateCsrf on mutative routes:');
  for (const file of violations) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log(`CSRF audit passed (${routeFiles.length} route files scanned).`);
