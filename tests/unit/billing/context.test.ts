import { beforeEach, describe, expect, it, vi } from 'vitest';

const prismaMock = {
  user: {
    findUnique: vi.fn(),
  },
};

vi.mock('@/lib/db/client', () => ({
  prisma: prismaMock,
}));

describe('getBillingContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it('returns inactive FREE when the subscription table is missing outside test env', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    prismaMock.user.findUnique.mockRejectedValue(Object.assign(new Error('missing table'), { code: 'P2021' }));

    const { getBillingContext } = await import('@/lib/billing/context');
    const context = await getBillingContext('user-1');

    expect(context.planId).toBe('FREE');
    expect(context.isActive).toBe(false);
  });

  it('returns active FREE in test env when billing tables are unavailable', async () => {
    vi.stubEnv('NODE_ENV', 'test');
    prismaMock.user.findUnique.mockRejectedValue(Object.assign(new Error('missing table'), { code: 'P2021' }));

    const { getBillingContext } = await import('@/lib/billing/context');
    const context = await getBillingContext('user-1');

    expect(context.planId).toBe('FREE');
    expect(context.isActive).toBe(true);
  });

  it('loads user and subscription in a single query path', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    prismaMock.user.findUnique.mockResolvedValue({
      createdAt: new Date('2026-03-31T00:00:00Z'),
      subscription: null,
    });

    const { getBillingContext } = await import('@/lib/billing/context');
    await getBillingContext('user-1');

    expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(1);
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        select: expect.objectContaining({
          createdAt: true,
          subscription: expect.any(Object),
        }),
      }),
    );
  });
});
