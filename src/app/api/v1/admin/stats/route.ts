import { NextResponse } from 'next/server';
import { requireUserRole } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/client';

export async function GET() {
  const { auth, errorResponse } = await requireUserRole('admin');
  if (!auth || errorResponse) {
    return errorResponse;
  }

  try {
    const [
      totalUsers,
      activeSubscriptions,
      pendingPayments,
      totalRevenue,
      subscriptionsByPlan,
      recentPayments,
    ] = await Promise.all([
      // Total utilisateurs
      prisma.user.count(),

      // Subscriptions actives
      prisma.subscription.count({
        where: { status: 'ACTIVE', plan: { not: 'FREE' } },
      }),

      // Paiements en attente
      prisma.paymentTransaction.count({
        where: { status: 'PENDING' },
      }),

      // Revenu total (en millimes)
      prisma.paymentTransaction.aggregate({
        where: { status: 'ACCEPTED' },
        _sum: { amountMillimes: true },
      }),

      // Répartition par plan
      prisma.subscription.groupBy({
        by: ['plan'],
        _count: { plan: true },
      }),

      // Derniers paiements
      prisma.paymentTransaction.findMany({
        select: {
          id: true,
          userId: true,
          status: true,
          plan: true,
          amountMillimes: true,
          orderRef: true,
          createdAt: true,
          user: {
            select: {
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return NextResponse.json(
      {
        stats: {
          totalUsers,
          activeSubscriptions,
          pendingPayments,
          totalRevenueTND: (totalRevenue._sum.amountMillimes || 0) / 1000,
          subscriptionsByPlan: subscriptionsByPlan.map((s) => ({
            plan: s.plan,
            count: s._count.plan,
          })),
        },
        recentPayments,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques.' },
      { status: 500 }
    );
  }
}
