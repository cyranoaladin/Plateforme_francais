import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { BillingContextUnavailableError, getBillingContext } from '@/lib/billing/context';
import { PLAN_DISPLAY_LABELS, toPublicPlanId } from '@/lib/billing/plan-catalog';
import { getResetMessage } from '@/lib/billing/quota-messages';
import { orchestrate } from '@/lib/llm/orchestrator';
import { routeQuery } from '@/lib/agents/router';
import { skillSchema } from '@/lib/llm/skills/types';
import { validateCsrf } from '@/lib/security/csrf';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { createMemoryEventRecord } from '@/lib/db/repositories/memoryRepo';
import { createMemoryEvent } from '@/lib/memory/store';
import { consumeQuota, QuotaExceededError as BillingQuotaExceededError } from '@/lib/billing/usage';
import { parseJsonBody } from '@/lib/validation/request';
import { z } from 'zod';

const chatBodySchema = z.object({
  query: z.string().min(1).max(4000),
  workId: z.string().optional(),
  parcours: z.string().optional(),
  skill: z.string().optional(),
});

/**
 * POST /api/v1/chat — Point d'entrée principal du chatbot IA
 * Body: { query: string; workId?: string; parcours?: string; skill?: Skill }
 * Réponse: OrchestrateResult
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

  const rl = await checkRateLimit({
    request,
    key: `chat:${auth.user.id}`,
    limit: 20,
    windowMs: 60 * 1000,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Trop de messages. Réessayez dans quelques secondes.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const parsed = await parseJsonBody(request, chatBodySchema);
  if (!parsed.success) {
    return parsed.response;
  }

  let billing: Awaited<ReturnType<typeof getBillingContext>>;
  try {
    billing = await getBillingContext(auth.user.id);
  } catch (error) {
    if (error instanceof BillingContextUnavailableError) {
      return NextResponse.json(
        { error: 'La vérification de ton abonnement est momentanément indisponible. Réessaie dans quelques minutes.' },
        { status: 503 },
      );
    }
    throw error;
  }

  const tutorQuota = billing.config.quotas.TUTOR_QUESTIONS;
  if (tutorQuota) {
    try {
      await consumeQuota(auth.user.id, 'TUTOR_QUESTIONS', tutorQuota);
    } catch (error) {
      if (error instanceof BillingQuotaExceededError) {
        return NextResponse.json(
          {
            error: `Tu as atteint la limite incluse pour les échanges guidés (${error.limit} par jour, plan ${PLAN_DISPLAY_LABELS[billing.planId]}). Passe au plan supérieur pour continuer.`,
            code: 'QUOTA_EXCEEDED',
            upgradeUrl: '/pricing',
            plan: toPublicPlanId(billing.planId),
            reset_info: getResetMessage('day'),
          },
          { status: 402 },
        );
      }
      throw error;
    }
  }

  // Résolution du skill (auto si non fourni)
  let skill = parsed.data.skill ? skillSchema.safeParse(parsed.data.skill).data : undefined;
  if (!skill) {
    const resolved = routeQuery(parsed.data.query);
    skill = resolved.skill;
  }

  let result: unknown;
  try {
    result = await orchestrate({
      skill,
      userQuery: parsed.data.query,
      userId: auth.user.id,
      workId: parsed.data.workId,
      parcours: parsed.data.parcours,
    });
  } catch (error) {
    const isQuotaError = error instanceof Error && error.name === 'QuotaExceededError';
    if (isQuotaError) {
      return NextResponse.json(
        { error: 'Quota LLM dépassé. Réessayez plus tard.', code: 'LLM_QUOTA_EXCEEDED' },
        { status: 429 },
      );
    }
    console.error('[chat] orchestrate error:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Une erreur est survenue. Réessayez dans quelques instants.' },
      { status: 500 },
    );
  }

  await createMemoryEventRecord(
    createMemoryEvent(auth.user.id, {
      type: 'interaction',
      feature: 'chat',
      payload: {
        skill,
        workId: parsed.data.workId ?? 'none',
        parcours: parsed.data.parcours ?? 'none',
        queryLength: parsed.data.query.length,
      },
    }),
  ).catch(() => {});

  return NextResponse.json({ output: result, skill }, { status: 200 });
}
