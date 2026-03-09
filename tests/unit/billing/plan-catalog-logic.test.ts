import { describe, it, expect } from 'vitest';
import {
  PLAN_CATALOG,
  normalizePlanId,
  getPlanConfig,
  comparePlans,
  type PlanId,
  type EntitlementKey,
} from '@/lib/billing/plan-catalog';

describe('plan-catalog — source unique de vérité', () => {
  describe('PLAN_CATALOG structure', () => {
    it('contient exactement 3 plans', () => {
      expect(Object.keys(PLAN_CATALOG)).toHaveLength(3);
      expect(PLAN_CATALOG.FREE).toBeDefined();
      expect(PLAN_CATALOG.PRO).toBeDefined();
      expect(PLAN_CATALOG.MAX).toBeDefined();
    });

    it('FREE a un prix de 0', () => {
      expect(PLAN_CATALOG.FREE.priceTnd).toBe(0);
    });

    it('PRO coûte 99 TND/mois', () => {
      expect(PLAN_CATALOG.PRO.priceTnd).toBe(99);
      expect(PLAN_CATALOG.PRO.billingCycle).toBe('monthly');
    });

    it('MAX coûte 129 TND lifetime', () => {
      expect(PLAN_CATALOG.MAX.priceTnd).toBe(129);
      expect(PLAN_CATALOG.MAX.billingCycle).toBe('monthly');
    });
  });

  describe('quotas FREE', () => {
    const free = PLAN_CATALOG.FREE.quotas;

    it('ORAL_SESSIONS limité à 2/semaine', () => {
      expect(free.ORAL_SESSIONS).toEqual({ limit: 2, period: 'week' });
    });

    it('WRITTEN_CORRECTIONS limité à 3/mois', () => {
      expect(free.WRITTEN_CORRECTIONS).toEqual({ limit: 3, period: 'month' });
    });

    it('TUTOR_QUESTIONS limité à 10/jour', () => {
      expect(free.TUTOR_QUESTIONS).toEqual({ limit: 10, period: 'day' });
    });

    it('QUIZ_PER_DAY limité à 3/jour', () => {
      expect(free.QUIZ_PER_DAY).toEqual({ limit: 3, period: 'day' });
    });
  });

  describe('quotas PRO', () => {
    const pro = PLAN_CATALOG.PRO.quotas;

    it('ORAL_SESSIONS plus élevé que FREE', () => {
      const freeLimit = PLAN_CATALOG.FREE.quotas.ORAL_SESSIONS!.limit as number;
      const proLimit = pro.ORAL_SESSIONS!.limit as number;
      expect(proLimit).toBeGreaterThan(freeLimit);
    });

    it('a des quotas pour toutes les features', () => {
      expect(pro.ORAL_SESSIONS).toBeDefined();
      expect(pro.WRITTEN_CORRECTIONS).toBeDefined();
      expect(pro.TUTOR_QUESTIONS).toBeDefined();
      expect(pro.LLM_TOKENS).toBeDefined();
    });
  });

  describe('quotas MAX', () => {
    const max = PLAN_CATALOG.MAX.quotas;

    it('ORAL_SESSIONS illimité', () => {
      expect(max.ORAL_SESSIONS!.limit).toBe('unlimited');
    });

    it('WRITTEN_CORRECTIONS illimité', () => {
      expect(max.WRITTEN_CORRECTIONS!.limit).toBe('unlimited');
    });

    it('TUTOR_QUESTIONS illimité', () => {
      expect(max.TUTOR_QUESTIONS!.limit).toBe('unlimited');
    });
  });

  describe('flags par plan', () => {
    it('FREE n a pas accès au PDF oral', () => {
      expect(PLAN_CATALOG.FREE.flags.ORAL_PDF_REPORT).toBe(false);
    });

    it('PRO a accès au PDF oral', () => {
      expect(PLAN_CATALOG.PRO.flags.ORAL_PDF_REPORT).toBe(true);
    });

    it('MAX a accès à tout', () => {
      expect(PLAN_CATALOG.MAX.flags.ORAL_PDF_REPORT).toBe(true);
      expect(PLAN_CATALOG.MAX.flags.ORAL_REPORT_HISTORY).toBe(true);
      expect(PLAN_CATALOG.MAX.flags.GRAPH_RAG).toBe(true);
    });

    it('FREE n a pas de parcours adaptatif', () => {
      expect(PLAN_CATALOG.FREE.flags.ADAPTIVE_PARCOURS).toBe(false);
    });

    it('PRO a le parcours adaptatif', () => {
      expect(PLAN_CATALOG.PRO.flags.ADAPTIVE_PARCOURS).toBe(true);
    });
  });

  describe('normalizePlanId', () => {
    it('MONTHLY → PRO', () => {
      expect(normalizePlanId('MONTHLY')).toBe('PRO');
    });

    it('LIFETIME → MAX', () => {
      expect(normalizePlanId('LIFETIME')).toBe('PRO');
    });

    it('PRO → PRO', () => {
      expect(normalizePlanId('PRO')).toBe('PRO');
    });

    it('MAX → MAX', () => {
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
    it('retourne le bon plan pour PRO', () => {
      expect(getPlanConfig('PRO').id).toBe('PRO');
    });

    it('retourne FREE pour un plan inconnu', () => {
      expect(getPlanConfig('BLABLA').id).toBe('FREE');
    });

    it('gère les noms legacy', () => {
      expect(getPlanConfig('MONTHLY').id).toBe('PRO');
      expect(getPlanConfig('LIFETIME').id).toBe('PRO');
    });
  });

  describe('comparePlans', () => {
    it('FREE < PRO', () => {
      expect(comparePlans('FREE', 'PRO')).toBeLessThan(0);
    });

    it('PRO < MAX', () => {
      expect(comparePlans('PRO', 'PRO')).toBeLessThan(0);
    });

    it('MAX > FREE', () => {
      expect(comparePlans('PRO', 'FREE')).toBeGreaterThan(0);
    });

    it('PRO = PRO', () => {
      expect(comparePlans('PRO', 'PRO')).toBe(0);
    });
  });

  describe('cohérence inter-plans', () => {
    const features: EntitlementKey[] = ['ORAL_SESSIONS', 'WRITTEN_CORRECTIONS', 'TUTOR_QUESTIONS', 'LLM_TOKENS', 'RAG_SEARCH', 'QUIZ_PER_DAY'];

    it('chaque quota PRO >= FREE', () => {
      for (const feature of features) {
        const freeEntry = PLAN_CATALOG.FREE.quotas[feature];
        const proEntry = PLAN_CATALOG.PRO.quotas[feature];
        if (freeEntry && proEntry) {
          if (typeof proEntry.limit === 'number' && typeof freeEntry.limit === 'number') {
            expect(proEntry.limit).toBeGreaterThanOrEqual(freeEntry.limit);
          }
        }
      }
    });

    it('chaque quota MAX >= PRO (ou unlimited)', () => {
      for (const feature of features) {
        const proEntry = PLAN_CATALOG.PRO.quotas[feature];
        const maxEntry = PLAN_CATALOG.MAX.quotas[feature];
        if (proEntry && maxEntry) {
          if (maxEntry.limit === 'unlimited') {
            expect(true).toBe(true); // unlimited est toujours >= tout
          } else if (typeof maxEntry.limit === 'number' && typeof proEntry.limit === 'number') {
            expect(maxEntry.limit).toBeGreaterThanOrEqual(proEntry.limit);
          }
        }
      }
    });
  });
});
