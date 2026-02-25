import { NextResponse } from 'next/server';
import { type Prisma } from '@prisma/client';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { listMemoryEventsByUser } from '@/lib/db/repositories/memoryRepo';
import { updateUserProfile } from '@/lib/db/repositories/userRepo';
import { evaluateBadges } from '@/lib/gamification/badges';
import { finalizeOralSession, findOralSessionById } from '@/lib/oral/repository';
import { validateCsrf } from '@/lib/security/csrf';
import { parseJsonBody } from '@/lib/validation/request';
import { oralSessionEndBodySchema } from '@/lib/validation/schemas';

/**
 * POST /api/v1/oral/session/{sessionId}/end
 * Body: { notes? }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const csrfError = await validateCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  const { sessionId } = await params;
  const session = await findOralSessionById(sessionId);

  if (!session || session.userId !== auth.user.id) {
    return NextResponse.json({ error: 'Session introuvable.' }, { status: 404 });
  }

  const parsed = await parseJsonBody(request, oralSessionEndBodySchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const totalScore = session.interactions.reduce((sum, item) => sum + item.feedback.score, 0);
  const totalMax = session.interactions.reduce((sum, item) => sum + item.feedback.max, 0);
  const note = totalMax > 0 ? Number(((totalScore / totalMax) * 20).toFixed(1)) : 0;

  const final = {
    note,
    totalScore,
    totalMax,
    details: session.interactions,
    bilan:
      note >= 14
        ? 'Très bonne prestation orale, encore perfectible dans la précision analytique.'
        : note >= 10
          ? 'Prestation solide mais irrégulière, poursuivre le travail sur la méthode.'
          : 'Prestation fragile: renforcer structure, références textuelles et précision grammaticale.',
    notes: parsed.data.notes ?? '',
  };

  await finalizeOralSession({
    sessionId,
    finalFeedback: final as Prisma.JsonObject,
    score: totalScore,
    maxScore: totalMax,
  });

  const timeline = await listMemoryEventsByUser(auth.user.id, 500);
  let badgeResult = evaluateBadges({
    profile: auth.user.profile,
    trigger: 'oral_done',
    timeline,
  });

  if (note > 15) {
    badgeResult = evaluateBadges({
      profile: { ...auth.user.profile, badges: badgeResult.badges },
      trigger: 'score',
      score: note,
      timeline,
    });
  }

  await updateUserProfile(auth.user.id, {
    ...auth.user.profile,
    badges: badgeResult.badges,
  });

  return NextResponse.json({ ...final, newBadges: badgeResult.newBadges }, { status: 200 });
}
