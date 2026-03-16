/**
 * Quota utilities — unified with plan-catalog.ts as single source of truth.
 * Use getBillingContext() and plan-catalog quotas for all quota checks.
 */

import { type EntitlementKey, type Period, PLAN_CATALOG, PLAN_DISPLAY_LABELS, type PlanId } from './plan-catalog';

/**
 * Get the period key for quota tracking.
 * Day: "2026-03-08"
 * Week: "2026-03-W2"
 * Month: "2026-03"
 */
export function getPeriodKey(period: Period, now: Date = new Date()): string {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');

  if (period === 'day') return `${yyyy}-${mm}-${dd}`;
  if (period === 'week') {
    const weekNum = Math.ceil(now.getDate() / 7);
    return `${yyyy}-${mm}-W${weekNum}`;
  }
  return `${yyyy}-${mm}`;
}

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
  
  const limitDisplay = quota.limit === 'unlimited' ? 'illimité' : String(quota.limit);
  const periodLabel = periodLabels[quota.period];

  const displayName = PLAN_DISPLAY_LABELS[planId] ?? planId;

  if (planId === 'FREE') {
    return `Tu as atteint la limite incluse dans ${displayName} : ${limitDisplay} ${label} par ${periodLabel}. Ton travail reste conservé. Passe à Excellence pour reprendre sans blocage.`;
  }

  if (planId === 'PRO' || planId === 'PREMIUM') {
    return `Tu as atteint la limite incluse dans ${displayName} : ${limitDisplay} ${label} par ${periodLabel}. Passe à Excellence pour continuer sans plafond.`;
  }

  return `Tu as atteint la limite de ton plan ${displayName} : ${limitDisplay} ${label} par ${periodLabel}.`;
}
