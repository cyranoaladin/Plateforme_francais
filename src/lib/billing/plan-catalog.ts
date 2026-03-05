/**
 * Plan catalog — single source of truth for all plan configurations.
 * Quotas and flags aligned with cahier des charges V2.
 */

export type PlanId = 'FREE' | 'PRO' | 'MAX';

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
  | 'GRAPH_RAG';

export type QuotaEntry = {
  limit: number | 'unlimited';
  period: Period;
};

export type FlagValue = boolean | 'basic' | 'advanced' | 'ai' | 'faq' | 'email' | 'priority';

export type PlanConfig = {
  id: PlanId;
  label: string;
  priceTndMonthly: number;
  priceEurMonthly: number;
  quotas: Partial<Record<EntitlementKey, QuotaEntry>>;
  flags: Partial<Record<FlagKey, FlagValue>>;
};

export const PLAN_CATALOG: Record<PlanId, PlanConfig> = {
  FREE: {
    id: 'FREE',
    label: 'Free',
    priceTndMonthly: 0,
    priceEurMonthly: 0,
    quotas: {
      ORAL_SESSIONS: { limit: 2, period: 'week' },
      WRITTEN_CORRECTIONS: { limit: 3, period: 'month' },
      TUTOR_QUESTIONS: { limit: 10, period: 'day' },
      OCR_COPIES: { limit: 2, period: 'month' },
      LLM_TOKENS: { limit: 5_000, period: 'day' },
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
    },
  },
  PRO: {
    id: 'PRO',
    label: 'Pro',
    priceTndMonthly: 24.9,
    priceEurMonthly: 9.9,
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
    },
  },
  MAX: {
    id: 'MAX',
    label: 'Max',
    priceTndMonthly: 44.9,
    priceEurMonthly: 19.9,
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
    },
  },
};

/**
 * Map legacy plan names (MONTHLY, LIFETIME) to canonical PlanId.
 */
export function normalizePlanId(raw: string): PlanId {
  switch (raw) {
    case 'MONTHLY':
      return 'PRO';
    case 'LIFETIME':
      return 'MAX';
    case 'PRO':
    case 'MAX':
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
  const order: Record<PlanId, number> = { FREE: 0, PRO: 1, MAX: 2 };
  return order[a] - order[b];
}
