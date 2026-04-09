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

  const secret = request.headers.get('x-cron-secret')
    ?? (request.headers.get('authorization')?.startsWith('Bearer ') ? request.headers.get('authorization')!.slice(7) : '');

  if (
    secret.length !== expected.length ||
    !timingSafeEqual(Buffer.from(secret), Buffer.from(expected))
  ) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  const now = new Date();
  const idleThreshold = new Date(now.getTime() - 30 * 60 * 1000); // M2: 30-min idle timeout

  const result = await prisma.session.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: now } },
        { lastSeenAt: { lt: idleThreshold } },
      ],
    },
  });

  logger.info({ deletedCount: result.count }, 'cron.session_cleanup');

  return NextResponse.json({ ok: true, deletedSessions: result.count });
}
