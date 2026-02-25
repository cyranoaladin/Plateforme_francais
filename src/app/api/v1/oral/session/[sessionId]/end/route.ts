import { NextResponse } from 'next/server';
import { type Prisma } from '@prisma/client';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { listMemoryEventsByUser } from '@/lib/db/repositories/memoryRepo';
import { updateUserProfile } from '@/lib/db/repositories/userRepo';
import { evaluateBadges } from '@/lib/gamification/badges';
import { finalizeOralSession, findOralSessionById } from '@/lib/oral/repository';
import { generateOralBilan } from '@/lib/oral/service';
import type { OralPhaseKey } from '@/lib/oral/scoring';
import { validateCsrf } from '@/lib/security/csrf';
import { parseJsonBody } from '@/lib/validation/request';
import { oralSessionEndBodySchema } from '@/lib/validation/schemas';

/**
 * POST /api/v1/oral/session/{sessionId}/end
 * Body: { notes? }
 *
 * Finalizes an oral session: computes official /20 score (2+8+2+8),
 * generates a structured bilan, awards badges, persists results.
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

  const phaseInputs = session.interactions.map((i) => ({
    phase: i.step as OralPhaseKey,
    score: i.feedback.score,
    maxScore: i.feedback.max,
  }));

  const phaseDetails: Record<string, { feedback: string }> = {};
  for (const i of session.interactions) {
    phaseDetails[i.step] = { feedback: i.feedback.feedback };
  }

  const bilan = await generateOralBilan(phaseInputs, phaseDetails);

  await finalizeOralSession({
    sessionId,
    finalFeedback: {
      ...bilan,
      notes: parsed.data.notes ?? '',
    } as unknown as Prisma.JsonObject,
    score: bilan.note,
    maxScore: bilan.maxNote,
  });

  const timeline = await listMemoryEventsByUser(auth.user.id, 500);
  let badgeResult = evaluateBadges({
    profile: auth.user.profile,
    trigger: 'oral_done',
    timeline,
  });

  if (bilan.note > 15) {
    badgeResult = evaluateBadges({
      profile: { ...auth.user.profile, badges: badgeResult.badges },
      trigger: 'score',
      score: bilan.note,
      timeline,
    });
  }

  await updateUserProfile(auth.user.id, {
    ...auth.user.profile,
    badges: badgeResult.badges,
  });

  return NextResponse.json({ ...bilan, newBadges: badgeResult.newBadges }, { status: 200 });
}
