import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { createMemoryEventRecord } from '@/lib/db/repositories/memoryRepo';
import { orchestrate } from '@/lib/llm/orchestrator';
import { createMemoryEvent } from '@/lib/memory/store';
import { validateCsrf } from '@/lib/security/csrf';
import { parseJsonBody } from '@/lib/validation/request';
import { quizGenerateBodySchema } from '@/lib/validation/schemas';

/**
 * POST /api/v1/quiz/generate
 * Body: { theme, difficulte: 1|2|3, nbQuestions: 5|10|20 }
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

  const parsed = await parseJsonBody(request, quizGenerateBodySchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const orchestrateResult = await orchestrate({
    skill: 'quiz_maitre',
    userId: auth.user.id,
    userQuery: `Génère ${parsed.data.nbQuestions} questions sur ${parsed.data.theme} (difficulté ${parsed.data.difficulte}).`,
    context: 'Retourne strictement le format JSON attendu avec options[4] et bonneReponse index.',
  });
  const generated = orchestrateResult.output as {
    questions?: Array<{
      id: string;
      enonce: string;
      options: string[];
      bonneReponse: 0 | 1 | 2 | 3;
      explication: string;
    }>;
  };

  const fallbackQuestions = Array.from({ length: parsed.data.nbQuestions }, (_, idx) => ({
    id: `${parsed.data.theme}-${idx + 1}`,
    enonce: `Question ${idx + 1}: notion clé sur ${parsed.data.theme} ?`,
    options: ['Proposition A', 'Proposition B', 'Proposition C', 'Proposition D'],
    bonneReponse: (idx % 4) as 0 | 1 | 2 | 3,
    explication: 'Révisez la notion dans votre fiche de méthode.',
  }));

  const questions =
    generated.questions && generated.questions.length > 0
      ? generated.questions.slice(0, parsed.data.nbQuestions)
      : fallbackQuestions;

  await createMemoryEventRecord(
    createMemoryEvent(auth.user.id, {
      type: 'quiz',
      feature: 'quiz_generate',
      payload: {
        theme: parsed.data.theme,
        questionCount: questions.length,
      },
    }),
  );

  return NextResponse.json({ questions }, { status: 200 });
}
