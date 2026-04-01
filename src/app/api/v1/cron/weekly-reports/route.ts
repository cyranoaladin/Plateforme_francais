import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { isDatabaseAvailable, prisma } from '@/lib/db/client';
import { generateWeeklyReport } from '@/lib/agents/rapport-auto';
import { logger } from '@/lib/logger';

// Timeout géré par PM2 kill_timeout (ecosystem.config.cjs)
// et par Nginx proxy_read_timeout pour les requêtes longues.
// Durée estimée max : ~5 min pour N étudiants (voir ecosystem.config.cjs).

export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    logger.error('CRON_SECRET not configured');
    return NextResponse.json({ error: 'Configuration serveur manquante.' }, { status: 500 });
  }
  const secret = request.headers.get('x-cron-secret') ?? '';
  if (
    secret.length !== expected.length ||
    !timingSafeEqual(Buffer.from(secret), Buffer.from(expected))
  ) {
    return NextResponse.json({ error: 'Non autorisé.' }, { status: 401 });
  }

  if (!(await isDatabaseAvailable())) {
    return NextResponse.json({ error: 'Base de données indisponible.' }, { status: 503 });
  }

  const students = await prisma.user.findMany({
    where: { role: 'eleve' },
    select: { id: true },
  });

  let success = 0;
  let failed = 0;

  for (const student of students) {
    try {
      await generateWeeklyReport(student.id);
      success++;
    } catch (err) {
      logger.error({ err, studentId: student.id }, 'weekly report failed');
      failed++;
    }
  }

  logger.info({ success, failed, total: students.length }, 'weekly reports batch done');
  return NextResponse.json({ success, failed, total: students.length });
}
