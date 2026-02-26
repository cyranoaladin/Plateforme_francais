import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/client';
import { appendOralInteraction, findOralSessionById } from '@/lib/oral/repository';
import { evaluateOralPhase } from '@/lib/oral/service';
import { PHASE_MAX_SCORES, type OralPhaseKey } from '@/lib/oral/scoring';
import { validateCsrf } from '@/lib/security/csrf';
import { parseJsonBody } from '@/lib/validation/request';
import { oralSessionInteractBodySchema } from '@/lib/validation/schemas';

/**
 * POST /api/v1/oral/session/{sessionId}/interact
 * Body: { step, transcript, duration }
 *
 * Evaluates a single oral phase (LECTURE /2, EXPLICATION /8, GRAMMAIRE /2, ENTRETIEN /8).
 * The AI proposes a score; it is clamped to the official maximum.
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

  const parsed = await parseJsonBody(request, oralSessionInteractBodySchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const phase = parsed.data.step as OralPhaseKey;
  if (!(phase in PHASE_MAX_SCORES)) {
    return NextResponse.json({ error: 'Phase invalide.' }, { status: 400 });
  }

  const profile = await prisma.studentProfile.findUnique({ where: { userId: auth.user.id } });

  const evaluation = await evaluateOralPhase({
    phase,
    transcript: parsed.data.transcript,
    extrait: session.extrait,
    questionGrammaire: session.questionGrammaire,
    oeuvre: session.oeuvre,
    duration: parsed.data.duration,
    oeuvreChoisieEntretien: profile?.oeuvreChoisieEntretien ?? null,
  });

  await appendOralInteraction({
    sessionId,
    interaction: {
      step: parsed.data.step,
      transcript: parsed.data.transcript,
      duration: parsed.data.duration,
      feedback: evaluation,
      createdAt: new Date().toISOString(),
    },
  });

  return NextResponse.json(evaluation, { status: 200 });
}
