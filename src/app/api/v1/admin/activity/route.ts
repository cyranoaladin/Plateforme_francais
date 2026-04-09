import { NextResponse } from 'next/server';
import { requireUserRole } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/client';

/**
 * GET /api/v1/admin/activity
 * Platform activity: recent events, LLM costs, feature usage breakdown.
 */
export async function GET(request: Request) {
  const { auth, errorResponse } = await requireUserRole('admin');
  if (!auth || errorResponse) {
    return errorResponse;
  }

  try {
    const { searchParams } = new URL(request.url);
    const days = Math.min(90, Math.max(1, Number(searchParams.get('days') ?? '7')));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [
      recentEvents,
      featureBreakdown,
      typeBreakdown,
      llmCosts,
      llmTotals,
      dailyActiveByDay,
    ] = await Promise.all([
      // Last 50 events
      prisma.memoryEvent.findMany({
        where: { createdAt: { gte: since } },
        select: {
          id: true,
          userId: true,
          type: true,
          feature: true,
          createdAt: true,
          user: { select: { email: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),

      // Feature usage breakdown
      prisma.memoryEvent.groupBy({
        by: ['feature'],
        where: { createdAt: { gte: since } },
        _count: { feature: true },
        orderBy: { _count: { feature: 'desc' } },
        take: 15,
      }),

      // Type breakdown
      prisma.memoryEvent.groupBy({
        by: ['type'],
        where: { createdAt: { gte: since } },
        _count: { type: true },
        orderBy: { _count: { type: 'desc' } },
      }),

      // LLM costs by skill (last N days)
      prisma.llmCostLog.groupBy({
        by: ['skill'],
        where: { createdAt: { gte: since } },
        _sum: { costEurCents: true, inputTokens: true, outputTokens: true },
        _count: { id: true },
        orderBy: { _sum: { costEurCents: 'desc' } },
      }),

      // LLM totals
      prisma.llmCostLog.aggregate({
        where: { createdAt: { gte: since } },
        _sum: { costEurCents: true, inputTokens: true, outputTokens: true },
        _count: { id: true },
      }),

      // Daily active users for chart (group by day)
      prisma.$queryRawUnsafe<Array<{ day: string; count: bigint }>>(
        `SELECT DATE("createdAt") as day, COUNT(DISTINCT "userId") as count
         FROM "MemoryEvent"
         WHERE "createdAt" >= $1
         GROUP BY DATE("createdAt")
         ORDER BY day DESC
         LIMIT $2`,
        since,
        days,
      ),
    ]);

    return NextResponse.json({
      period: { days, since: since.toISOString() },
      recentEvents: recentEvents.map((e) => ({
        id: e.id,
        userId: e.userId,
        email: e.user.email,
        type: e.type,
        feature: e.feature,
        createdAt: e.createdAt,
      })),
      featureBreakdown: featureBreakdown.map((f) => ({
        feature: f.feature,
        count: f._count.feature,
      })),
      typeBreakdown: typeBreakdown.map((t) => ({
        type: t.type,
        count: t._count.type,
      })),
      llm: {
        bySkill: llmCosts.map((l) => ({
          skill: l.skill,
          calls: l._count.id,
          costCents: l._sum.costEurCents ?? 0,
          inputTokens: l._sum.inputTokens ?? 0,
          outputTokens: l._sum.outputTokens ?? 0,
        })),
        totals: {
          calls: llmTotals._count.id,
          costCents: llmTotals._sum.costEurCents ?? 0,
          inputTokens: llmTotals._sum.inputTokens ?? 0,
          outputTokens: llmTotals._sum.outputTokens ?? 0,
        },
      },
      dailyActive: dailyActiveByDay.map((d) => ({
        day: d.day,
        count: Number(d.count),
      })),
    });
  } catch {
    return NextResponse.json(
      { error: 'Erreur lors de la recuperation de l\'activite.' },
      { status: 500 },
    );
  }
}
