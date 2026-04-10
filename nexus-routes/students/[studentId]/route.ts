import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { studentId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || !['ADMIN', 'ASSISTANTE', 'COACH'].includes(session.user?.role ?? '')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const student = await prisma.user.findUnique({
    where: { id: params.studentId, role: 'STUDENT' },
    include: { studentCredits: true, subscriptions: true },
  });
  if (!student) return NextResponse.json({ error: 'Élève introuvable' }, { status: 404 });
  return NextResponse.json({ student });
}
