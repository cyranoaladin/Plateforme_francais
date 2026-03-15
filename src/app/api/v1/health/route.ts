import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';
import { getSttCapability } from '@/lib/stt/transcriber';
import { getTtsCapability } from '@/lib/tts/generator';

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

export async function GET() {
  const checks: Record<string, 'ok' | 'down' | 'unknown'> = {
    db: 'unknown',
    app: 'ok',
  };

  try {
    await prisma.$queryRawUnsafe('SELECT 1');
    checks.db = 'ok';
  } catch {
    checks.db = 'down';
  }

  const allOk = Object.values(checks).every(v => v === 'ok');
  const status = allOk ? 'ok' : checks.db === 'down' ? 'down' : 'degraded';

  if (status !== 'ok') {
    logger.warn({ checks, status }, 'health_check_not_ok');
  }

  return NextResponse.json(
    {
      status,
      checks,
      timestamp: new Date().toISOString(),
      release: {
        gitSha: process.env.BUILD_GIT_SHA ?? 'unknown',
        buildTime: process.env.BUILD_TIME ?? 'unknown',
        nodeEnv: process.env.NODE_ENV ?? 'unknown',
      },
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
