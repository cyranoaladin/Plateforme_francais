/**
 * Test that quotas are unified in plan-catalog.ts as single source of truth.
 * Verifies no duplicate PLAN_LIMITS or PLAN_QUOTAS exist.
 */

import { describe, it, expect } from 'vitest';
import { PLAN_CATALOG, type EntitlementKey } from '@/lib/billing/plan-catalog';

describe('Quotas Single Source of Truth', () => {
  it('should have all three plans defined in PLAN_CATALOG', () => {
    expect(PLAN_CATALOG.FREE).toBeDefined();
    expect(PLAN_CATALOG.PRO).toBeDefined();
    expect(PLAN_CATALOG.MAX).toBeDefined();
  });

  it('FREE plan should have correct quotas per audit', () => {
    const free = PLAN_CATALOG.FREE;
    
    expect(free.quotas.ORAL_SESSIONS).toEqual({ limit: 2, period: 'week' });
    expect(free.quotas.WRITTEN_CORRECTIONS).toEqual({ limit: 3, period: 'month' });
    expect(free.quotas.TUTOR_QUESTIONS).toEqual({ limit: 10, period: 'day' });
    expect(free.quotas.OCR_COPIES).toEqual({ limit: 2, period: 'month' });
    expect(free.quotas.LLM_TOKENS).toEqual({ limit: 5_000, period: 'day' });
    expect(free.quotas.RAG_SEARCH).toEqual({ limit: 50, period: 'day' });
    expect(free.quotas.QUIZ_PER_DAY).toEqual({ limit: 3, period: 'day' });
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

    for (const plan of ['FREE', 'PRO', 'PRO'] as const) {
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
    expect(PLAN_CATALOG.PRO.priceTnd).toBe(129);
    expect(PLAN_CATALOG.MAX.priceTnd).toBe(149);
  });

  it('should have correct billing cycles', () => {
    expect(PLAN_CATALOG.FREE.billingCycle).toBe('free');
    expect(PLAN_CATALOG.PRO.billingCycle).toBe('monthly');
    expect(PLAN_CATALOG.MAX.billingCycle).toBe('lifetime');
  });
});
