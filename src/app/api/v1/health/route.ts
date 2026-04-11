import { NextResponse } from 'next/server';
import { access, readFile } from 'node:fs/promises';
import path from 'path';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';
import { getSttCapability } from '@/lib/stt/transcriber';
import { getTtsCapability } from '@/lib/tts/generator';
import { getRedisClient } from '@/lib/queue/correction-queue';
import { validateEnv } from '@/lib/config/validate-env';

function getRequestedVoiceMode(): string {
  const envVal = (process.env.ORAL_VOICE_MODE ?? '').toLowerCase().trim();
  if (envVal === 'browser' || envVal === 'server' || envVal === 'auto') return envVal;
  return 'browser';
}

function getEffectiveVoiceMode(): string {
  const requested = getRequestedVoiceMode();
  const sttAvailable = getSttCapability().available;
  if (requested === 'browser') return 'browser';
  if (requested === 'server') return sttAvailable ? 'server' : 'browser';
  if (requested === 'auto') return sttAvailable ? 'server' : 'browser';
  return 'browser';
}

async function readLocalReleaseValue(fileName: string): Promise<string | null> {
  try {
    const appRoot = process.env.APP_ROOT?.trim();
    if (!appRoot) return null;
    const candidates = [path.join(path.resolve(appRoot), fileName)];

    for (const filePath of candidates) {
      try {
        await access(filePath);
      } catch {
        continue;
      }
      const raw = (await readFile(filePath, 'utf8')).trim();
      if (raw) return raw;
    }

    return null;
  } catch {
    return null;
  }
}

export async function GET() {
  const checks: Record<string, 'ok' | 'down' | 'unknown'> = {
    db: 'unknown',
    rag: 'unknown',
    redis: 'unknown',
    app: 'ok',
  };

  const ragUrl = process.env.RAG_API_URL ?? 'http://127.0.0.1:18001';

  await Promise.all([
    // DB check
    prisma.$queryRawUnsafe('SELECT 1')
      .then(() => { checks.db = 'ok'; })
      .catch(() => { checks.db = 'down'; }),

    // RAG check
    fetch(`${ragUrl}/health`, { signal: AbortSignal.timeout(3000) })
      .then((res) => { checks.rag = res.ok ? 'ok' : 'down'; })
      .catch(() => { checks.rag = 'down'; }),

    // Redis check
    Promise.resolve()
      .then(() => {
        const redis = getRedisClient();
        return redis.ping();
      })
      .then(() => { checks.redis = 'ok'; })
      .catch(() => { checks.redis = 'down'; }),
  ]);

  // Validate env vars (non-throwing — just log warnings for recommended vars)
  let envStatus: { required: string; llm: string; recommended: { missing: string[] } } | null = null;
  try { envStatus = validateEnv(); } catch { /* env validation failure logged internally */ }

  // ── Status logic: 3 levels ─────────────────────────────────────────────────
  // critical → DB or Redis down. App cannot function. HTTP 503.
  // degraded → RAG or voice down. Core auth/billing still works. HTTP 200.
  // ok       → All systems operational. HTTP 200.
  const criticalDown = checks.db === 'down' || checks.redis === 'down';
  const allOk = Object.values(checks).every(v => v === 'ok');
  const status = criticalDown ? 'critical' : allOk ? 'ok' : 'degraded';
  const httpStatus = criticalDown ? 503 : 200;

  // ── Commercial feature health (for observability) ──────────────────────────
  // This surfaces the real user-facing impact beyond infra checks.
  const features = {
    // Core billing and auth work if DB + Redis are up
    auth_billing: checks.db === 'ok' && checks.redis === 'ok' ? 'ok' : 'down',
    // AI correction requires DB (for quota) + at least one LLM key
    correction_ia: checks.db === 'ok' && (envStatus?.llm === 'ok') ? 'ok' : 'degraded',
    // RAG-powered tutor and search
    tuteur_rag: checks.rag === 'ok' ? 'ok' : 'degraded',
    // Oral passages (browser STT always available, server STT optional)
    oral: 'ok' as const,
    // Billing codes table accessibility
    billing_codes: checks.db === 'ok' ? 'ok' : 'down',
  };

  // commercial_readiness: are the features users PAID for actually available?
  const commercialReadiness =
    features.auth_billing === 'ok' &&
    features.correction_ia === 'ok'
      ? 'ok'
      : 'degraded';

  if (status !== 'ok') {
    logger.warn({ checks, status, features }, 'health_check_not_ok');
  }

  // En CI (HEALTH_CHECK_READY=true), toujours retourner 200 si DB + Redis ok
  const isCiReady = process.env.HEALTH_CHECK_READY === 'true';

  const [gitSha, buildTime] = await Promise.all([
    readLocalReleaseValue('.git_sha'),
    readLocalReleaseValue('.build_time'),
  ]);

  return NextResponse.json(
    {
      status,
      checks,
      features,
      commercialReadiness,
      isCiReady,
      timestamp: new Date().toISOString(),
      release: {
        gitSha: gitSha ?? process.env['BUILD_GIT_SHA'] ?? 'unknown',
        buildTime: buildTime ?? process.env['BUILD_TIME'] ?? 'unknown',
        nodeEnv: process.env['NODE_ENV'] ?? 'unknown',
      },
      env: envStatus,
      voice: {
        requestedVoiceMode: getRequestedVoiceMode(),
        effectiveVoiceMode: getEffectiveVoiceMode(),
        sttAvailable: getSttCapability().available,
        ttsAvailable: getTtsCapability().available,
      },
    },
    { status: httpStatus },
  );
}
