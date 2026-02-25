import { NextResponse } from 'next/server';
import { requireUserRole } from '@/lib/auth/guard';
import { isDatabaseAvailable, prisma } from '@/lib/db/client';
import { readFallbackStore } from '@/lib/db/fallback-store';
import { checkRateLimit } from '@/lib/security/rate-limit';

/**
 * Protège une valeur CSV :
 * - échappement des guillemets doubles
 * - neutralisation des formules Excel/LibreOffice (= @ + - tab)
 */
function csvEscape(input: string): string {
  const sanitized = String(input ?? '');
  // Neutraliser les formules : préfixe par une apostrophe
  const safe = /^[=+\-@\t]/.test(sanitized) ? `'${sanitized}` : sanitized;
  return `"${safe.replace(/"/g, '""')}"`;
}

/**
 * @route GET /api/v1/enseignant/export
 * @description Exporte les résultats de la classe au format CSV.
 */
export async function GET(request: Request) {
  const { auth, errorResponse } = await requireUserRole('enseignant');
  if (!auth || errorResponse) {
    return errorResponse;
  }

  // Rate-limiting : 10 exports par heure par enseignant
  const rl = await checkRateLimit({
    request,
    key: `export:${auth.user.id}`,
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Trop de requêtes. Réessayez dans quelques minutes.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rl.retryAfter) },
      },
    );
  }

  const classCode = auth.user.profile?.classCode ?? null;
  if (!classCode) {
    return new NextResponse('student_name,email,average_score,last_activity\n', {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="eaf-classe.csv"',
      },
    });
  }

  const rows: string[] = ['student_name,email,average_score,last_activity'];

  if (await isDatabaseAvailable()) {
    const students = await prisma.user.findMany({
      where: { role: 'eleve', profile: { classCode } },
      include: {
        profile: true,
        evaluations: true,
        memoryEvents: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    for (const student of students) {
      const scores = student.evaluations.map((item) => item.score);
      const average = scores.length > 0
        ? (scores.reduce((sum, value) => sum + value, 0) / scores.length).toFixed(2)
        : '0.00';

      rows.push([
        csvEscape(student.profile?.displayName ?? 'Élève'),
        csvEscape(student.email),
        average,
        student.memoryEvents[0]?.createdAt.toISOString() ?? '',
      ].join(','));
    }
  } else {
    const store = await readFallbackStore();
    const students = store.users.filter((item) => (item.role ?? 'eleve') === 'eleve' && item.profile.classCode === classCode);

    for (const student of students) {
      const events = store.events.filter((event) => event.userId === student.id);
      const scores = events
        .filter((event) => event.type === 'evaluation' && typeof event.payload?.score === 'number')
        .map((event) => Number(event.payload?.score ?? 0));

      const average = scores.length > 0
        ? (scores.reduce((sum, value) => sum + value, 0) / scores.length).toFixed(2)
        : '0.00';

      const lastActivity = events.length > 0
        ? events.map((event) => event.createdAt).sort((a, b) => b.localeCompare(a))[0] ?? ''
        : '';

      rows.push([
        csvEscape(student.profile.displayName),
        csvEscape(student.email),
        average,
        lastActivity,
      ].join(','));
    }
  }

  return new NextResponse(`${rows.join('\n')}\n`, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="eaf-classe-${classCode}.csv"`,
    },
  });
}
