import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !['ADMIN', 'ASSISTANTE'].includes(session.user?.role ?? '')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get('studentId');
  if (!studentId) return NextResponse.json({ error: 'studentId requis' }, { status: 400 });
  const credits = await prisma.studentCredit.findUnique({ where: { userId: studentId } });
  return NextResponse.json({ credits: credits ?? { balance: 0, used: 0 } });
}
