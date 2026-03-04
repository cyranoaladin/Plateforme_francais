import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { orchestrate } from '@/lib/llm/orchestrator';
import { routeQuery } from '@/lib/agents/router';
import { skillSchema } from '@/lib/llm/skills/types';
import { validateCsrf } from '@/lib/security/csrf';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { incrementUsage } from '@/lib/billing/gating';
import { createMemoryEventRecord } from '@/lib/db/repositories/memoryRepo';
import { createMemoryEvent } from '@/lib/memory/store';
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

  // Résolution du skill (auto si non fourni)
  let skill = parsed.data.skill ? skillSchema.safeParse(parsed.data.skill).data : undefined;
  if (!skill) {
    const resolved = routeQuery(parsed.data.query);
    skill = resolved.skill;
  }

  const result = await orchestrate({
    skill,
    userQuery: parsed.data.query,
    userId: auth.user.id,
    workId: parsed.data.workId,
    parcours: parsed.data.parcours,
  });

  await incrementUsage(auth.user.id, 'tuteurMessagesPerDay').catch(() => {});

  await createMemoryEventRecord(
    createMemoryEvent(auth.user.id, {
      type: 'interaction',
      feature: 'chat',
      payload: {
        skill: result.skill,
        ragDocsUsed: result.ragDocsUsed,
        blocked: result.blocked,
        latencyMs: result.latencyMs,
      },
    }),
  ).catch(() => {});

  return NextResponse.json(result, { status: 200 });
}
