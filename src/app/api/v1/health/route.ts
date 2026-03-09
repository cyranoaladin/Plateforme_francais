import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';

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
    { status, checks, timestamp: new Date().toISOString() },
    { status: allOk ? 200 : 503 },
  );
}
