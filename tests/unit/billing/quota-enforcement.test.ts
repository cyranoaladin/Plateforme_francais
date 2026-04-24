import { describe, it, expect } from 'vitest';
import { PLAN_CATALOG, normalizePlanId } from '@nexus-eaf/shared-billing';

describe('Quotas par plan', () => {
  it('FREE : QUIZ_PER_DAY = 3', () => {
    expect(PLAN_CATALOG.FREE.quotas.QUIZ_PER_DAY!.limit).toBe(3);
  });

  it('FREE : OCR_COPIES = 0 (Freemium ne peut pas corriger)', () => {
    expect(PLAN_CATALOG.FREE.quotas.OCR_COPIES!.limit).toBe(0);
  });

  it('PREMIUM > FREE pour tous les quotas', () => {
    const freeQuotas = PLAN_CATALOG.FREE.quotas;
    const premiumQuotas = PLAN_CATALOG.PREMIUM.quotas;
    for (const key of Object.keys(freeQuotas) as Array<keyof typeof freeQuotas>) {
      expect(premiumQuotas[key]!.limit as number).toBeGreaterThanOrEqual(freeQuotas[key]!.limit as number);
    }
  });

  it('normalizePlanId convertit les anciens plans', () => {
    expect(normalizePlanId('MONTHLY')).toBe('PREMIUM');
    expect(normalizePlanId('LIFETIME')).toBe('PRO');
    expect(normalizePlanId('MAX')).toBe('PRO');
    expect(normalizePlanId('FREE')).toBe('FREE');
  });
});
