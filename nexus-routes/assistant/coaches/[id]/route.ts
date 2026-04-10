import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !['ADMIN', 'ASSISTANTE'].includes(session.user?.role ?? '')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const coach = await prisma.user.findUnique({
    where: { id: params.id, role: 'COACH' },
    include: {
      sessions: { orderBy: { createdAt: 'desc' }, take: 10 },
      _count: { select: { sessions: true } },
    },
  });
  if (!coach) return NextResponse.json({ error: 'Coach introuvable' }, { status: 404 });
  return NextResponse.json({ coach });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const body = await req.json();
  const updated = await prisma.user.update({
    where: { id: params.id },
    data: { name: body.name, email: body.email },
  });
  return NextResponse.json({ coach: updated });
}
