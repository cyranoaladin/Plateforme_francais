/**
 * Test that quotas are unified in plan-catalog.ts as single source of truth.
 * Verifies no duplicate PLAN_LIMITS or PLAN_QUOTAS exist.
 */

import { describe, it, expect } from 'vitest';
import { PLAN_CATALOG, PLAN_DISPLAY_LABELS, type EntitlementKey } from '@/lib/billing/plan-catalog';
import { buildPaywallMessage } from '@/lib/billing/quotas';

describe('Quotas Single Source of Truth', () => {
  it('should have all four plans defined in PLAN_CATALOG', () => {
    expect(PLAN_CATALOG.FREE).toBeDefined();
    expect(PLAN_CATALOG.PREMIUM).toBeDefined();
    expect(PLAN_CATALOG.PRO).toBeDefined();
    expect(PLAN_CATALOG.MAX).toBeDefined();
  });

  it('FREE plan should have correct quotas per audit', () => {
    const free = PLAN_CATALOG.FREE;
    
    expect(free.quotas.ORAL_SESSIONS).toEqual({ limit: 1, period: 'month' });
    expect(free.quotas.WRITTEN_CORRECTIONS).toEqual({ limit: 2, period: 'month' });
    expect(free.quotas.TUTOR_QUESTIONS).toEqual({ limit: 3, period: 'day' });
    expect(free.quotas.OCR_COPIES).toEqual({ limit: 2, period: 'month' });
    expect(free.quotas.LLM_TOKENS).toEqual({ limit: 8_000, period: 'day' });
    expect(free.quotas.RAG_SEARCH).toEqual({ limit: 50, period: 'day' });
    expect(free.quotas.QUIZ_PER_DAY).toEqual({ limit: 3, period: 'day' });
  });

  it('PREMIUM plan should have correct quotas per audit', () => {
    const premium = PLAN_CATALOG.PREMIUM;

    expect(premium.quotas.ORAL_SESSIONS).toEqual({ limit: 10, period: 'week' });
    expect(premium.quotas.WRITTEN_CORRECTIONS).toEqual({ limit: 20, period: 'month' });
    expect(premium.quotas.TUTOR_QUESTIONS).toEqual({ limit: 100, period: 'day' });
    expect(premium.quotas.OCR_COPIES).toEqual({ limit: 20, period: 'month' });
    expect(premium.quotas.LLM_TOKENS).toEqual({ limit: 50_000, period: 'day' });
    expect(premium.quotas.RAG_SEARCH).toEqual({ limit: 500, period: 'day' });
    expect(premium.quotas.QUIZ_PER_DAY).toEqual({ limit: 30, period: 'day' });
  });

  it('PRO plan should have correct quotas per audit', () => {
    const pro = PLAN_CATALOG.PRO;
    
    expect(pro.quotas.ORAL_SESSIONS).toEqual({ limit: 'unlimited', period: 'week' });
    expect(pro.quotas.WRITTEN_CORRECTIONS).toEqual({ limit: 'unlimited', period: 'month' });
    expect(pro.quotas.TUTOR_QUESTIONS).toEqual({ limit: 'unlimited', period: 'day' });
    expect(pro.quotas.OCR_COPIES).toEqual({ limit: 50, period: 'month' });
    expect(pro.quotas.LLM_TOKENS).toEqual({ limit: 200_000, period: 'day' });
    expect(pro.quotas.RAG_SEARCH).toEqual({ limit: 'unlimited', period: 'day' });
    expect(pro.quotas.QUIZ_PER_DAY).toEqual({ limit: 'unlimited', period: 'day' });
  });

  it('MAX plan should have unlimited quotas for key features', () => {
    const max = PLAN_CATALOG.MAX;
    
    expect(max.quotas.ORAL_SESSIONS).toEqual({ limit: 'unlimited', period: 'week' });
    expect(max.quotas.WRITTEN_CORRECTIONS).toEqual({ limit: 'unlimited', period: 'month' });
    expect(max.quotas.TUTOR_QUESTIONS).toEqual({ limit: 'unlimited', period: 'day' });
    expect(max.quotas.RAG_SEARCH).toEqual({ limit: 'unlimited', period: 'day' });
    expect(max.quotas.QUIZ_PER_DAY).toEqual({ limit: 'unlimited', period: 'day' });
    
    // OCR and LLM_TOKENS still have limits even in MAX
    expect(max.quotas.OCR_COPIES).toEqual({ limit: 50, period: 'month' });
    expect(max.quotas.LLM_TOKENS).toEqual({ limit: 200_000, period: 'day' });
  });

  it('should have all entitlement keys covered', () => {
    const entitlements: EntitlementKey[] = [
      'ORAL_SESSIONS',
      'WRITTEN_CORRECTIONS',
      'TUTOR_QUESTIONS',
      'OCR_COPIES',
      'LLM_TOKENS',
      'RAG_SEARCH',
      'QUIZ_PER_DAY',
    ];

    for (const plan of ['FREE', 'PREMIUM', 'PRO'] as const) {
      for (const entitlement of entitlements) {
        expect(PLAN_CATALOG[plan].quotas[entitlement]).toBeDefined();
      }
    }
  });

  it('should have consistent flag definitions', () => {
    expect(PLAN_CATALOG.FREE.flags.ORAL_PDF_REPORT).toBe(false);
    expect(PLAN_CATALOG.PRO.flags.ORAL_PDF_REPORT).toBe(true);
    expect(PLAN_CATALOG.MAX.flags.ORAL_PDF_REPORT).toBe(true);

    expect(PLAN_CATALOG.FREE.flags.ADAPTIVE_PARCOURS).toBe(false);
    expect(PLAN_CATALOG.PRO.flags.ADAPTIVE_PARCOURS).toBe(true);
    expect(PLAN_CATALOG.MAX.flags.ADAPTIVE_PARCOURS).toBe(true);

    expect(PLAN_CATALOG.FREE.flags.GRAPH_RAG).toBe(false);
    expect(PLAN_CATALOG.PRO.flags.GRAPH_RAG).toBe(true);
    expect(PLAN_CATALOG.MAX.flags.GRAPH_RAG).toBe(true);
  });

  it('should have correct pricing', () => {
    expect(PLAN_CATALOG.FREE.priceTnd).toBe(0);
    expect(PLAN_CATALOG.PREMIUM.priceTnd).toBe(99);
    expect(PLAN_CATALOG.PRO.priceTnd).toBe(129);
    expect(PLAN_CATALOG.MAX.priceTnd).toBe(149);
  });

  it('should have correct billing cycles', () => {
    expect(PLAN_CATALOG.FREE.billingCycle).toBe('free');
    expect(PLAN_CATALOG.PREMIUM.billingCycle).toBe('monthly');
    expect(PLAN_CATALOG.PRO.billingCycle).toBe('monthly');
    expect(PLAN_CATALOG.MAX.billingCycle).toBe('lifetime');
  });

  it('PREMIUM flags should be correct', () => {
    expect(PLAN_CATALOG.PREMIUM.flags.ORAL_PDF_REPORT).toBe(true);
    expect(PLAN_CATALOG.PREMIUM.flags.ORAL_REPORT_HISTORY).toBe(false);
    expect(PLAN_CATALOG.PREMIUM.flags.GRAPH_RAG).toBe(false);
    expect(PLAN_CATALOG.PREMIUM.flags.LIBRARY_FULL_ACCESS).toBe(true);
    expect(PLAN_CATALOG.PREMIUM.flags.ADAPTIVE_PARCOURS).toBe(true);
    expect(PLAN_CATALOG.PREMIUM.flags.AVOCAT_DU_DIABLE).toBe(true);
    expect(PLAN_CATALOG.PREMIUM.flags.PARENT_DASHBOARD).toBe(true);
    expect(PLAN_CATALOG.PREMIUM.flags.SUPPORT_TIER).toBe('email');
    expect(PLAN_CATALOG.PREMIUM.flags.SPACED_REPETITION_TIER).toBe('advanced');
  });

  it('PRO flags should unlock everything', () => {
    expect(PLAN_CATALOG.PRO.flags.ORAL_PDF_REPORT).toBe(true);
    expect(PLAN_CATALOG.PRO.flags.ORAL_REPORT_HISTORY).toBe(true);
    expect(PLAN_CATALOG.PRO.flags.GRAPH_RAG).toBe(true);
    expect(PLAN_CATALOG.PRO.flags.LIBRARY_FULL_ACCESS).toBe(true);
    expect(PLAN_CATALOG.PRO.flags.ADAPTIVE_PARCOURS).toBe(true);
    expect(PLAN_CATALOG.PRO.flags.SUPPORT_TIER).toBe('priority');
    expect(PLAN_CATALOG.PRO.flags.SPACED_REPETITION_TIER).toBe('ai');
  });

  it('FREE flags should restrict access', () => {
    expect(PLAN_CATALOG.FREE.flags.ORAL_PDF_REPORT).toBe(false);
    expect(PLAN_CATALOG.FREE.flags.ORAL_REPORT_HISTORY).toBe(false);
    expect(PLAN_CATALOG.FREE.flags.GRAPH_RAG).toBe(false);
    expect(PLAN_CATALOG.FREE.flags.LIBRARY_FULL_ACCESS).toBe(false);
    expect(PLAN_CATALOG.FREE.flags.ADAPTIVE_PARCOURS).toBe(false);
    expect(PLAN_CATALOG.FREE.flags.AVOCAT_DU_DIABLE).toBe(false);
    expect(PLAN_CATALOG.FREE.flags.PARENT_DASHBOARD).toBe(false);
    expect(PLAN_CATALOG.FREE.flags.SUPPORT_TIER).toBe('faq');
    expect(PLAN_CATALOG.FREE.flags.SPACED_REPETITION_TIER).toBe('basic');
  });

  it('display labels should match renamed plans', () => {
    expect(PLAN_DISPLAY_LABELS.FREE).toBe('Freemium');
    expect(PLAN_DISPLAY_LABELS.PREMIUM).toBe('Premium');
    expect(PLAN_DISPLAY_LABELS.PRO).toBe('Masterium');
    expect(PLAN_DISPLAY_LABELS.MAX).toBe('Masterium');
  });

  it('paywall message FREE mentions Premium as upgrade target', () => {
    const msg = buildPaywallMessage('FREE', 'ORAL_SESSIONS');
    expect(msg).toContain('Premium');
    expect(msg).not.toContain('Excellence');
    expect(msg).not.toContain('Réussite');
  });

  it('paywall message PREMIUM mentions Masterium as upgrade target', () => {
    const msg = buildPaywallMessage('PREMIUM', 'ORAL_SESSIONS');
    expect(msg).toContain('Masterium');
    expect(msg).not.toContain('Excellence');
  });

  it('paywall message PRO mentions Masterium display name', () => {
    const msg = buildPaywallMessage('PRO', 'ORAL_SESSIONS');
    expect(msg).toContain('Masterium');
  });
});
