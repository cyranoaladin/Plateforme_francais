#!/usr/bin/env node
/**
 * CI config sanity check (P0-8).
 * Verifies all required environment variables are present.
 * Usage: npm run ci:config-sanity
 */

const REQUIRED_VARS = [
  'DATABASE_URL',
  'DIRECT_URL',
  'REDIS_URL',
  'SESSION_SECRET',
  'CSRF_SECRET',
  'NEXT_PUBLIC_APP_URL',
  'NODE_ENV',
  'LLM_ROUTER_ENABLED',
  'LLM_TIER_1_PROVIDER',
  'LLM_TIER_2_PROVIDER',
  'LLM_TIER_3_PROVIDER',
  'MCP_SERVER_URL',
  'MCP_API_KEY',
  'MCP_TRANSPORT',
  'CRON_SECRET',
  'OLLAMA_BASE_URL',
];

const missing = REQUIRED_VARS.filter((v) => !process.env[v]);

if (missing.length > 0) {
  console.error('❌ Config sanity check FAILED — missing environment variables:');
  missing.forEach((v) => console.error(`   - ${v}`));
  process.exit(1);
}

console.log(`✅ Config sanity check passed — ${REQUIRED_VARS.length} required variables present.`);
