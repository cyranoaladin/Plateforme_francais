import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
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

function readLocalReleaseValue(fileName: string): string | null {
  try {
    const appRoot = process.env.APP_ROOT?.trim();
    const candidates = [
      // Preferred: deployment root (VPS)
      ...(appRoot ? [path.join(path.resolve(appRoot), fileName)] : []),
      // Standalone runtime cwd (PM2 process cwd)
      path.join(process.cwd(), fileName),
    ];

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
        gitSha: readLocalReleaseValue('.git_sha') ?? 'unknown',
        buildTime: readLocalReleaseValue('.build_time') ?? 'unknown',
        nodeEnv: process.env['NODE_ENV'] ?? 'unknown',
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
