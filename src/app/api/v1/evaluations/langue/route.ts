import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { processInteraction } from '@/lib/agents/student-modeler';
import { createEvaluation } from '@/lib/db/repositories/evaluationRepo';
import { createMemoryEventRecord } from '@/lib/db/repositories/memoryRepo';
import { updateUserProfile } from '@/lib/db/repositories/userRepo';
import { orchestrate } from '@/lib/llm/orchestrator';
import { logger } from '@/lib/logger';
import { createMemoryEvent } from '@/lib/memory/store';
import { validateCsrf } from '@/lib/security/csrf';
import { parseJsonBody } from '@/lib/validation/request';
import { langueEvaluationBodySchema } from '@/lib/validation/schemas';

type LangueResult = {
  score: number;
  max: number;
  status: 'success' | 'warning' | 'error';
  message: string;
  missing: string[];
};

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
  const sentence = parsed.data.sentence ?? '';
  const question = parsed.data.question ?? '';

  let result: LangueResult;

  try {
    const llmResult = (await orchestrate({
      skill: 'grammaire_ciblee',
      userId: auth.user.id,
      userQuery: `Évalue cette réponse de grammaire EAF (/2).

PHRASE : « ${sentence} »
QUESTION : ${question}
RÉPONSE DE L'ÉLÈVE : ${answer}

Évalue la réponse selon les critères officiels EAF : identification, dénomination précise, interprétation dans le contexte.`,
      context: 'Évaluation grammaire EAF. Barème /2. Terminologie programme Première obligatoire.',
    })) as {
      feedback?: string;
      score?: number;
      max?: number;
      points_forts?: string[];
      axes?: string[];
    };

    const score = typeof llmResult.score === 'number' ? llmResult.score : 0;
    const max = typeof llmResult.max === 'number' ? llmResult.max : 2;

    result = {
      score,
      max,
      status: score >= 1.5 ? 'success' : score >= 0.5 ? 'warning' : 'error',
      message: llmResult.feedback ?? 'Évaluation terminée.',
      missing: llmResult.axes ?? [],
    };
  } catch (err) {
    logger.error({ err }, 'evaluations.langue.llm.error');
    result = {
      score: 0,
      max: 2,
      status: 'error',
      message: 'Impossible d\u2019évaluer votre réponse pour le moment. Réessayez.',
      missing: [],
    };
  }

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

  await processInteraction({
    studentId: auth.user.id,
    interactionId: `langue:${parsed.data.exerciseId}:${Date.now()}`,
    agent: 'grammaire_ciblee',
    skillDeltas: [
      {
        microSkillId: 'langue_grammaire',
        scoreDelta: result.max > 0 ? result.score / result.max : 0,
        evidence: result.message,
      },
    ],
    detectedErrors:
      result.status === 'success'
        ? []
        : [
            {
              errorType: 'grammaire_erreur',
              category: 'langue',
              microSkillId: 'langue_grammaire',
              example: answer.slice(0, 180) || question,
              correction: result.message,
            },
          ],
  }).catch(() => undefined);

  await createMemoryEventRecord(
    createMemoryEvent(auth.user.id, {
      type: 'evaluation',
      feature: 'atelier_langue_submit',
      path: '/atelier-langue',
      payload: {
        exerciseId: String(parsed.data.exerciseId),
        score: result.score,
        status: result.status,
        weakSkills: result.status === 'success' ? [] : ['Grammaire'],
      },
    }),
  );

  return NextResponse.json(result, { status: 200 });
}
