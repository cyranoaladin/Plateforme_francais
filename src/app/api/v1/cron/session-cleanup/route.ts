import { timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';
import { copy } from '@/lib/copy/fr';

export async function GET(request: NextRequest) {
  const apiCopy = copy.api;
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    logger.error('CRON_SECRET not configured');
    return NextResponse.json({ error: apiCopy.cron.serverMisconfigured }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization') ?? '';
  const secret = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (
    secret.length !== expected.length ||
    !timingSafeEqual(Buffer.from(secret), Buffer.from(expected))
  ) {
    return NextResponse.json({ error: apiCopy.cron.unauthorized }, { status: 401 });
  }

  const result = await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  logger.info({ deletedCount: result.count }, 'cron.session_cleanup');

  return NextResponse.json({ ok: true, deletedSessions: result.count });
}
