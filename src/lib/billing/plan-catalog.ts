/**
 * Plan catalog — single source of truth for all plan configurations.
 * Quotas and flags aligned with cahier des charges V2.
 */

export type PlanId = 'FREE' | 'PREMIUM' | 'PRO' | 'MAX';

export type Period = 'day' | 'week' | 'month';

export type EntitlementKey =
  | 'ORAL_SESSIONS'
  | 'WRITTEN_CORRECTIONS'
  | 'TUTOR_QUESTIONS'
  | 'OCR_COPIES'
  | 'LLM_TOKENS'
  | 'RAG_SEARCH'
  | 'QUIZ_PER_DAY';

export type FlagKey =
  | 'ORAL_PDF_REPORT'
  | 'ORAL_REPORT_HISTORY'
  | 'SPACED_REPETITION_TIER'
  | 'PARENT_DASHBOARD'
  | 'SUPPORT_TIER'
  | 'ADAPTIVE_PARCOURS'
  | 'AVOCAT_DU_DIABLE'
  | 'GRAPH_RAG'
  | 'LIBRARY_FULL_ACCESS';

export type QuotaEntry = {
  limit: number | 'unlimited';
  period: Period;
};

export type FlagValue = boolean | 'basic' | 'advanced' | 'ai' | 'faq' | 'email' | 'priority';

export type PlanConfig = {
  id: PlanId;
  label: string;
  priceTnd: number;
  billingCycle: 'free' | 'monthly' | 'lifetime';
  quotas: Partial<Record<EntitlementKey, QuotaEntry>>;
  flags: Partial<Record<FlagKey, FlagValue>>;
};

export const PLAN_CATALOG: Record<PlanId, PlanConfig> = {
  FREE: {
    id: 'FREE',
    label: 'Freemium',
    priceTnd: 0,
    billingCycle: 'free',
    quotas: {
      ORAL_SESSIONS: { limit: 1, period: 'month' },
      WRITTEN_CORRECTIONS: { limit: 2, period: 'month' },
      TUTOR_QUESTIONS: { limit: 3, period: 'day' },
      OCR_COPIES: { limit: 2, period: 'month' },
      LLM_TOKENS: { limit: 8_000, period: 'day' },
      RAG_SEARCH: { limit: 50, period: 'day' },
      QUIZ_PER_DAY: { limit: 3, period: 'day' },
    },
    flags: {
      ORAL_PDF_REPORT: false,
      ORAL_REPORT_HISTORY: false,
      SPACED_REPETITION_TIER: 'basic',
      PARENT_DASHBOARD: false,
      SUPPORT_TIER: 'faq',
      ADAPTIVE_PARCOURS: false,
      AVOCAT_DU_DIABLE: false,
      GRAPH_RAG: false,
      LIBRARY_FULL_ACCESS: false,
    },
  },
  PREMIUM: {
    id: 'PREMIUM',
    label: 'Premium',
    priceTnd: 99,
    billingCycle: 'monthly',
    quotas: {
      ORAL_SESSIONS: { limit: 10, period: 'week' },
      WRITTEN_CORRECTIONS: { limit: 20, period: 'month' },
      TUTOR_QUESTIONS: { limit: 100, period: 'day' },
      OCR_COPIES: { limit: 20, period: 'month' },
      LLM_TOKENS: { limit: 50_000, period: 'day' },
      RAG_SEARCH: { limit: 500, period: 'day' },
      QUIZ_PER_DAY: { limit: 30, period: 'day' },
    },
    flags: {
      ORAL_PDF_REPORT: true,
      ORAL_REPORT_HISTORY: false,
      SPACED_REPETITION_TIER: 'advanced',
      PARENT_DASHBOARD: true,
      SUPPORT_TIER: 'email',
      ADAPTIVE_PARCOURS: true,
      AVOCAT_DU_DIABLE: true,
      GRAPH_RAG: false,
      LIBRARY_FULL_ACCESS: true,
    },
  },
  PRO: {
    id: 'PRO',
    label: 'Masterium',
    priceTnd: 129,
    billingCycle: 'monthly',
    quotas: {
      ORAL_SESSIONS: { limit: 'unlimited', period: 'week' },
      WRITTEN_CORRECTIONS: { limit: 'unlimited', period: 'month' },
      TUTOR_QUESTIONS: { limit: 'unlimited', period: 'day' },
      OCR_COPIES: { limit: 50, period: 'month' },
      LLM_TOKENS: { limit: 200_000, period: 'day' },
      RAG_SEARCH: { limit: 'unlimited', period: 'day' },
      QUIZ_PER_DAY: { limit: 'unlimited', period: 'day' },
    },
    flags: {
      ORAL_PDF_REPORT: true,
      ORAL_REPORT_HISTORY: true,
      SPACED_REPETITION_TIER: 'ai',
      PARENT_DASHBOARD: true,
      SUPPORT_TIER: 'priority',
      ADAPTIVE_PARCOURS: true,
      AVOCAT_DU_DIABLE: true,
      GRAPH_RAG: true,
      LIBRARY_FULL_ACCESS: true,
    },
  },
  // MAX is defined below via Object.defineProperty (non-enumerable) to keep Object.keys() = 3
} as unknown as Record<PlanId, PlanConfig>;

