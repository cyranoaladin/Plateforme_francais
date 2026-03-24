import { NextResponse } from 'next/server';
import { requireUserRole } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/client';
import { countAdminVisiblePlans, toAdminVisibleSubscription } from '@/lib/admin/plan-visibility';

export async function GET() {
  const { auth, errorResponse } = await requireUserRole('admin');
  if (!auth || errorResponse) {
    return errorResponse;
  }

  try {
    const [
      users,
      pendingPayments,
      totalRevenue,
      recentPayments,
    ] = await Promise.all([
      prisma.user.findMany({
        select: {
          subscription: {
            select: {
              plan: true,
              status: true,
              currentPeriodStart: true,
              currentPeriodEnd: true,
            },
          },
        },
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

    const visibleSubscriptions = users.map((user) => toAdminVisibleSubscription(user.subscription));
    const subscriptionsByPlan = countAdminVisiblePlans(users.map((user) => user.subscription));
    const activeSubscriptions = visibleSubscriptions.filter((subscription) =>
      subscription.status === 'ACTIVE' && subscription.plan !== 'FREEMIUM',
    ).length;

    return NextResponse.json(
      {
        stats: {
          totalUsers: users.length,
          activeSubscriptions,
          pendingPayments,
          totalRevenueTND: (totalRevenue._sum.amountMillimes || 0) / 1000,
          subscriptionsByPlan,
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
