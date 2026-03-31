import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { findOralSessionById } from '@/lib/oral/repository';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const { sessionId } = await params;
  const session = await findOralSessionById(sessionId);
  if (!session || session.userId !== auth.user.id) {
    return NextResponse.json({ error: 'Session introuvable.' }, { status: 404 });
  }

  return NextResponse.json({ session }, { status: 200 });
}
