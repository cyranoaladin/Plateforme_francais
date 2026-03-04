import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { createMemoryEventRecord, listMemoryEventsByUser } from '@/lib/db/repositories/memoryRepo';
import { createMemoryEvent } from '@/lib/memory/store';
import { validateCsrf } from '@/lib/security/csrf';
import { parseJsonBody } from '@/lib/validation/request';

const entrySchema = z.object({
  oeuvre: z.string().trim().min(1).max(200),
  type: z.enum(['citation', 'note', 'reaction', 'resume', 'lien_culturel']),
  contenu: z.string().trim().min(1).max(8000),
  page: z.string().trim().max(40).optional(),
  tags: z.array(z.string().trim().min(1).max(60)).max(8).optional(),
});

export async function POST(request: Request) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const csrfError = await validateCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  const parsed = await parseJsonBody(request, entrySchema);
  if (!parsed.success) {
    return parsed.response;
  }

  await createMemoryEventRecord(
    createMemoryEvent(auth.user.id, {
      type: 'resource',
      feature: 'carnet_entry',
      path: '/carnet',
      payload: parsed.data,
    }),
  );

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function GET() {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const events = await listMemoryEventsByUser(auth.user.id, 500);
  const entries = events
    .filter((e) => e.feature === 'carnet_entry' && e.type === 'resource')
    .map((e) => ({
      id: e.id,
      createdAt: e.createdAt,
      oeuvre: (e.payload?.oeuvre as string) ?? '',
      type: (e.payload?.type as 'citation' | 'note' | 'reaction' | 'resume' | 'lien_culturel') ?? 'note',
      contenu: (e.payload?.contenu as string) ?? '',
      page: (e.payload?.page as string | undefined) ?? undefined,
      tags: (Array.isArray(e.payload?.tags) ? (e.payload?.tags as string[]) : undefined) ?? [],
    }))
    .filter((e) => e.oeuvre && e.contenu)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return NextResponse.json({ entries }, { status: 200 });
}
