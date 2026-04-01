import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/client';
import { createMemoryEventRecord } from '@/lib/db/repositories/memoryRepo';
import { createMemoryEvent } from '@/lib/memory/store';
import { getBillingContext } from '@/lib/billing/context';
import { checkQuota, consumeQuota, QuotaExceededError as BillingQuotaExceededError } from '@/lib/billing/usage';
import { logger } from '@/lib/logger';
import { appendOralInteraction, findOralSessionById } from '@/lib/oral/repository';
import { evaluateOralPhase } from '@/lib/oral/service';
import { PHASE_MAX_SCORES, type OralPhaseKey } from '@/lib/oral/scoring';
import { validateCsrf } from '@/lib/security/csrf';
import { QuotaExceededError } from '@/lib/security/llm-rate-limiter';
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
  const interactableStatuses = new Set(['DRAFT', 'PASSAGE_RUNNING']);
  const phaseTokenCost: Record<OralPhaseKey, number> = {
    LECTURE: 200,
    EXPLICATION: 800,
    GRAMMAIRE: 300,
    ENTRETIEN: 1000,
  };
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
  // ✅ MESSAGE GÉNÉRIQUE
  if (!session || session.userId !== auth.user.id) {
    return NextResponse.json({ error: 'Ressource non disponible.' }, { status: 404 });
  }
  if (session.status && !interactableStatuses.has(session.status)) {
    return NextResponse.json(
      { error: 'Cette session ne peut plus recevoir d’interaction.' },
      { status: 409 },
    );
  }

  const parsed = await parseJsonBody(request, oralSessionInteractBodySchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const phase = parsed.data.step as OralPhaseKey;
  if (!(phase in PHASE_MAX_SCORES)) {
    return NextResponse.json({ error: 'Phase invalide.' }, { status: 400 });
  }

  const billing = await getBillingContext(auth.user.id);
  const llmQuota = billing.config.quotas.LLM_TOKENS;
  if (llmQuota) {
    const tokenCheck = await checkQuota(auth.user.id, 'LLM_TOKENS', llmQuota);
    if (!tokenCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Limite de tokens LLM atteinte pour la période. Réessaie demain.',
          code: 'LLM_QUOTA_EXCEEDED',
        },
        { status: 402 },
      );
    }
  }

  const profile =
    parsed.data.step === 'ENTRETIEN'
      ? await prisma.studentProfile.findUnique({ where: { userId: auth.user.id } })
      : null;

  let evaluation;
  try {
    evaluation = await evaluateOralPhase({
      phase,
      transcript: parsed.data.transcript,
      extrait: session.extrait,
      questionGrammaire: session.questionGrammaire,
      oeuvre: session.oeuvre,
      duration: parsed.data.duration,
      userId: auth.user.id,
      oeuvreChoisieEntretien: profile?.oeuvreChoisieEntretien ?? null,
      examinerProfile: parsed.data.examinerProfile ?? null,
    });
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      return NextResponse.json(
        { error: `Limite atteinte pour cette évaluation orale (${error.scope}). Réessayez plus tard.` },
        { status: 429 },
      );
    }
    throw error;
  }

  if (llmQuota && llmQuota.limit !== 0 && llmQuota.limit !== 'unlimited') {
    try {
      await consumeQuota(auth.user.id, 'LLM_TOKENS', llmQuota, phaseTokenCost[phase] ?? 500);
    } catch (err) {
      if (err instanceof BillingQuotaExceededError) {
        logger.warn(
          { userId: auth.user.id, step: parsed.data.step },
          'interact.llm_tokens.post_consume.exceeded',
        );
      } else {
        logger.warn(
          { err, userId: auth.user.id, step: parsed.data.step },
          'interact.llm_tokens.consume.failed',
        );
      }
    }
  }

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

  await createMemoryEventRecord(
    createMemoryEvent(auth.user.id, {
      type: 'evaluation',
      feature: `oral_phase_${parsed.data.step.toLowerCase()}`,
      path: '/atelier-oral',
      payload: {
        sessionId,
        step: parsed.data.step,
        score: evaluation.score,
        max: evaluation.max,
        duration: parsed.data.duration,
      },
    }),
  );

  return NextResponse.json(evaluation, { status: 200 });
}
