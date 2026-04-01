import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { getBillingContext } from '@/lib/billing/context';
import { QuotaExceededError as BillingQuotaExceededError } from '@/lib/billing/usage';
import { findOralSessionById } from '@/lib/oral/repository';
import { evaluateAndPersistPhase, PHASE_TOKEN_COST } from '@/lib/oral/evaluate-and-persist';
import { PHASE_MAX_SCORES, type OralPhaseKey } from '@/lib/oral/scoring';
import { validateCsrf } from '@/lib/security/csrf';
import { QuotaExceededError } from '@/lib/security/llm-rate-limiter';
import { parseJsonBody } from '@/lib/validation/request';
import { oralSessionInteractBodySchema } from '@/lib/validation/schemas';

export const INTERACTABLE_STATUSES = new Set<string>(['DRAFT', 'PASSAGE_RUNNING']);
export { PHASE_TOKEN_COST };

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
  // ✅ MESSAGE GÉNÉRIQUE
  if (!session || session.userId !== auth.user.id) {
    return NextResponse.json({ error: 'Ressource non disponible.' }, { status: 404 });
  }
  if (session.status && !INTERACTABLE_STATUSES.has(session.status)) {
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

  let evaluation;
  try {
    evaluation = await evaluateAndPersistPhase({
      userId: auth.user.id,
      sessionId,
      session,
      phase,
      transcript: parsed.data.transcript,
      duration: parsed.data.duration,
      examinerProfile: parsed.data.examinerProfile ?? null,
      billing,
      mode: 'text',
    });
  } catch (error) {
    if (error instanceof BillingQuotaExceededError) {
      return NextResponse.json(
        {
          error: 'Limite de tokens LLM atteinte pour la période. Réessaie demain.',
          code: 'LLM_QUOTA_EXCEEDED',
        },
        { status: 402 },
      );
    }
    if (error instanceof QuotaExceededError) {
      return NextResponse.json(
        { error: `Limite atteinte pour cette évaluation orale (${error.scope}). Réessayez plus tard.` },
        { status: 429 },
      );
    }
    throw error;
  }

  return NextResponse.json(evaluation, { status: 200 });
}
