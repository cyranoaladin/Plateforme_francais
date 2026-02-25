/**
 * Billing quotas enforcement per cahier des charges V2 §Sprint 4.
 *
 * Plans: FREE / PRO / MAX
 * Features: oral_sessions, ecrit_corrections, llm_requests, rag_queries
 */

export type PlanId = 'FREE' | 'PRO' | 'MAX' | 'MONTHLY' | 'LIFETIME';

export interface PlanQuotas {
  /** Max oral sessions per month */
  oral_sessions: number;
  /** Max écrit corrections per month */
  ecrit_corrections: number;
  /** Max LLM requests per day */
  llm_requests_daily: number;
  /** Max RAG queries per day */
  rag_queries_daily: number;
  /** Can use FREE_PRACTICE mode */
  free_practice: boolean;
  /** Can export PDF portfolio */
  export_pdf: boolean;
  /** Can access parent dashboard */
  parent_dashboard: boolean;
}

export const PLAN_QUOTAS: Record<PlanId, PlanQuotas> = {
  FREE: {
    oral_sessions: 3,
    ecrit_corrections: 5,
    llm_requests_daily: 20,
    rag_queries_daily: 10,
    free_practice: false,
    export_pdf: false,
    parent_dashboard: false,
  },
  PRO: {
    oral_sessions: 30,
    ecrit_corrections: 50,
    llm_requests_daily: 200,
    rag_queries_daily: 100,
    free_practice: true,
    export_pdf: true,
    parent_dashboard: true,
  },
  MAX: {
    oral_sessions: -1, // unlimited
    ecrit_corrections: -1,
    llm_requests_daily: -1,
    rag_queries_daily: -1,
    free_practice: true,
    export_pdf: true,
    parent_dashboard: true,
  },
  // Legacy plans map to PRO quotas
  MONTHLY: {
    oral_sessions: 30,
    ecrit_corrections: 50,
    llm_requests_daily: 200,
    rag_queries_daily: 100,
    free_practice: true,
    export_pdf: true,
    parent_dashboard: true,
  },
  LIFETIME: {
    oral_sessions: -1,
    ecrit_corrections: -1,
    llm_requests_daily: -1,
    rag_queries_daily: -1,
    free_practice: true,
    export_pdf: true,
    parent_dashboard: true,
  },
};

export type QuotaFeature = 'oral_sessions' | 'ecrit_corrections' | 'llm_requests_daily' | 'rag_queries_daily';

/**
 * Check if user has remaining quota for a given feature.
 * Returns { allowed: true, remaining } or { allowed: false, limit }.
 */
export function checkQuota(
  plan: PlanId,
  feature: QuotaFeature,
  currentCount: number,
): { allowed: boolean; limit: number; remaining: number } {
  const quotas = PLAN_QUOTAS[plan] ?? PLAN_QUOTAS.FREE;
  const limit = quotas[feature];

  // -1 = unlimited
  if (limit === -1) {
    return { allowed: true, limit: -1, remaining: -1 };
  }

  const remaining = Math.max(0, limit - currentCount);
  return {
    allowed: remaining > 0,
    limit,
    remaining,
  };
}

/**
 * Get the period key for quota tracking.
 * Monthly features: "2025-06"
 * Daily features: "2025-06-15"
 */
export function getPeriodKey(feature: QuotaFeature, now: Date = new Date()): string {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');

  if (feature.includes('daily')) {
    return `${yyyy}-${mm}-${dd}`;
  }
  return `${yyyy}-${mm}`;
}

/**
 * Build a user-friendly paywall message for a blocked feature.
 */
export function buildPaywallMessage(plan: PlanId, feature: QuotaFeature): string {
  const quotas = PLAN_QUOTAS[plan] ?? PLAN_QUOTAS.FREE;
  const limit = quotas[feature];
  const featureLabels: Record<QuotaFeature, string> = {
    oral_sessions: 'simulations orales',
    ecrit_corrections: 'corrections écrites',
    llm_requests_daily: 'requêtes IA',
    rag_queries_daily: 'recherches documentaires',
  };
  const label = featureLabels[feature];

  if (plan === 'FREE') {
    return `Tu as atteint la limite de ${limit} ${label} par ${feature.includes('daily') ? 'jour' : 'mois'} du plan Gratuit. Passe au plan Pro pour continuer !`;
  }
  return `Tu as atteint la limite de ${limit} ${label} par ${feature.includes('daily') ? 'jour' : 'mois'}. Passe au plan Max pour un accès illimité !`;
}
