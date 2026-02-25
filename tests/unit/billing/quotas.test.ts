import { describe, it, expect } from 'vitest';
import { checkQuota, getPeriodKey, buildPaywallMessage, PLAN_QUOTAS } from '@/lib/billing/quotas';

describe('Billing Quotas V2', () => {
  describe('PLAN_QUOTAS', () => {
    it('FREE has limited quotas', () => {
      expect(PLAN_QUOTAS.FREE.oral_sessions).toBe(3);
      expect(PLAN_QUOTAS.FREE.ecrit_corrections).toBe(5);
      expect(PLAN_QUOTAS.FREE.free_practice).toBe(false);
      expect(PLAN_QUOTAS.FREE.export_pdf).toBe(false);
    });

    it('PRO has higher quotas', () => {
      expect(PLAN_QUOTAS.PRO.oral_sessions).toBe(30);
      expect(PLAN_QUOTAS.PRO.free_practice).toBe(true);
      expect(PLAN_QUOTAS.PRO.export_pdf).toBe(true);
    });

    it('MAX has unlimited quotas (-1)', () => {
      expect(PLAN_QUOTAS.MAX.oral_sessions).toBe(-1);
      expect(PLAN_QUOTAS.MAX.llm_requests_daily).toBe(-1);
    });
  });

  describe('checkQuota', () => {
    it('allows when under limit', () => {
      const result = checkQuota('FREE', 'oral_sessions', 1);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
      expect(result.limit).toBe(3);
    });

    it('blocks when at limit', () => {
      const result = checkQuota('FREE', 'oral_sessions', 3);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('blocks when over limit', () => {
      const result = checkQuota('FREE', 'oral_sessions', 10);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('always allows for unlimited (-1) plans', () => {
      const result = checkQuota('MAX', 'oral_sessions', 9999);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(-1);
      expect(result.limit).toBe(-1);
    });

    it('falls back to FREE for unknown plan', () => {
      const result = checkQuota('UNKNOWN' as never, 'oral_sessions', 0);
      expect(result.limit).toBe(3);
    });
  });

  describe('getPeriodKey', () => {
    it('returns monthly key for non-daily features', () => {
      const date = new Date('2025-06-15T10:00:00Z');
      expect(getPeriodKey('oral_sessions', date)).toBe('2025-06');
      expect(getPeriodKey('ecrit_corrections', date)).toBe('2025-06');
    });

    it('returns daily key for daily features', () => {
      const date = new Date('2025-06-15T10:00:00Z');
      expect(getPeriodKey('llm_requests_daily', date)).toBe('2025-06-15');
      expect(getPeriodKey('rag_queries_daily', date)).toBe('2025-06-15');
    });
  });

  describe('buildPaywallMessage', () => {
    it('generates FREE plan paywall message', () => {
      const msg = buildPaywallMessage('FREE', 'oral_sessions');
      expect(msg).toContain('3');
      expect(msg).toContain('Pro');
    });

    it('generates PRO plan paywall message', () => {
      const msg = buildPaywallMessage('PRO', 'oral_sessions');
      expect(msg).toContain('30');
      expect(msg).toContain('Max');
    });

    it('includes daily/monthly period info', () => {
      const daily = buildPaywallMessage('FREE', 'llm_requests_daily');
      expect(daily).toContain('jour');
      const monthly = buildPaywallMessage('FREE', 'oral_sessions');
      expect(monthly).toContain('mois');
    });
  });
});
