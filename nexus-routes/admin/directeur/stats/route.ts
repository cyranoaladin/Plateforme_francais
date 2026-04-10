import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !['ADMIN', 'DIRECTEUR'].includes(session.user?.role ?? '')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  try {
    const [totalStudents, activeSessions, monthlyRevenue] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.session.count({
        where: { status: 'COMPLETED', createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
      }),
      prisma.payment.aggregate({
        where: {
          status: 'VALIDATED',
          createdAt: { gte: new Date(new Date().setDate(1)) },
        },
        _sum: { amount: true },
      }),
    ]);
    return NextResponse.json({
      totalStudents,
      activeSessions,
      monthlyRevenue: monthlyRevenue._sum.amount ?? 0,
    });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
