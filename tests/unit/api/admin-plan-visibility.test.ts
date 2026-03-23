import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/guard', () => ({
  requireUserRole: vi.fn(),
}));

vi.mock('@/lib/db/client', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
    },
    paymentTransaction: {
      count: vi.fn(),
      aggregate: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

import { requireUserRole } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/client';

describe('admin plan visibility routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireUserRole).mockResolvedValue({
      auth: { user: { id: 'admin-1', role: 'admin', profile: {} } },
      errorResponse: null,
    } as never);
  });

  it('returns Freemium for users without a subscription row', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      {
        id: 'user-free',
        email: 'free@test.dev',
        role: 'eleve',
        createdAt: new Date('2026-03-23T10:00:00.000Z'),
        subscription: null,
        profile: {
          globalLevel: 'INSUFFISANT',
          classLevel: 'Première générale',
          voie: 'GENERALE',
        },
        payments: [],
      },
    ] as never);

    const { GET } = await import('@/app/api/v1/admin/users/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.users[0].subscription).toEqual({
      plan: 'FREE',
      status: 'ACTIVE',
      currentPeriodStart: null,
      currentPeriodEnd: null,
    });
  });

  it('counts plan distribution with Freemium fallback and hides MAX as Masterium', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { subscription: null },
      {
        subscription: {
          plan: 'PREMIUM',
          status: 'ACTIVE',
          currentPeriodStart: new Date('2026-03-01T00:00:00.000Z'),
          currentPeriodEnd: new Date('2026-04-01T00:00:00.000Z'),
        },
      },
      {
        subscription: {
          plan: 'MAX',
          status: 'ACTIVE',
          currentPeriodStart: new Date('2026-03-01T00:00:00.000Z'),
          currentPeriodEnd: new Date('2026-04-01T00:00:00.000Z'),
        },
      },
    ] as never);
    vi.mocked(prisma.paymentTransaction.count).mockResolvedValue(0 as never);
    vi.mocked(prisma.paymentTransaction.aggregate).mockResolvedValue({
      _sum: { amountMillimes: 0 },
    } as never);
    vi.mocked(prisma.paymentTransaction.findMany).mockResolvedValue([] as never);

    const { GET } = await import('@/app/api/v1/admin/stats/route');
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.stats.totalUsers).toBe(3);
    expect(body.stats.activeSubscriptions).toBe(2);
    expect(body.stats.subscriptionsByPlan).toEqual([
      { plan: 'FREE', count: 1 },
      { plan: 'PREMIUM', count: 1 },
      { plan: 'PRO', count: 1 },
    ]);
  });
});