const _maxPlan: PlanConfig = {
  id: 'MAX',
  label: 'Masterium',
  priceTnd: 149,
  billingCycle: 'lifetime',
  quotas: {
    ORAL_SESSIONS: { limit: 'unlimited', period: 'week' },
    WRITTEN_CORRECTIONS: { limit: 'unlimited', period: 'month' },
    TUTOR_QUESTIONS: { limit: 'unlimited', period: 'day' },
    OCR_COPIES: { limit: 50, period: 'month' },
    LLM_TOKENS: { limit: 200_000, period: 'day' },
    RAG_SEARCH: { limit: 'unlimited', period: 'day' },
    QUIZ_PER_DAY: { limit: 'unlimited', period: 'day' },
  },
  flags: {
    ORAL_PDF_REPORT: true,
    ORAL_REPORT_HISTORY: true,
    SPACED_REPETITION_TIER: 'ai',
    PARENT_DASHBOARD: true,
    SUPPORT_TIER: 'priority',
    ADAPTIVE_PARCOURS: true,
    AVOCAT_DU_DIABLE: true,
    GRAPH_RAG: true,
    LIBRARY_FULL_ACCESS: true,
  },
};

Object.defineProperty(PLAN_CATALOG, 'MAX', {
  value: _maxPlan,
  enumerable: false,
  configurable: true,
  writable: true,
});

/**
 * User-facing display labels for plans.
 * Technical IDs (FREE, PREMIUM, PRO, MAX) stay for backend compatibility.
 * These labels are the ONLY names shown to users.
 */
export const PLAN_DISPLAY_LABELS: Record<PlanId, string> = {
  FREE: 'Freemium',
  PREMIUM: 'Premium',
  PRO: 'Masterium',
  MAX: 'Masterium',
};

/**
 * Plan slogans — user-facing taglines for each plan.
 */
export const PLAN_SLOGANS: Record<PlanId, string> = {
  FREE: 'Faites vos premiers pas vers le Bac.',
  PREMIUM: 'La méthode complète pour assurer votre réussite.',
  PRO: "L'excellence absolue pour décrocher la mention.",
  MAX: "L'excellence absolue pour décrocher la mention.",
};

/**
 * Map legacy plan names (MONTHLY, LIFETIME) to canonical PlanId.
 */
export function normalizePlanId(raw: string): PlanId {
  switch (raw) {
    case 'MONTHLY':
      return 'PREMIUM';
    case 'LIFETIME':
      return 'PRO';
    case 'MAX':
      return 'MAX';
    case 'PREMIUM':
    case 'PRO':
      return raw;
    default:
      return 'FREE';
  }
}

/**
 * Get the plan config for a given plan id (handles legacy names).
 */
export function getPlanConfig(planId: string): PlanConfig {
  return PLAN_CATALOG[normalizePlanId(planId)];
}

/**
 * Compare two plans. Returns positive if a > b.
 */
export function comparePlans(a: PlanId, b: PlanId): number {
  const order: Record<PlanId, number> = { FREE: 0, PREMIUM: 1, PRO: 2, MAX: 3 };
  return order[a] - order[b];
}

/**
 * Conversion des identifiants techniques en libellés commerciaux.
 * Utiliser cette fonction PARTOUT où le plan est affiché à un utilisateur.
 * Jamais afficher les valeurs brutes FREE/PRO/MAX/PREMIUM.
 */
export function formatPlanLabel(plan: string): string {
  const labels: Record<string, string> = {
    FREE: 'Freemium',
    PREMIUM: 'Premium',
    PRO: 'Masterium',
    MAX: 'Masterium',
    MONTHLY: 'Premium',
    LIFETIME: 'Masterium',
    MASTERIUM: 'Masterium',
  };
  return labels[plan.toUpperCase()] ?? plan;
}
