import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { isDatabaseAvailable, prisma } from '@/lib/db/client';
import { getDueErrorBankItems } from '@/lib/store/premium-store';
import { sendPushNotification } from '@/lib/notifications/push';
import { logger } from '@/lib/logger';

// Timeout géré par PM2 kill_timeout (ecosystem.config.cjs).

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

  let notified = 0;

  for (const student of students) {
    try {
      const due = await getDueErrorBankItems(student.id);
      if (due.length === 0) continue;
      await sendPushNotification(
        student.id,
        '📚 Rappel Nexus',
        `Tu as ${due.length} révisions en attente aujourd’hui.`,
        '/cahier-erreurs',
      );
      notified++;
    } catch (err) {
      logger.error({ err, studentId: student.id }, 'rappel agent failed');
    }
  }

  return NextResponse.json({ notified, total: students.length });
}
