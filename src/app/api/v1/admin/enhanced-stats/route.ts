import { NextResponse } from 'next/server';
import { requireUserRole } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';
import { countAdminVisiblePlans, toAdminVisibleSubscription } from '@/lib/admin/plan-visibility';
import { normalizePlanId } from '@nexus-eaf/shared-billing';

export async function GET() {
  const { auth, errorResponse } = await requireUserRole('admin');
  if (!auth || errorResponse) {
    return errorResponse;
  }

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [
      users,
      pendingPayments,
      totalRevenue,
      recentPayments,
      newUsersThisMonth,
      lastMonthUsers,
      churnedUsers,
      activeSubscriptionsData,
    ] = await Promise.all([
      // All users with subscription data
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          createdAt: true,
          subscription: {
            select: {
              plan: true,
              status: true,
              currentPeriodStart: true,
              currentPeriodEnd: true,
            },
          },
          profile: {
            select: {
              displayName: true,
              globalLevel: true,
              classLevel: true,
              voie: true,
            },
          },
        },
      }),

      // Pending payments
      prisma.paymentTransaction.count({
        where: { status: 'PENDING' },
      }),

      // Total revenue
      prisma.paymentTransaction.aggregate({
        where: { status: 'ACCEPTED' },
        _sum: { amountMillimes: true },
      }),

      // Recent payments
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

      // New users this month
      prisma.user.count({
        where: {
          createdAt: {
            gte: startOfMonth,
          },
        },
      }),

      // Users from last month (for churn calculation)
      prisma.user.count({
        where: {
          createdAt: {
            lt: startOfMonth,
          },
        },
      }),

      // Churned users (cancelled subscription this month)
      prisma.subscription.count({
        where: {
          status: 'CANCELED',
          updatedAt: {
            gte: startOfMonth,
          },
        },
      }),

      // Active subscriptions for MRR calculation
      prisma.subscription.findMany({
        where: {
          status: 'ACTIVE',
        },
        select: {
          plan: true,
        },
      }),
    ]);

    // Calculate metrics
    const visibleSubscriptions = users.map((user) => toAdminVisibleSubscription(user.subscription));
    const subscriptionsByPlan = countAdminVisiblePlans(users.map((user) => user.subscription));
    const activeSubscriptions = visibleSubscriptions.filter((subscription) =>
      subscription.status === 'ACTIVE' && subscription.plan !== 'FREEMIUM',
    ).length;

    // Calculate churn rate
    const churnRate = lastMonthUsers > 0 ? churnedUsers / lastMonthUsers : 0;

    // Calculate MRR (Monthly Recurring Revenue)
    const planPricing = {
      PREMIUM: 99, // TND
      PRO: 129, // TND
    };

    const mrr = activeSubscriptionsData.reduce((total, sub) => {
      const normalizedPlan = normalizePlanId(sub.plan);
      return total + (planPricing[normalizedPlan as keyof typeof planPricing] || 0);
    }, 0);

    const arr = mrr * 12;

    const averageRevenuePerUser = users.length > 0 ? (totalRevenue._sum.amountMillimes || 0) / 1000 / users.length : 0;

    // Mock top features (would be calculated from actual usage data)
    const topFeatures = [
      { feature: 'Sessions orales', usage: 1247 },
      { feature: 'Corrections écrites', usage: 892 },
      { feature: 'Questions tuteur IA', usage: 756 },
      { feature: 'Recherches RAG', usage: 534 },
      { feature: 'Quiz interactifs', usage: 423 },
    ];

    return NextResponse.json(
      {
        stats: {
          totalUsers: users.length,
          activeSubscriptions,
          pendingPayments,
          totalRevenueTND: (totalRevenue._sum.amountMillimes || 0) / 1000,
          subscriptionsByPlan,
          newUsersThisMonth,
          churnRate,
          mrr,
          arr,
          averageRevenuePerUser,
          topFeatures,
        },
        recentPayments,
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error({ error }, 'admin.enhanced-stats.failed');
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des statistiques avancées.' },
      { status: 500 }
    );
  }
}
