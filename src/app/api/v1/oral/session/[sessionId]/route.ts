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

  return NextResponse.json(
    {
      session: {
        id: session.id,
        userId: session.userId,
        status: session.status,
        mode: session.mode,
        oeuvre: session.oeuvre,
        extrait: session.extrait,
        questionGrammaire: session.questionGrammaire,
        score: session.score,
        maxScore: session.maxScore,
        createdAt: session.createdAt,
        endedAt: session.endedAt,
        finalFeedback: session.finalFeedback,
      },
    },
    { status: 200 },
  );
}
