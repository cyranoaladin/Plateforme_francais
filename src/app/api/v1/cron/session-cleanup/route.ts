import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  const result = await prisma.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });

  logger.info({ deletedCount: result.count }, 'cron.session_cleanup');

  return NextResponse.json({ ok: true, deletedSessions: result.count });
}
