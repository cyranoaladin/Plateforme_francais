import { createMemoryEventRecord } from '@/lib/db/repositories/memoryRepo';
import { prisma } from '@/lib/db/client';
import { type BillingContext } from '@/lib/billing/context';
import {
  checkQuota,
  consumeQuota,
  QuotaExceededError as BillingQuotaExceededError,
} from '@/lib/billing/usage';
import { logger } from '@/lib/logger';
import { createMemoryEvent } from '@/lib/memory/store';
import { appendOralInteraction, type OralSessionState } from '@/lib/oral/repository';
import { type OralPhaseKey } from '@/lib/oral/scoring';
import { evaluateOralPhase, type PhaseEvaluation } from '@/lib/oral/service';

export const PHASE_TOKEN_COST: Readonly<Record<OralPhaseKey, number>> = {
  LECTURE: 200,
  EXPLICATION: 800,
  GRAMMAIRE: 300,
  ENTRETIEN: 1000,
} as const;

export async function evaluateAndPersistPhase(input: {
  userId: string;
  sessionId: string;
  session: OralSessionState;
  phase: OralPhaseKey;
  transcript: string;
  duration: number;
  examinerProfile?: string | null;
  billing: BillingContext;
  mode?: 'text' | 'voice';
}): Promise<PhaseEvaluation> {
  const llmQuota = input.billing.config.quotas.LLM_TOKENS;
  if (llmQuota) {
    const tokenCheck = await checkQuota(input.userId, 'LLM_TOKENS', llmQuota);
    if (!tokenCheck.allowed) {
      throw new BillingQuotaExceededError(
        'LLM_TOKENS',
        typeof tokenCheck.limit === 'number' ? tokenCheck.limit : 0,
        tokenCheck.current,
        llmQuota.period,
      );
    }
  }

  const profile =
    input.phase === 'ENTRETIEN'
      ? await prisma.studentProfile.findUnique({ where: { userId: input.userId } })
      : null;

  const evaluation = await evaluateOralPhase({
    phase: input.phase,
    transcript: input.transcript,
    extrait: input.session.extrait,
    questionGrammaire: input.session.questionGrammaire,
    oeuvre: input.session.oeuvre,
    duration: input.duration,
    userId: input.userId,
    oeuvreChoisieEntretien: profile?.oeuvreChoisieEntretien ?? null,
    examinerProfile: input.phase === 'ENTRETIEN' ? (input.examinerProfile ?? null) : null,
  });

  if (llmQuota && llmQuota.limit !== 0 && llmQuota.limit !== 'unlimited') {
    try {
      await consumeQuota(
        input.userId,
        'LLM_TOKENS',
        llmQuota,
        PHASE_TOKEN_COST[input.phase] ?? 500,
      );
    } catch (err) {
      if (err instanceof BillingQuotaExceededError) {
        logger.warn(
          { userId: input.userId, step: input.phase },
          'oral.phase.llm_tokens.post_consume.exceeded',
        );
      } else {
        logger.warn(
          { err, userId: input.userId, step: input.phase },
          'oral.phase.llm_tokens.consume.failed',
        );
      }
    }
  }

  await appendOralInteraction({
    sessionId: input.sessionId,
    interaction: {
      step: input.phase,
      transcript: input.transcript,
      duration: input.duration,
      feedback: evaluation,
      createdAt: new Date().toISOString(),
    },
  });

  await createMemoryEventRecord(
    createMemoryEvent(input.userId, {
      type: 'evaluation',
      feature: `oral_phase_${input.phase.toLowerCase()}`,
      path: '/atelier-oral',
      payload: {
        sessionId: input.sessionId,
        step: input.phase,
        score: evaluation.score,
        max: evaluation.max,
        duration: input.duration,
        ...(input.mode ? { mode: input.mode } : {}),
      },
    }),
  );

  return evaluation;
}
