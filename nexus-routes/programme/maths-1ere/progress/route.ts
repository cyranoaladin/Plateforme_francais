import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const progress = await prisma.programmeProgress.findMany({
    where: { userId: session.user?.id, programme: 'MATHS_1ERE' },
  });
  return NextResponse.json({ progress });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const { chapterId, status, score } = await req.json();
  const updated = await prisma.programmeProgress.upsert({
    where: { userId_chapterId: { userId: session.user!.id, chapterId } },
    update: { status, score, updatedAt: new Date() },
    create: { userId: session.user!.id, chapterId, programme: 'MATHS_1ERE', status, score },
  });
  return NextResponse.json({ progress: updated });
}
