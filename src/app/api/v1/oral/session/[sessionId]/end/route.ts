import { NextResponse } from 'next/server';
import { type Prisma } from '@prisma/client';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { processInteraction } from '@/lib/agents/student-modeler';
import { createEvaluation } from '@/lib/db/repositories/evaluationRepo';
import { createMemoryEventRecord, listMemoryEventsByUser } from '@/lib/db/repositories/memoryRepo';
import { createMemoryEvent } from '@/lib/memory/store';
import { updateUserProfile } from '@/lib/db/repositories/userRepo';
import { evaluateBadges } from '@/lib/gamification/badges';
import { finalizeOralSession, findOralSessionById } from '@/lib/oral/repository';
import { generateOralBilan } from '@/lib/oral/service';
import type { OralPhaseKey } from '@/lib/oral/scoring';
import { validateCsrf } from '@/lib/security/csrf';
import { parseJsonBody } from '@/lib/validation/request';
import { oralSessionEndBodySchema } from '@/lib/validation/schemas';
import { logger } from '@/lib/logger';

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

  // ✅ MESSAGE GÉNÉRIQUE - Évite fuite d'information
  if (!session || session.userId !== auth.user.id) {
    return NextResponse.json({ error: 'Ressource non disponible.' }, { status: 404 });
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
  const weakSkills = Array.from(
    new Set(session.interactions.flatMap((item) => item.feedback.axes ?? [])),
  ).slice(0, 6);

  const bilan = await generateOralBilan(phaseInputs, phaseDetails);

  await finalizeOralSession({
    sessionId,
    finalFeedback: {
      ...bilan,
      notes: parsed.data.notes ?? '',
    } as unknown as Prisma.JsonObject,
    score: bilan.note,
    maxScore: bilan.maxNote,
    personaType: parsed.data.examinerProfile,
  });

  try {
    await createEvaluation({
      userId: auth.user.id,
      kind: 'oral',
      score: bilan.note,
      maxScore: bilan.maxNote,
      status: 'success',
      payload: {
        sessionId,
        phases: phaseInputs,
        axes: weakSkills,
      } as Prisma.InputJsonValue,
    });
  } catch (err) {
    logger.error({ err, sessionId }, 'oral.end.createEvaluation.failed');
  }

  await processInteraction({
    studentId: auth.user.id,
    interactionId: sessionId,
    agent: 'oral_bilan_officiel',
    rubric: {
      criteria: session.interactions.map((item) => ({
        id: item.step.toLowerCase(),
        label: item.step,
        score: item.feedback.score,
        max: item.feedback.max,
        evidence: item.feedback.feedback,
      })),
    },
  }).catch((err) => {
    logger.warn({ err, sessionId, userId: auth.user.id }, 'oral.end.processInteraction.failed');
  });

  const timeline = await listMemoryEventsByUser(auth.user.id, 500);
  let badgeResult = evaluateBadges({
    profile: auth.user.profile,
    trigger: 'oral_done',
    timeline,
  });

  if (bilan.note >= 16) {
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

  await createMemoryEventRecord(
    createMemoryEvent(auth.user.id, {
      type: 'evaluation',
      feature: 'oral_session_end',
      path: '/atelier-oral',
      payload: {
        sessionId,
        score: bilan.note,
        max: bilan.maxNote,
        weakSkills,
      },
    }),
  );

  return NextResponse.json({ ...bilan, newBadges: badgeResult.newBadges }, { status: 200 });
}
