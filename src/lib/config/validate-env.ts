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
