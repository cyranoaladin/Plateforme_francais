import { NextResponse } from 'next/server';
import fs from 'fs';
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

function readLocalReleaseValue(fileName: string): string | null {
  try {
    const appRoot = process.env.APP_ROOT?.trim();
    if (!appRoot) return null;
    const candidates = [path.join(path.resolve(appRoot), fileName)];

    for (const filePath of candidates) {
      if (!fs.existsSync(filePath)) continue;
      const raw = fs.readFileSync(filePath, 'utf8').trim();
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

  const allOk = Object.values(checks).every(v => v === 'ok');
  const status = allOk ? 'ok' : checks.db === 'down' ? 'down' : 'degraded';

  // Validate env vars (non-throwing — just log warnings for recommended vars)
  let envStatus: { required: string; llm: string; recommended: { missing: string[] } } | null = null;
  try { envStatus = validateEnv(); } catch { /* env validation failure logged internally */ }

  if (status !== 'ok') {
    logger.warn({ checks, status }, 'health_check_not_ok');
  }

  return NextResponse.json(
    {
      status,
      checks,
      timestamp: new Date().toISOString(),
      release: {
        gitSha: readLocalReleaseValue('.git_sha') ?? process.env['BUILD_GIT_SHA'] ?? 'unknown',
        buildTime: readLocalReleaseValue('.build_time') ?? process.env['BUILD_TIME'] ?? 'unknown',
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
    { status: allOk ? 200 : 503 },
  );
}
