import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { BillingContextUnavailableError, getBillingContext } from '@/lib/billing/context';
import { consumeQuota, QuotaExceededError } from '@/lib/billing/usage';
import { createMemoryEventRecord } from '@/lib/db/repositories/memoryRepo';
import { searchOfficialReferences } from '@/lib/rag/search';
import { createMemoryEvent } from '@/lib/memory/store';
import { validateCsrf } from '@/lib/security/csrf';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { parseJsonBody } from '@/lib/validation/request';
import { ragSearchBodySchema } from '@/lib/validation/schemas';

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
    key: `rag:search:${auth.user.id}`,
    limit: 20,
    windowMs: 60 * 1000,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Trop de recherches. Réessayez dans quelques secondes.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  // 18B: Enforce RAG_SEARCH quota from plan-catalog
  let billing;
  try {
    billing = await getBillingContext(auth.user.id);
  } catch (error) {
    if (error instanceof BillingContextUnavailableError) {
      return NextResponse.json(
        { error: 'Vérification de l\u2019abonnement momentanément indisponible.' },
        { status: 503 },
      );
    }
    throw error;
  }

  const ragQuota = billing.config.quotas.RAG_SEARCH;
  if (ragQuota) {
    try {
      await consumeQuota(auth.user.id, 'RAG_SEARCH', ragQuota);
    } catch (error) {
      if (error instanceof QuotaExceededError) {
        return NextResponse.json(
          {
            error: `Tu as atteint la limite de recherches documentaires (${error.limit} par jour, plan ${billing.planId}). Passe au plan supérieur pour continuer.`,
            code: 'QUOTA_EXCEEDED',
            upgradeUrl: '/pricing',
            plan: billing.planId,
          },
          { status: 402 },
        );
      }
      throw error;
    }
  }

  const parsed = await parseJsonBody(request, ragSearchBodySchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const results = await searchOfficialReferences(parsed.data.query, parsed.data.maxResults);

  await createMemoryEventRecord(
    createMemoryEvent(auth.user.id, {
      type: 'resource',
      feature: 'rag_search',
      path: '/bibliotheque',
      payload: {
        query: parsed.data.query,
        resultCount: results.length,
      },
    }),
  );

  return NextResponse.json(
    {
      query: parsed.data.query,
      results,
      citationsRequired: results.length === 0,
    },
    { status: 200 },
  );
}
