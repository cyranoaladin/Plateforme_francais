import { timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    logger.error('CRON_SECRET not configured');
    return NextResponse.json({ error: 'Configuration serveur manquante.' }, { status: 500 });
  }

  const authHeader = request.headers.get('authorization') ?? '';
  const secret = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (
    secret.length !== expected.length ||
    !timingSafeEqual(Buffer.from(secret), Buffer.from(expected))
  ) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  const result = await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  logger.info({ deletedCount: result.count }, 'cron.session_cleanup');

  return NextResponse.json({ ok: true, deletedSessions: result.count });
}
