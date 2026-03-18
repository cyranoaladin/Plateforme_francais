import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthenticatedUserId } from '@/lib/auth/session';
import { validateCsrf } from '@/lib/security/csrf';
import { createEvaluation } from '@/lib/db/repositories/evaluationRepo';
import { logger } from '@/lib/logger';

const evaluateSchema = z.object({
  theme: z.string().min(1),
  score: z.number().int().min(0),
  maxScore: z.number().int().min(1),
  questionsCount: z.number().int().min(1).optional(),
});

/**
 * POST /api/v1/quiz/evaluate
 * Persists a quiz evaluation result to the database.
 */
export async function POST(request: Request) {
  const csrfError = await validateCsrf(request);
  if (csrfError) return csrfError;

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = evaluateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides.' }, { status: 400 });
    }

    const { theme, score, maxScore, questionsCount } = parsed.data;

    await createEvaluation({
      userId,
      kind: `quiz_${theme}`,
      score,
      maxScore,
      status: score / maxScore >= 0.6 ? 'PASSED' : 'FAILED',
      payload: { theme, questionsCount: questionsCount ?? maxScore },
    });

    logger.info({ userId, theme, score, maxScore }, 'quiz.evaluate.saved');
    return NextResponse.json({ ok: true });
  } catch (error) {
    logger.error({ error }, 'quiz.evaluate.error');
    return NextResponse.json({ error: 'Erreur lors de l\'enregistrement.' }, { status: 500 });
  }
}
