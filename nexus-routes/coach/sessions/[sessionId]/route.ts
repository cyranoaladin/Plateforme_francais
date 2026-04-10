import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const coachSession = await prisma.session.findUnique({
    where: { id: params.sessionId },
    include: { student: { select: { id: true, name: true, email: true } } },
  });
  if (!coachSession) return NextResponse.json({ error: 'Session introuvable' }, { status: 404 });
  if (coachSession.coachId !== session.user?.id && session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }
  return NextResponse.json({ session: coachSession });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const body = await req.json();
  const updated = await prisma.session.update({
    where: { id: params.sessionId },
    data: { status: body.status, notes: body.notes },
  });
  return NextResponse.json({ session: updated });
}
