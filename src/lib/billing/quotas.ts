/**
 * Quota utilities — unified with plan-catalog.ts as single source of truth.
 * Use getBillingContext() and plan-catalog quotas for all quota checks.
 */

import { type EntitlementKey, type Period, PLAN_CATALOG, PLAN_DISPLAY_LABELS, type PlanId } from './plan-catalog';
export { getPeriodKey } from './usage';

/**
 * Build a user-friendly paywall message for a blocked feature.
 */
export function buildPaywallMessage(planId: PlanId, entitlement: EntitlementKey): string {
  const config = PLAN_CATALOG[planId];
  const quota = config.quotas[entitlement];
  
  const featureLabels: Record<EntitlementKey, string> = {
    ORAL_SESSIONS: 'simulations orales',
    WRITTEN_CORRECTIONS: 'corrections écrites',
    TUTOR_QUESTIONS: 'questions au tuteur',
    OCR_COPIES: 'copies numérisées',
    LLM_TOKENS: 'tokens LLM',
    RAG_SEARCH: 'recherches documentaires',
    QUIZ_PER_DAY: 'quiz',
  };
  
  const periodLabels: Record<Period, string> = {
    day: 'jour',
    week: 'semaine',
    month: 'mois',
  };
  
  const label = featureLabels[entitlement] || entitlement;
  
  if (!quota) {
    return `Cette fonctionnalité n'est pas disponible dans ton plan actuel. Passe à un plan supérieur.`;
  }

  if (quota.limit === 'unlimited') {
    console.error(
      `[billing] buildPaywallMessage appelé pour un plan illimité (${planId}/${entitlement}) — bug Redis probable`,
    );
    return 'Un problème technique temporaire bloque cette fonctionnalité. Réessaie dans quelques instants.';
  }
  
  const limitDisplay = String(quota.limit);
  const periodLabel = periodLabels[quota.period];

  const displayName = PLAN_DISPLAY_LABELS[planId] ?? planId;

  if (quota.limit === 0) {
    return `Cette fonctionnalité (${label}) n'est pas incluse dans ton plan ${displayName}. Passe à Premium pour en bénéficier.`;
  }

  if (planId === 'FREE') {
    return `Tu as atteint la limite incluse dans ${displayName} : ${limitDisplay} ${label} par ${periodLabel}. Ton travail reste conservé. Passe à Premium pour reprendre sans blocage.`;
  }

  if (planId === 'PRO') {
    return `Tu as atteint la limite incluse dans ${displayName} : ${limitDisplay} ${label} par ${periodLabel}. Réessaie dans quelques instants.`;
  }

  if (planId === 'PREMIUM') {
    return `Tu as atteint la limite incluse dans ${displayName} : ${limitDisplay} ${label} par ${periodLabel}. Passe à Masterium pour continuer sans plafond.`;
  }

  return `Tu as atteint la limite de ton plan ${displayName} : ${limitDisplay} ${label} par ${periodLabel}.`;
}
