import { describe, it, expect } from 'vitest';
import {
  PLAN_CATALOG,
  normalizePlanId,
  getPlanConfig,
  comparePlans,
  type EntitlementKey,
} from '@/lib/billing/plan-catalog';

describe('plan-catalog — source unique de vérité', () => {
  describe('PLAN_CATALOG structure', () => {
    it('contient exactement 3 plans', () => {
      expect(Object.keys(PLAN_CATALOG)).toHaveLength(3);
      expect(PLAN_CATALOG.FREE).toBeDefined();
      expect(PLAN_CATALOG.PREMIUM).toBeDefined();
      expect(PLAN_CATALOG.PRO).toBeDefined();
    });

    it('FREE a un prix de 0', () => {
      expect(PLAN_CATALOG.FREE.priceTnd).toBe(0);
    });

    it('PREMIUM coûte 99 TND/mois', () => {
      expect(PLAN_CATALOG.PREMIUM.priceTnd).toBe(99);
      expect(PLAN_CATALOG.PREMIUM.billingCycle).toBe('monthly');
    });

    it('PRO coûte 129 TND/mois', () => {
      expect(PLAN_CATALOG.PRO.priceTnd).toBe(129);
      expect(PLAN_CATALOG.PRO.billingCycle).toBe('monthly');
    });
  });

  describe('quotas FREE', () => {
    const free = PLAN_CATALOG.FREE.quotas;

    it('ORAL_SESSIONS limité à 1/mois', () => {
      expect(free.ORAL_SESSIONS).toEqual({ limit: 1, period: 'month' });
    });

    it('WRITTEN_CORRECTIONS limité à 2/mois', () => {
      expect(free.WRITTEN_CORRECTIONS).toEqual({ limit: 2, period: 'month' });
    });

    it('TUTOR_QUESTIONS limité à 3/jour', () => {
      expect(free.TUTOR_QUESTIONS).toEqual({ limit: 3, period: 'day' });
    });

    it('QUIZ_PER_DAY limité à 1/jour', () => {
      expect(free.QUIZ_PER_DAY).toEqual({ limit: 1, period: 'day' });
    });
  });

  describe('quotas PREMIUM', () => {
    const premium = PLAN_CATALOG.PREMIUM.quotas;

    it('ORAL_SESSIONS plus élevé que FREE', () => {
      const freeLimit = PLAN_CATALOG.FREE.quotas.ORAL_SESSIONS!.limit as number;
      const premiumLimit = premium.ORAL_SESSIONS!.limit as number;
      expect(premiumLimit).toBeGreaterThan(freeLimit);
    });

    it('a des quotas pour toutes les features', () => {
      expect(premium.ORAL_SESSIONS).toBeDefined();
      expect(premium.WRITTEN_CORRECTIONS).toBeDefined();
      expect(premium.TUTOR_QUESTIONS).toBeDefined();
      expect(premium.LLM_TOKENS).toBeDefined();
    });
  });

  describe('quotas PRO', () => {
    const pro = PLAN_CATALOG.PRO.quotas;

    it('ORAL_SESSIONS illimité', () => {
      expect(pro.ORAL_SESSIONS!.limit).toBe('unlimited');
    });

    it('WRITTEN_CORRECTIONS illimité', () => {
      expect(pro.WRITTEN_CORRECTIONS!.limit).toBe('unlimited');
    });

    it('TUTOR_QUESTIONS illimité', () => {
      expect(pro.TUTOR_QUESTIONS!.limit).toBe('unlimited');
    });
  });

  describe('flags par plan', () => {
    it('FREE n a pas accès au PDF oral', () => {
      expect(PLAN_CATALOG.FREE.flags.ORAL_PDF_REPORT).toBe(false);
    });

    it('PREMIUM a accès au PDF oral', () => {
      expect(PLAN_CATALOG.PREMIUM.flags.ORAL_PDF_REPORT).toBe(true);
    });

    it('PRO a accès à tout', () => {
      expect(PLAN_CATALOG.PRO.flags.ORAL_PDF_REPORT).toBe(true);
      expect(PLAN_CATALOG.PRO.flags.ORAL_REPORT_HISTORY).toBe(true);
      expect(PLAN_CATALOG.PRO.flags.GRAPH_RAG).toBe(true);
    });

    it('FREE n a pas de parcours adaptatif', () => {
      expect(PLAN_CATALOG.FREE.flags.ADAPTIVE_PARCOURS).toBe(false);
    });

    it('PREMIUM a le parcours adaptatif', () => {
      expect(PLAN_CATALOG.PREMIUM.flags.ADAPTIVE_PARCOURS).toBe(true);
    });
  });

  describe('normalizePlanId', () => {
    it('MONTHLY → PREMIUM', () => {
      expect(normalizePlanId('MONTHLY')).toBe('PREMIUM');
    });

    it('LIFETIME → PRO', () => {
      expect(normalizePlanId('LIFETIME')).toBe('PRO');
    });

    it('PREMIUM → PREMIUM', () => {
      expect(normalizePlanId('PREMIUM')).toBe('PREMIUM');
    });

    it('PRO → PRO', () => {
      expect(normalizePlanId('PRO')).toBe('PRO');
    });

    it('FREE → FREE', () => {
      expect(normalizePlanId('FREE')).toBe('FREE');
    });

    it('valeur inconnue → FREE', () => {
      expect(normalizePlanId('UNKNOWN')).toBe('FREE');
      expect(normalizePlanId('')).toBe('FREE');
    });
  });

  describe('getPlanConfig', () => {
    it('retourne le bon plan pour PREMIUM', () => {
      expect(getPlanConfig('PREMIUM').id).toBe('PREMIUM');
    });

    it('retourne le bon plan pour PRO', () => {
      expect(getPlanConfig('PRO').id).toBe('PRO');
    });

    it('retourne FREE pour un plan inconnu', () => {
      expect(getPlanConfig('BLABLA').id).toBe('FREE');
    });

    it('gère les noms legacy', () => {
      expect(getPlanConfig('MONTHLY').id).toBe('PREMIUM');
      expect(getPlanConfig('LIFETIME').id).toBe('PRO');
    });
  });

  describe('comparePlans', () => {
    it('FREE < PREMIUM', () => {
      expect(comparePlans('FREE', 'PREMIUM')).toBeLessThan(0);
    });

    it('PREMIUM < PRO', () => {
      expect(comparePlans('PREMIUM', 'PRO')).toBeLessThan(0);
    });

    it('PRO > FREE', () => {
      expect(comparePlans('PRO', 'FREE')).toBeGreaterThan(0);
    });

    it('PREMIUM = PREMIUM', () => {
      expect(comparePlans('PREMIUM', 'PREMIUM')).toBe(0);
    });
  });

  describe('cohérence inter-plans', () => {
    const features: EntitlementKey[] = ['ORAL_SESSIONS', 'WRITTEN_CORRECTIONS', 'TUTOR_QUESTIONS', 'LLM_TOKENS', 'RAG_SEARCH', 'QUIZ_PER_DAY'];

    it('chaque quota PREMIUM >= FREE', () => {
      for (const feature of features) {
        const freeEntry = PLAN_CATALOG.FREE.quotas[feature];
        const premiumEntry = PLAN_CATALOG.PREMIUM.quotas[feature];
        if (freeEntry && premiumEntry) {
          if (typeof premiumEntry.limit === 'number' && typeof freeEntry.limit === 'number') {
            expect(premiumEntry.limit).toBeGreaterThanOrEqual(freeEntry.limit);
          }
        }
      }
    });

    it('chaque quota PRO >= PREMIUM (ou unlimited)', () => {
      for (const feature of features) {
        const premiumEntry = PLAN_CATALOG.PREMIUM.quotas[feature];
        const proEntry = PLAN_CATALOG.PRO.quotas[feature];
        if (premiumEntry && proEntry) {
          if (proEntry.limit === 'unlimited') {
            expect(true).toBe(true); // unlimited est toujours >= tout
          } else if (typeof proEntry.limit === 'number' && typeof premiumEntry.limit === 'number') {
            expect(proEntry.limit).toBeGreaterThanOrEqual(premiumEntry.limit);
          }
        }
      }
    });
  });
});
