import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { startOralPassage, findOralSessionById } from '@/lib/oral/repository';
import { validateCsrf } from '@/lib/security/csrf';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) return errorResponse;

  const csrfError = await validateCsrf(request);
  if (csrfError) return csrfError;

  const { sessionId } = await params;
  const session = await findOralSessionById(sessionId);
  if (!session || session.userId !== auth.user.id) {
    return NextResponse.json({ error: 'Ressource non disponible.' }, { status: 404 });
  }

  await startOralPassage(sessionId);
  return NextResponse.json({ ok: true, status: 'PASSAGE_RUNNING', startedAt: new Date() });
}
