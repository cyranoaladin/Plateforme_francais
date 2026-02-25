import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
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
