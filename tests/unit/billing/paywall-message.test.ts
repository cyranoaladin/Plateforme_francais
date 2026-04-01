/**
 * Regression tests for buildPaywallMessage — ensures plan-specific messages
 * are correct and no cross-plan contradictions exist.
 */
import { describe, expect, it } from 'vitest';
import { buildPaywallMessage } from '@/lib/billing/quotas';
import { PLAN_CATALOG } from '@/lib/billing/plan-catalog';

describe('buildPaywallMessage', () => {
  it('FREE plan suggests upgrading to Premium', () => {
    const msg = buildPaywallMessage('FREE', 'ORAL_SESSIONS');
    expect(msg).toContain('Freemium');
    expect(msg).toContain('Passe à Premium');
    expect(msg).not.toContain('Masterium');
  });

  it('PREMIUM plan suggests upgrading to Masterium', () => {
    const msg = buildPaywallMessage('PREMIUM', 'ORAL_SESSIONS');
    expect(msg).toContain('Premium');
    expect(msg).toContain('Passe à Masterium');
  });

  it('PRO (Masterium) does NOT suggest upgrading to Masterium', () => {
    const msg = buildPaywallMessage('PRO', 'OCR_COPIES');
    expect(msg).toContain('Masterium');
    expect(msg).not.toContain('Passe à Masterium');
    expect(msg).not.toContain('réinitialise');
  });

  it('ne doit jamais afficher "quota se réinitialise" pour un plan illimité', () => {
    const previous = PLAN_CATALOG.PRO.quotas.LLM_TOKENS;
    PLAN_CATALOG.PRO.quotas.LLM_TOKENS = { limit: 'unlimited', period: 'day' };

    try {
      const msg = buildPaywallMessage('PRO', 'LLM_TOKENS');
      expect(msg).not.toContain('réinitialise');
      expect(msg).toContain('problème technique');
    } finally {
      PLAN_CATALOG.PRO.quotas.LLM_TOKENS = previous;
    }
  });

  it('includes quota limit and period for all plans', () => {
    const entitlements = {
      FREE: 'TUTOR_QUESTIONS',
      PREMIUM: 'TUTOR_QUESTIONS',
      PRO: 'OCR_COPIES',
    } as const;

    for (const planId of ['FREE', 'PREMIUM', 'PRO'] as const) {
      const msg = buildPaywallMessage(planId, entitlements[planId]);
      expect(msg).toMatch(/par (jour|semaine|mois)/);
    }
  });
});
