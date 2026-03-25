/**
 * Regression tests for buildPaywallMessage — ensures plan-specific messages
 * are correct and no cross-plan contradictions exist.
 */
import { describe, expect, it } from 'vitest';
import { buildPaywallMessage } from '@/lib/billing/quotas';

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
    expect(msg).toContain('réinitialise');
  });

  it('PRO message mentions quota reset, not upgrade', () => {
    const msg = buildPaywallMessage('PRO', 'LLM_TOKENS');
    expect(msg).toMatch(/réinitialise à la prochaine période/);
  });

  it('includes quota limit and period for all plans', () => {
    for (const planId of ['FREE', 'PREMIUM', 'PRO'] as const) {
      const msg = buildPaywallMessage(planId, 'TUTOR_QUESTIONS');
      expect(msg).toMatch(/par (jour|semaine|mois)/);
    }
  });
});
