import { NextResponse } from 'next/server';
import { isDatabaseAvailable, prisma } from '@/lib/db/client';
import { getDueErrorBankItems } from '@/lib/store/premium-store';
import { sendPushNotification } from '@/lib/notifications/push';
import { logger } from '@/lib/logger';

export const maxDuration = 300;

export async function POST(request: Request) {
  const secret = request.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!(await isDatabaseAvailable())) {
    return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
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
        `Tu as ${due.length} révisions en attente aujourd'hui.`,
        '/cahier-erreurs',
      );
      notified++;
    } catch (err) {
      logger.error({ err, studentId: student.id }, 'rappel agent failed');
    }
  }

  return NextResponse.json({ notified, total: students.length });
}
