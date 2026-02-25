import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { createMemoryEventRecord } from '@/lib/db/repositories/memoryRepo';
import { createMemoryEvent } from '@/lib/memory/store';
import { validateCsrf } from '@/lib/security/csrf';
import { parseJsonBody } from '@/lib/validation/request';
import { memoryEventBodySchema } from '@/lib/validation/schemas';

export async function POST(request: Request) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const csrfError = await validateCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  const parsed = await parseJsonBody(request, memoryEventBodySchema);
  if (!parsed.success) {
    return parsed.response;
  }

  await createMemoryEventRecord(
    createMemoryEvent(auth.user.id, {
      type: parsed.data.type ?? 'interaction',
      feature: parsed.data.feature ?? 'unknown',
      path: parsed.data.path,
      payload: parsed.data.payload as Record<string, string | number | boolean | string[]> | undefined,
    }),
  );

  return NextResponse.json({ ok: true }, { status: 201 });
}
