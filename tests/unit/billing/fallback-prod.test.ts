import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QuotaExceededError } from '@/lib/billing/usage';

/**
 * Tests garde-fous : vérifier comportement fail-closed en production
 * pour les quotas billing lorsque Redis est indisponible.
 *
 * Objectif : documenter et protéger le hardening récent contre régression.
 * Scope : Lot 1-A / F-012
 */

const mockRedisClient = {
  ping: vi.fn(),
  get: vi.fn(),
  eval: vi.fn(),
};

vi.mock('@/lib/queue/correction-queue', () => ({
  getRedisClient: () => mockRedisClient,
}));

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

describe('Billing Quotas - Fallback prod fail-closed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    mockRedisClient.ping.mockResolvedValue('PONG');
    mockRedisClient.eval.mockResolvedValue(1);
  });

  describe('consumeQuota en production', () => {
    it('fail-closed si Redis ping échoue (production)', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      mockRedisClient.ping.mockRejectedValueOnce(new Error('Redis unavailable'));

      const { consumeQuota } = await import('@/lib/billing/usage');

      await expect(
        consumeQuota('user-1', 'ORAL_SESSIONS', { limit: 5, period: 'week' }),
      ).rejects.toThrow(QuotaExceededError);
    });

    it('fail-closed si Redis eval échoue (production)', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      mockRedisClient.ping.mockResolvedValueOnce('PONG');
      mockRedisClient.eval.mockRejectedValueOnce(new Error('Redis write error'));

      const { consumeQuota } = await import('@/lib/billing/usage');

      await expect(
        consumeQuota('user-1', 'WRITTEN_CORRECTIONS', { limit: 2, period: 'month' }),
      ).rejects.toThrow(QuotaExceededError);
    });

    it('permet fallback en dev si Redis indisponible', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      mockRedisClient.ping.mockRejectedValueOnce(new Error('Redis down'));

      const { consumeQuota } = await import('@/lib/billing/usage');

      const result = await consumeQuota('user-1', 'ORAL_SESSIONS', {
        limit: 5,
        period: 'week',
      });

      expect(result.allowed).not.toBe(false);
      expect(result.remaining).toBe(5);
    });

    it('passe normalement si Redis disponible (production)', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      mockRedisClient.ping.mockResolvedValueOnce('PONG');
      mockRedisClient.eval.mockResolvedValueOnce(1);

      const { consumeQuota } = await import('@/lib/billing/usage');

      const result = await consumeQuota('user-1', 'ORAL_SESSIONS', {
        limit: 5,
        period: 'week',
      });

      expect(result.current).toBe(1);
      expect(result.limit).toBe(5);
      expect(result.remaining).toBe(4);
    });
  });

  describe('checkQuota en production', () => {
    it('fail-closed retourne allowed=false si Redis échoue (production)', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      mockRedisClient.ping.mockRejectedValueOnce(new Error('Redis unavailable'));

      const { checkQuota } = await import('@/lib/billing/usage');

      const result = await checkQuota('user-1', 'LLM_TOKENS', {
        limit: 100_000,
        period: 'month',
      });

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('fail-open permet fallback en dev si Redis échoue', async () => {
      vi.stubEnv('NODE_ENV', 'development');
      mockRedisClient.ping.mockRejectedValueOnce(new Error('Redis down'));

      const { checkQuota } = await import('@/lib/billing/usage');

      const result = await checkQuota('user-1', 'LLM_TOKENS', {
        limit: 100_000,
        period: 'month',
      });

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(100_000);
    });
  });
});
