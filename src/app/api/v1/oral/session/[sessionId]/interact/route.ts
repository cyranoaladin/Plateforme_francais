import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { orchestrate } from '@/lib/llm/orchestrator';
import { appendOralInteraction, findOralSessionById } from '@/lib/oral/repository';
import { validateCsrf } from '@/lib/security/csrf';
import { parseJsonBody } from '@/lib/validation/request';
import { oralSessionInteractBodySchema } from '@/lib/validation/schemas';

type InteractFeedback = {
  feedback: string;
  score: number;
  max: number;
  points_forts: string[];
  axes: string[];
  relance?: string;
};

const STEP_MAX: Record<'LECTURE' | 'EXPLICATION' | 'GRAMMAIRE' | 'ENTRETIEN', number> = {
  LECTURE: 2,
  EXPLICATION: 8,
  GRAMMAIRE: 2,
  ENTRETIEN: 8,
};

/**
 * POST /api/v1/oral/session/{sessionId}/interact
 * Body: { step, transcript, duration }
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

  const max = STEP_MAX[parsed.data.step];

  const llmResult = (await orchestrate({
    skill: 'coach_oral',
    userId: auth.user.id,
    userQuery: parsed.data.transcript,
    context: `Étape: ${parsed.data.step}.\nDurée: ${parsed.data.duration}s.\nExtrait: ${session.extrait}\nQuestion grammaire: ${session.questionGrammaire}\nLe score max pour cette étape est ${max}.`,
  })) as InteractFeedback;

  const normalized: InteractFeedback = {
    feedback: llmResult.feedback,
    score: Math.max(0, Math.min(max, llmResult.score)),
    max,
    points_forts: llmResult.points_forts,
    axes: llmResult.axes,
    relance: llmResult.relance,
  };

  await appendOralInteraction({
    sessionId,
    interaction: {
      step: parsed.data.step,
      transcript: parsed.data.transcript,
      duration: parsed.data.duration,
      feedback: normalized,
      createdAt: new Date().toISOString(),
    },
  });

  return NextResponse.json(normalized, { status: 200 });
}
