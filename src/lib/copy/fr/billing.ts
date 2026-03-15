import { type Period, type PlanId } from '@/lib/billing/plan-catalog';

const PUBLIC_PLAN_LABELS: Record<PlanId, string> = {
  FREE: 'Free',
  PREMIUM: 'Premium',
  PRO: 'Pro',
  MAX: 'Pro',
};

const PERIOD_LABELS: Record<Period, string> = {
  day: 'jour',
  week: 'semaine',
  month: 'mois',
};

function formatPlanLabel(planId: PlanId): string {
  return PUBLIC_PLAN_LABELS[planId] ?? 'Pro';
}

function formatPeriodLabel(period: Period): string {
  return PERIOD_LABELS[period] ?? period;
}

function formatQuotaLimit(limit: number | 'unlimited'): string {
  return limit === 'unlimited' ? 'illimité' : String(limit);
}

const FEATURE_LABELS = {
  ragSearch: 'les recherches documentaires',
  libraryAccess: 'les ressources de la bibliothèque',
} as const;

type FeatureKey = keyof typeof FEATURE_LABELS;

function getFeatureLabel(key: FeatureKey): string {
  return FEATURE_LABELS[key];
}

function buildUpgradePrompt(planId: PlanId, action: string): string {
  switch (planId) {
    case 'FREE':
      return `Passe à Premium ou Pro pour ${action}.`;
    case 'PREMIUM':
      return `Passe à Pro pour ${action}.`;
    case 'PRO':
    case 'MAX':
      return `Contacte-nous si tu as besoin d'un volume supérieur pour ${action}.`;
  }
}

function buildQuotaExceededMessage(params: {
  featureLabel: string;
  limit: number | 'unlimited';
  period: Period;
  planId: PlanId;
  action: string;
  preserveWorkMessage?: string;
}): string {
  const { featureLabel, limit, period, planId, action, preserveWorkMessage } = params;

  const intro =
    `Tu as atteint la limite incluse pour ${featureLabel} ` +
    `dans le plan ${formatPlanLabel(planId)} (${formatQuotaLimit(limit)} par ${formatPeriodLabel(period)}).`;

  return [intro, preserveWorkMessage, buildUpgradePrompt(planId, action)]
    .filter(Boolean)
    .join(' ');
}

export const billingCopy = {
  unavailableMessage:
    "La vérification de ton abonnement est momentanément indisponible. Réessaie dans quelques minutes.",
  libraryFreePaywall:
    "Tu as accès à un échantillon de ressources par catégorie. Passe à Premium ou Pro pour débloquer les 553 ressources de la bibliothèque complète.",
  formatPlanLabel,
  formatPeriodLabel,
  formatQuotaLimit,
  buildUpgradePrompt,
  getFeatureLabel,
  featureLabels: FEATURE_LABELS,
  buildQuotaExceededMessage,
} as const;
