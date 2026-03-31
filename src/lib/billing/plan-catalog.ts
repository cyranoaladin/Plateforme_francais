/**
 * Plan catalog — single source of truth for plan behavior.
 *
 * Public/business plans:
 * - FREEMIUM
 * - PREMIUM
 * - MASTERIUM
 *
 * Internal storage/runtime ids kept for backward compatibility:
 * - FREE
 * - PREMIUM
 * - PRO
 */

export type InternalPlanId = 'FREE' | 'PREMIUM' | 'PRO';
export type PublicPlanId = 'FREEMIUM' | 'PREMIUM' | 'MASTERIUM';
export type LegacyPlanId =
  | InternalPlanId
  | PublicPlanId
  | 'MAX'
  | 'MONTHLY'
  | 'LIFETIME';
export type PlanId = InternalPlanId;

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
  id: InternalPlanId;
  label: string;
  priceTnd: number;
  billingCycle: 'free' | 'monthly';
  quotas: Partial<Record<EntitlementKey, QuotaEntry>>;
  flags: Partial<Record<FlagKey, FlagValue>>;
};

export const PLAN_CATALOG: Record<InternalPlanId, PlanConfig> = {
  FREE: {
    id: 'FREE',
    label: 'Freemium',
    priceTnd: 0,
    billingCycle: 'free',
    quotas: {
      // Freemium is a low-frequency monthly trial so users can discover the workflow without
      // getting a paid-style cadence. Paid plans switch oral practice to weekly pacing.
      ORAL_SESSIONS: { limit: 1, period: 'month' },
      WRITTEN_CORRECTIONS: { limit: 2, period: 'month' },
      TUTOR_QUESTIONS: { limit: 3, period: 'day' },
      OCR_COPIES: { limit: 0, period: 'month' },
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
      ORAL_REPORT_HISTORY: true,
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
};

/**
 * User-facing display labels for plans.
 * Technical aliases stay accepted on input, but only 3 effective plans exist.
 * These labels are the ONLY names shown to users.
 */
export const PLAN_DISPLAY_LABELS: Record<InternalPlanId, string> = {
  FREE: 'Freemium',
  PREMIUM: 'Premium',
  PRO: 'Masterium',
};

export const PUBLIC_PLAN_LABELS: Record<PublicPlanId, string> = {
  FREEMIUM: 'Freemium',
  PREMIUM: 'Premium',
  MASTERIUM: 'Masterium',
};

/**
 * Plan slogans — user-facing taglines for each plan.
 */
export const PLAN_SLOGANS: Record<InternalPlanId, string> = {
  FREE: 'Faites vos premiers pas vers le Bac.',
  PREMIUM: 'La méthode complète pour assurer votre réussite.',
  PRO: "L'excellence absolue pour décrocher la mention.",
};

/**
 * Map legacy or public plan names to the 3 canonical effective plans.
 */
export const PUBLIC_TO_INTERNAL_PLAN_ID: Record<PublicPlanId, InternalPlanId> = {
  FREEMIUM: 'FREE',
  PREMIUM: 'PREMIUM',
  MASTERIUM: 'PRO',
};

export const INTERNAL_TO_PUBLIC_PLAN_ID: Record<InternalPlanId, PublicPlanId> = {
  FREE: 'FREEMIUM',
  PREMIUM: 'PREMIUM',
  PRO: 'MASTERIUM',
};

export function normalizePlanId(raw: string): InternalPlanId {
  switch ((raw || 'FREE').trim().toUpperCase() as LegacyPlanId) {
    case 'FREEMIUM':
      return PUBLIC_TO_INTERNAL_PLAN_ID.FREEMIUM;
    case 'MONTHLY':
      return 'PREMIUM';
    case 'LIFETIME':
      return 'PRO';
    case 'MASTERIUM':
      return PUBLIC_TO_INTERNAL_PLAN_ID.MASTERIUM;
    case 'MAX':
      return 'PRO';
    case 'PREMIUM':
    case 'PRO':
    case 'FREE':
      return (raw || 'FREE').trim().toUpperCase() as InternalPlanId;
    default:
      return 'FREE';
  }
}

export function toPublicPlanId(plan: string): PublicPlanId {
  return INTERNAL_TO_PUBLIC_PLAN_ID[normalizePlanId(plan)];
}

export function parseCommercialPlanId(plan: string): InternalPlanId | null {
  const normalized = plan.trim().toUpperCase();
  if (normalized === 'FREEMIUM' || normalized === 'FREE') return PUBLIC_TO_INTERNAL_PLAN_ID.FREEMIUM;
  if (normalized === 'PREMIUM') return PUBLIC_TO_INTERNAL_PLAN_ID.PREMIUM;
  if (normalized === 'MASTERIUM' || normalized === 'PRO') return PUBLIC_TO_INTERNAL_PLAN_ID.MASTERIUM;
  return null;
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
export function comparePlans(a: InternalPlanId, b: InternalPlanId): number {
  const order: Record<InternalPlanId, number> = { FREE: 0, PREMIUM: 1, PRO: 2 };
  return order[normalizePlanId(a)] - order[normalizePlanId(b)];
}

/**
 * Conversion des identifiants techniques en libellés commerciaux.
 * Utiliser cette fonction PARTOUT où le plan est affiché à un utilisateur.
 * Jamais afficher les valeurs brutes FREE/PRO/MAX/PREMIUM.
 */
export function formatPlanLabel(plan: string): string {
  const labels: Record<string, string> = {
    FREE: 'Freemium',
    FREEMIUM: 'Freemium',
    PREMIUM: 'Premium',
    PRO: 'Masterium',
    MAX: 'Masterium',
    MONTHLY: 'Premium',
    LIFETIME: 'Masterium',
    MASTERIUM: 'Masterium',
  };
  return labels[plan.toUpperCase()] ?? plan;
}
