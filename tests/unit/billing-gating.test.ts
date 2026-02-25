import { beforeEach, describe, expect, it, vi } from 'vitest';

type Plan = 'FREE' | 'MONTHLY' | 'LIFETIME';

let currentPlan: Plan = 'FREE';
let currentUsage = 0;

vi.mock('@/lib/db/client', () => {
  return {
    prisma: {
      subscription: {
        findUnique: vi.fn(async () => (currentPlan === 'FREE' ? null : { plan: currentPlan })),
      },
      usageCounter: {
        findUnique: vi.fn(async () =>
          currentUsage > 0
            ? {
                count: currentUsage,
              }
            : null,
        ),
        upsert: vi.fn(async () => undefined),
      },
    },
  };
});

describe('billing-gating', () => {
  beforeEach(() => {
    currentPlan = 'FREE';
    currentUsage = 0;
    vi.resetModules();
  });

  it('blocks feature not available in FREE plan', async () => {
    const { requirePlan } = await import('@/lib/billing/gating');
    const result = await requirePlan('u-free', 'avocatDuDiable');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('feature_not_in_plan');
  });

  it('allows paid feature in MONTHLY plan', async () => {
    currentPlan = 'MONTHLY';
    const { requirePlan } = await import('@/lib/billing/gating');
    const result = await requirePlan('u-monthly', 'avocatDuDiable');
    expect(result.allowed).toBe(true);
  });

  it('blocks when FREE daily quota is exceeded', async () => {
    currentPlan = 'FREE';
    currentUsage = 10;
    const { requirePlan } = await import('@/lib/billing/gating');
    const result = await requirePlan('u-free', 'tuteurMessagesPerDay');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('quota_exceeded');
  });
});
