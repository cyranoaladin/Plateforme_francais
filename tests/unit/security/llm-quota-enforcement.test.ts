/**
 * H5 TESTS: LLM Token Quota Enforcement (C2 Fix validation)
 * 
 * Ces tests valident que les tokens LLM sont correctement consommés
 * et que les quotas sont respectés.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { consumeQuota, checkQuota, QuotaExceededError } from '@/lib/billing/usage';
import { getBillingContext } from '@/lib/billing/context';
import { PLAN_CATALOG } from '@/lib/billing/plan-catalog';

// Mocks
vi.mock('@/lib/queue/correction-queue', () => ({
  getRedisClient: () => ({
    ping: vi.fn().mockResolvedValue('PONG'),
    eval: vi.fn().mockResolvedValue([1, 100]),
    decrby: vi.fn().mockResolvedValue(0),
  }),
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
    
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThan(0);
  });

  it('should reject consumption over quota limit', async () => {
    const quotaEntry = { limit: 100, period: 'day' as const };
    
    // Consume all quota first
    await consumeQuota(userId, 'LLM_TOKENS', quotaEntry, 100);
    
    // Try to consume more
    await expect(
      consumeQuota(userId, 'LLM_TOKENS', quotaEntry, 1)
    ).rejects.toThrow(QuotaExceededError);
  });

  it('should handle unlimited quota', async () => {
    const quotaEntry = { limit: 'unlimited' as const, period: 'day' as const };
    
    const result = await consumeQuota(userId, 'LLM_TOKENS', quotaEntry, 999999);
    
    expect(result.allowed).toBe(true);
    expect(result.limit).toBe('unlimited');
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
    expect(context.config.quotas.LLM_TOKENS.limit).toBe(8_000);
  });

  it('should check subscription expiration correctly', async () => {
    // User with expired subscription should fallback to FREE
    const context = await getBillingContext('expired-sub-user');
    
    expect(context.isActive).toBe(false);
    expect(context.planId).toBe('FREE');
  });
});
