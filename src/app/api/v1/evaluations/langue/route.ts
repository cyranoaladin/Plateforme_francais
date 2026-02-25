import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { createEvaluation } from '@/lib/db/repositories/evaluationRepo';
import { createMemoryEventRecord } from '@/lib/db/repositories/memoryRepo';
import { updateUserProfile } from '@/lib/db/repositories/userRepo';
import { evaluateLangueAnswer } from '@/lib/evaluation/langue';
import { createMemoryEvent } from '@/lib/memory/store';
import { validateCsrf } from '@/lib/security/csrf';
import { parseJsonBody } from '@/lib/validation/request';
import { langueEvaluationBodySchema } from '@/lib/validation/schemas';

export async function POST(request: Request) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const csrfError = await validateCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  const parsed = await parseJsonBody(request, langueEvaluationBodySchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const answer = parsed.data.answer ?? '';
  const result = evaluateLangueAnswer(parsed.data.exerciseId, answer);

  const nextWeakSkills =
    result.status === 'success'
      ? auth.user.profile.weakSkills.filter((skill) => skill !== 'Grammaire')
      : Array.from(new Set([...auth.user.profile.weakSkills, 'Grammaire']));

  await updateUserProfile(auth.user.id, {
    ...auth.user.profile,
    weakSkills: nextWeakSkills,
  });

  await createEvaluation({
    userId: auth.user.id,
    kind: 'langue',
    score: result.score,
    maxScore: result.max,
    status: result.status,
    payload: {
      exerciseId: parsed.data.exerciseId,
      answerLength: answer.length,
    },
  });

  await createMemoryEventRecord(
    createMemoryEvent(auth.user.id, {
      type: 'evaluation',
      feature: 'atelier_langue_submit',
      path: '/atelier-langue',
      payload: {
        exerciseId: parsed.data.exerciseId,
        score: result.score,
        status: result.status,
        weakSkills: result.status === 'success' ? [] : ['Grammaire'],
      },
    }),
  );

  return NextResponse.json(result, { status: 200 });
}
