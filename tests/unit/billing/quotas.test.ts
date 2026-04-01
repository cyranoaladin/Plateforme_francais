import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getPeriodKey, buildPaywallMessage } from '@/lib/billing/quotas';
import { checkQuota, consumeQuota } from '@/lib/billing/usage';
import { getPlanConfig, PLAN_CATALOG } from '@/lib/billing/plan-catalog';

const redisMock = {
  ping: vi.fn(),
  eval: vi.fn(),
  get: vi.fn(),
};

vi.mock('@/lib/queue/correction-queue', () => ({
  getRedisClient: () => redisMock,
}));

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

describe('Billing Quotas V2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    redisMock.ping.mockResolvedValue('PONG');
    redisMock.eval.mockResolvedValue(1);
  });

  describe('PLAN_CATALOG quotas', () => {
    it('FREE has limited quotas', () => {
      expect(PLAN_CATALOG.FREE.quotas.ORAL_SESSIONS.limit).toBe(1);
      expect(PLAN_CATALOG.FREE.quotas.WRITTEN_CORRECTIONS.limit).toBe(2);
      expect(PLAN_CATALOG.FREE.quotas.TUTOR_QUESTIONS.limit).toBe(3);
      expect(PLAN_CATALOG.FREE.flags.ORAL_PDF_REPORT).toBe(false);
    });

    it('PRO has higher quotas', () => {
      expect(PLAN_CATALOG.PRO.quotas.ORAL_SESSIONS.limit).toBe('unlimited');
      expect(PLAN_CATALOG.PRO.flags.ORAL_PDF_REPORT).toBe(true);
    });

    it('MAX legacy alias resolves to Masterium quotas', () => {
      expect(getPlanConfig('MAX').quotas.ORAL_SESSIONS?.limit).toBe('unlimited');
      expect(getPlanConfig('MAX').quotas.LLM_TOKENS?.limit).toBe(200_000);
    });
  });

  describe('getPeriodKey', () => {
    it('generates correct day key', () => {
      const result = getPeriodKey('day', new Date('2026-03-08T10:00:00Z'));
      expect(result).toBe('2026-03-08');
    });

    it('generates correct week key', () => {
      const result = getPeriodKey('week', new Date('2026-03-15T10:00:00Z'));
      expect(result).toBe('2026-W11');
    });

    it('generates correct month key', () => {
      const result = getPeriodKey('month', new Date('2026-03-08T10:00:00Z'));
      expect(result).toBe('2026-03');
    });

    it('uses a month TTL that expires exactly at the next UTC month boundary', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-03-08T10:00:00Z'));

      await consumeQuota('user-1', 'WRITTEN_CORRECTIONS', { limit: 2, period: 'month' });

      expect(redisMock.eval).toHaveBeenCalledWith(
        expect.any(String),
        1,
        'quota:user-1:WRITTEN_CORRECTIONS:2026-03',
        '2',
        '1',
        String(2_037_600),
      );
    });
  });

  describe('checkQuota', () => {
    it('retourne immédiatement un refus si la limite vaut 0', async () => {
      const result = await checkQuota('user-1', 'OCR_COPIES', { limit: 0, period: 'month' });
      expect(result).toEqual({ allowed: false, current: 0, limit: 0, remaining: 0 });
      expect(redisMock.ping).not.toHaveBeenCalled();
    });
  });

  describe('buildPaywallMessage', () => {
    it('generates FREE plan paywall message', () => {
      const msg = buildPaywallMessage('FREE', 'ORAL_SESSIONS');
      expect(msg).toContain('1');
      expect(msg).toContain('Premium');
      expect(msg).toContain('mois');
    });

    it('generates PRO plan paywall message', () => {
      const msg = buildPaywallMessage('PRO', 'ORAL_SESSIONS');
      expect(msg).toContain('illimité');
      expect(msg).toContain('Masterium');
    });

    it('includes period info', () => {
      const daily = buildPaywallMessage('FREE', 'LLM_TOKENS');
      expect(daily).toContain('jour');
      const monthly = buildPaywallMessage('FREE', 'WRITTEN_CORRECTIONS');
      expect(monthly).toContain('mois');
    });

    it('uses an explicit not-included message when quota limit is zero', () => {
      const msg = buildPaywallMessage('FREE', 'OCR_COPIES');
      expect(msg).toContain("n'est pas incluse");
      expect(msg).toContain('Premium');
    });
  });
});
