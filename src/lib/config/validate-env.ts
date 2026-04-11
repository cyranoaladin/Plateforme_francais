/**
 * Environment variable validation — run at app startup.
 *
 * - REQUIRED_ENV: missing any → throws (app cannot function).
 * - REQUIRED_LLM: at least one LLM key must be set → throws otherwise.
 * - RECOMMENDED_ENV: missing → warns via logger but does not crash.
 */

import { logger } from '@/lib/logger';

// ── Critical vars (app crashes without them) ────────────────────────
const REQUIRED_ENV = [
  'DATABASE_URL',
  'CSRF_SECRET',
  'SESSION_SECRET',
] as const;

// ── At least one LLM provider key must be present ───────────────────
const REQUIRED_LLM = [
  'MISTRAL_API_KEY',
  'GEMINI_API_KEY',
  'OPENAI_API_KEY',
] as const;

// ── Nice-to-have vars (warn only) ──────────────────────────────────
// DIRECT_URL is handled separately in section 1c (production-only warn).
const RECOMMENDED_ENV = [
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS',
  'REDIS_URL',
  'RAG_API_URL',
  'NEXT_PUBLIC_APP_URL',
] as const;

export type ValidateEnvResult = {
  required: 'ok';
  llm: 'ok';
  recommended: { missing: string[] };
};

/**
 * Validates environment variables.
 *
 * @throws {Error} if any REQUIRED_ENV var is missing.
 * @throws {Error} if none of the REQUIRED_LLM keys are set.
 */
export function validateEnv(): ValidateEnvResult {
  // 1. Required vars ─────────────────────────────────────────────────
  const missingRequired = REQUIRED_ENV.filter(
    (key) => !process.env[key]?.trim(),
  );

  if (missingRequired.length > 0) {
    const msg = `Missing required environment variables: ${missingRequired.join(', ')}`;
    logger.error({ missing: missingRequired }, msg);
    throw new Error(msg);
  }

  // 1b. Production-only: reject weak/default secrets ────────────────
  if (process.env.NODE_ENV === 'production') {
    const WEAK_MARKER = 'minimum_32_characters';
    const secretVars = ['SESSION_SECRET', 'CSRF_SECRET', 'CRON_SECRET'] as const;
    for (const key of secretVars) {
      const val = process.env[key] ?? '';
      if (val.includes(WEAK_MARKER) || val.length < 32) {
        const msg = `${key} is too weak for production. Generate with: openssl rand -base64 32`;
        logger.error({ key }, msg);
        throw new Error(msg);
      }
    }
    if (!process.env.BILLING_CODE_PEPPER?.trim() || (process.env.BILLING_CODE_PEPPER?.length ?? 0) < 32) {
      const msg = 'BILLING_CODE_PEPPER is required in production. Generate with: openssl rand -hex 32';
      logger.error(msg);
      throw new Error(msg);
    }
  }

  // 1c. Production-only: DIRECT_URL required if using PgBouncer/pool ──────
  // Prisma schema declares directUrl = env("DIRECT_URL").
  // In production, this MUST be set (even if identical to DATABASE_URL) to
  // avoid connection-pooler issues with migration commands.
  if (process.env.NODE_ENV === 'production' && !process.env.DIRECT_URL?.trim()) {
    logger.warn(
      { key: 'DIRECT_URL' },
      'DIRECT_URL not set in production. Prisma directUrl will fall back to DATABASE_URL. ' +
      'Set DIRECT_URL explicitly to avoid issues with connection poolers.',
    );
  }

  // 2. At least one LLM key ─────────────────────────────────────────
  const hasLlmKey = REQUIRED_LLM.some((key) => !!process.env[key]?.trim());

  if (!hasLlmKey) {
    const msg = `No LLM provider key found. Set at least one of: ${REQUIRED_LLM.join(', ')}`;
    logger.error({ expected: [...REQUIRED_LLM] }, msg);
    throw new Error(msg);
  }

  // 3. Recommended vars (warn only) ─────────────────────────────────
  const missingRecommended = RECOMMENDED_ENV.filter(
    (key) => !process.env[key]?.trim(),
  );

  if (missingRecommended.length > 0) {
    logger.warn(
      { missing: missingRecommended },
      `Missing recommended environment variables: ${missingRecommended.join(', ')}`,
    );
  }

  return {
    required: 'ok',
    llm: 'ok',
    recommended: { missing: missingRecommended as unknown as string[] },
  };
}
