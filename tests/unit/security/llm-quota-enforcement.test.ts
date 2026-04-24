/**
 * H5 TESTS: LLM Token Quota Enforcement (C2 Fix validation)
 *
 * Ces tests valident que les tokens LLM sont correctement consommés
 * et que les quotas sont respectés.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Redis } from 'ioredis';
import { consumeQuota, QuotaExceededError } from '@/lib/billing/usage';
import { getBillingContext } from '@/lib/billing/context';

// Mocks
vi.mock('@/lib/queue/correction-queue', () => ({
  getRedisClient: vi.fn(() => ({
    ping: vi.fn().mockResolvedValue('PONG'),
    eval: vi.fn().mockResolvedValue([1, 100]),
    decrby: vi.fn().mockResolvedValue(0),
  })),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('LLM Token Quota Enforcement', () => {
  const userId = 'test-user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should allow consumption within quota limit', async () => {
    const quotaEntry = { limit: 50_000, period: 'day' as const };

    const result = await consumeQuota(userId, 'LLM_TOKENS', quotaEntry, 1000);

    // consumeQuota returns { current, limit, remaining } — allowed is only on checkQuota
    expect(result.current).toBeGreaterThanOrEqual(0);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
  });

  it('should reject consumption over quota limit — Redis reports denied', async () => {
    const { getRedisClient } = await import('@/lib/queue/correction-queue');
    // Simulate Redis returning denied (count already at limit)
    vi.mocked(getRedisClient).mockReturnValueOnce({
      ping: vi.fn().mockResolvedValue('PONG'),
      eval: vi.fn().mockResolvedValue([0, 100]), // allowed=0 → denied
      decrby: vi.fn().mockResolvedValue(0),
    } as unknown as Redis);

    const quotaEntry = { limit: 100, period: 'day' as const };

    await expect(
      consumeQuota(userId, 'LLM_TOKENS', quotaEntry, 1)
    ).rejects.toThrow(QuotaExceededError);
  });

  it('should handle unlimited quota', async () => {
    const quotaEntry = { limit: 'unlimited' as const, period: 'day' as const };

    const result = await consumeQuota(userId, 'LLM_TOKENS', quotaEntry, 999999);

    expect(result.limit).toBe('unlimited');
    expect(result.remaining).toBe('unlimited');
  });

  it('should handle zero quota', async () => {
    const quotaEntry = { limit: 0, period: 'day' as const };

    await expect(
      consumeQuota(userId, 'LLM_TOKENS', quotaEntry, 1)
    ).rejects.toThrow(QuotaExceededError);
  });
});

describe('Billing Context', () => {
  it('should return FREE plan for user without subscription', async () => {
    const context = await getBillingContext('no-sub-user');

    expect(context.planId).toBe('FREE');
    expect(context.config.quotas.LLM_TOKENS!.limit).toBe(8_000);
  });

  it('should fall back to FREE plan when DB unavailable (test env)', async () => {
    // In NODE_ENV=test, DB errors fall back to FREE with isActive=true
    const context = await getBillingContext('any-user-no-db');

    expect(context.planId).toBe('FREE');
    expect(context.isActive).toBe(true);
  });
});
