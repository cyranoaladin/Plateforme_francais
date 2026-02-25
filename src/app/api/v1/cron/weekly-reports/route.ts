import { NextResponse } from 'next/server';
import { isDatabaseAvailable, prisma } from '@/lib/db/client';
import { generateWeeklyReport } from '@/lib/agents/rapport-auto';
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
