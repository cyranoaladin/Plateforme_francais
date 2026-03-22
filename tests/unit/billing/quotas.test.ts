import { describe, it, expect } from 'vitest';
import { getPeriodKey, buildPaywallMessage } from '@/lib/billing/quotas';
import { PLAN_CATALOG } from '@/lib/billing/plan-catalog';

describe('Billing Quotas V2', () => {
  describe('PLAN_CATALOG quotas', () => {
    it('FREE has limited quotas', () => {
      expect(PLAN_CATALOG.FREE.quotas.ORAL_SESSIONS.limit).toBe(2);
      expect(PLAN_CATALOG.FREE.quotas.WRITTEN_CORRECTIONS.limit).toBe(2);
      expect(PLAN_CATALOG.FREE.flags.ORAL_PDF_REPORT).toBe(false);
    });

    it('PRO has higher quotas', () => {
      expect(PLAN_CATALOG.PRO.quotas.ORAL_SESSIONS.limit).toBe('unlimited');
      expect(PLAN_CATALOG.PRO.flags.ORAL_PDF_REPORT).toBe(true);
    });

    it('MAX has unlimited quotas', () => {
      expect(PLAN_CATALOG.MAX.quotas.ORAL_SESSIONS.limit).toBe('unlimited');
      expect(PLAN_CATALOG.MAX.quotas.LLM_TOKENS.limit).toBe(200_000);
    });
  });

  describe('getPeriodKey', () => {
    it('generates correct day key', () => {
      const result = getPeriodKey('day', new Date('2026-03-08T10:00:00Z'));
      expect(result).toBe('2026-03-08');
    });

    it('generates correct week key', () => {
      const result = getPeriodKey('week', new Date('2026-03-15T10:00:00Z'));
      expect(result).toMatch(/2026-03-W\d/);
    });

    it('generates correct month key', () => {
      const result = getPeriodKey('month', new Date('2026-03-08T10:00:00Z'));
      expect(result).toBe('2026-03');
    });
  });

  describe('buildPaywallMessage', () => {
    it('generates FREE plan paywall message', () => {
      const msg = buildPaywallMessage('FREE', 'ORAL_SESSIONS');
      expect(msg).toContain('2');
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
  });
});
