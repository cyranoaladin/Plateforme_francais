import { NextResponse } from 'next/server';
import { requireUserRole } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/client';

export async function GET() {
  const { auth, errorResponse } = await requireUserRole('admin');
  if (!auth || errorResponse) {
    return errorResponse;
  }

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      revenueThisMonth,
      revenueLastMonth,
      revenueTotal,
      planCounts,
      totalUsers,
      pendingOrders,
      pendingRevenue,
      dailyActiveUsers,
      weeklyActiveUsers,
      sessionsThisWeek,
    ] = await Promise.all([
      // Revenue this month
      prisma.paymentTransaction.aggregate({
        where: {
          status: 'ACCEPTED',
          createdAt: { gte: startOfMonth },
        },
        _sum: { amountMillimes: true },
      }),

      // Revenue last month
      prisma.paymentTransaction.aggregate({
        where: {
          status: 'ACCEPTED',
          createdAt: { gte: startOfLastMonth, lt: startOfMonth },
        },
        _sum: { amountMillimes: true },
      }),

      // Revenue total
      prisma.paymentTransaction.aggregate({
        where: { status: 'ACCEPTED' },
        _sum: { amountMillimes: true },
      }),

      // Subscription plan counts
      prisma.subscription.groupBy({
        by: ['plan'],
        _count: { plan: true },
      }),

      // Total users
      prisma.user.count(),

      // Pending orders count
      prisma.paymentTransaction.count({
        where: { status: 'PENDING' },
      }),

      // Pending revenue
      prisma.paymentTransaction.aggregate({
        where: { status: 'PENDING' },
        _sum: { amountMillimes: true },
      }),

      // Daily active users (distinct users with MemoryEvent in last 24h)
      prisma.memoryEvent.findMany({
        where: { createdAt: { gte: oneDayAgo } },
        select: { userId: true },
        distinct: ['userId'],
      }),

      // Weekly active users (distinct users with MemoryEvent in last 7 days)
      prisma.memoryEvent.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { userId: true },
        distinct: ['userId'],
      }),

      // Sessions this week (MemoryEvent where type='interaction' last 7 days)
      prisma.memoryEvent.count({
        where: {
          type: 'interaction',
          createdAt: { gte: sevenDaysAgo },
        },
      }),
    ]);

    // Build plan counts from groupBy results
    const planMap: Record<string, number> = {};
    for (const row of planCounts) {
      planMap[row.plan] = row._count.plan;
    }

    const free = planMap['FREE'] ?? 0;
    const premium = planMap['PREMIUM'] ?? 0;
    const pro = planMap['PRO'] ?? 0;

    // Users without a subscription are considered free
    const usersWithSubscription = free + premium + pro;
    const freeTotal = free + (totalUsers - usersWithSubscription);

    const subscriberTotal = freeTotal + premium + pro;
    const conversionRate = subscriberTotal > 0
      ? Math.round(((premium + pro) / subscriberTotal) * 1000) / 10
      : 0;

    return NextResponse.json(
      {
        revenue: {
          thisMonth: (revenueThisMonth._sum.amountMillimes ?? 0) / 1000,
          lastMonth: (revenueLastMonth._sum.amountMillimes ?? 0) / 1000,
          total: (revenueTotal._sum.amountMillimes ?? 0) / 1000,
        },
        subscribers: {
          freemium: freeTotal,
          premium,
          masterium: pro,
          total: subscriberTotal,
        },
        pipeline: {
          pendingOrders,
          pendingRevenue: (pendingRevenue._sum.amountMillimes ?? 0) / 1000,
        },
        activity: {
          dailyActiveUsers: dailyActiveUsers.length,
          weeklyActiveUsers: weeklyActiveUsers.length,
          sessionsThisWeek,
        },
        conversion: {
          rate: conversionRate,
        },
      },
      { status: 200 },
    );
  } catch {
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des métriques.' },
      { status: 500 },
    );
  }
}
