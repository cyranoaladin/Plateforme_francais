import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { createMemoryEventRecord } from '@/lib/db/repositories/memoryRepo';
import { createMemoryEvent } from '@/lib/memory/store';
import { validateCsrf } from '@/lib/security/csrf';
import { langueGenerateBodySchema } from '@/lib/validation/schemas';
import { parseJsonBody } from '@/lib/validation/request';
import { buildLangueExerciseSeries, type LangueExercise } from '@/lib/langue/exercise-bank';
import { orchestrate } from '@/lib/llm/orchestrator';
import { logger } from '@/lib/logger';

/**
 * POST /api/v1/langue/generate
 * Body: { theme?: 'subordonnees'|'relations_logiques'|'systeme_verbal'|'mixte', count?: 1-10 }
 * Generates dynamic grammar exercises using LLM, with fallback to local bank.
 */
export async function POST(request: Request) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const csrfError = await validateCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  const parsed = await parseJsonBody(request, langueGenerateBodySchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const theme = parsed.data.theme ?? 'mixte';
  const count = parsed.data.count ?? 5;

  // Try to generate exercises using LLM first
  let exercises: LangueExercise[] = [];
  let source = 'local_bank';

  try {
    const result = await orchestrate({
      skill: 'langue_generator',
      userId: auth.user.id,
      userQuery: `Génère ${count} exercices de grammaire EAF sur le thème "${theme}".`,
      context: `Thème: ${theme}. Nombre d'exercices: ${count}. Niveau: Première générale.`,
    }) as { exercises?: Array<{ sentence: string; question: string; correction: string; axe?: string }> };

    if (result.exercises && result.exercises.length >= count) {
      exercises = result.exercises.map((ex, idx) => ({
        id: `llm-${theme}-${idx}`,
        sentence: ex.sentence,
        question: ex.question,
        correction: ex.correction,
        axe: (ex.axe ?? theme) as Exclude<typeof theme, 'mixte'>,
      }));
      source = 'llm_generated';
    }
  } catch (err) {
    logger.warn({ err, theme, count }, 'langue_generate.llm_failed');
    // Fallback to local bank
  }

  // Fallback to local bank if LLM generation failed or returned empty
  if (exercises.length === 0) {
    exercises = buildLangueExerciseSeries(theme, count);
    source = 'local_bank';
  }

  await createMemoryEventRecord(
    createMemoryEvent(auth.user.id, {
      type: 'interaction',
      feature: 'atelier_langue_generate',
      path: '/atelier-langue',
      payload: {
        theme,
        count: exercises.length,
        source,
      },
    }),
  ).catch(() => undefined);

  return NextResponse.json(
    {
      exercises,
      source,
    },
    { status: 200 },
  );
}
