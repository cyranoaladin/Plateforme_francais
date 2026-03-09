import { prisma } from '@/lib/db/client';
import { getBillingContext } from './context';
import { type EntitlementKey, type Period } from './plan-catalog';

/**
 * Legacy feature names mapped to standardized EntitlementKey.
 */
export type PlanFeature =
  | 'epreuvesPerMonth'
  | 'correctionsPerMonth'
  | 'oralSessionsPerMonth'
  | 'tuteurMessagesPerDay'
  | 'quizPerDay'
  | 'adaptiveParcours'
  | 'avocatDuDiable'
  | 'spacedRepetition'
  | 'rapportHebdo'
  | 'graphRag';

const FEATURE_TO_ENTITLEMENT: Record<PlanFeature, EntitlementKey | null> = {
  epreuvesPerMonth: 'WRITTEN_CORRECTIONS',
  correctionsPerMonth: 'WRITTEN_CORRECTIONS',
  oralSessionsPerMonth: 'ORAL_SESSIONS',
  tuteurMessagesPerDay: 'TUTOR_QUESTIONS',
  quizPerDay: 'QUIZ_PER_DAY',
  adaptiveParcours: null, // flag
  avocatDuDiable: null, // flag
  spacedRepetition: null, // flag
  rapportHebdo: null, // flag
  graphRag: null, // flag
};

/**
 * Get user plan using unified billing context.
 * @deprecated Use getBillingContext() directly for new code.
 */
export async function getUserPlan(userId: string): Promise<'FREE' | 'PREMIUM' | 'PRO' | 'MAX'> {
  const context = await getBillingContext(userId);
  return context.planId;
}

function currentPeriodKey(period: Period): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');

  if (period === 'day') return `${y}-${m}-${d}`;
  if (period === 'week') {
    const weekNum = Math.ceil(now.getUTCDate() / 7);
    return `${y}-${m}-W${weekNum}`;
  }
  return `${y}-${m}`;
}

async function readUsageCount(userId: string, feature: PlanFeature, periodKey: string): Promise<number> {
  try {
    const row = (await prisma.usageCounter.findUnique({
      where: {
        userId_feature_periodKey: {
          userId,
          feature,
          periodKey,
        },
      },
    })) as { count?: number } | null;

    return row?.count ?? 0;
  } catch {
    return 0;
  }
}

export async function incrementUsage(userId: string, feature: PlanFeature): Promise<void> {
  const entitlementKey = FEATURE_TO_ENTITLEMENT[feature];
  if (!entitlementKey) return; // flags don't have usage tracking

  const context = await getBillingContext(userId);
  const quota = context.config.quotas[entitlementKey];
  if (!quota) return;

  const periodKey = currentPeriodKey(quota.period);

  await prisma.usageCounter.upsert({
    where: {
      userId_feature_periodKey: {
        userId,
        feature,
        periodKey,
      },
    },
    update: {
      count: { increment: 1 },
    },
    create: {
      userId,
      feature,
      periodKey,
      count: 1,
    },
  });
}

export async function requirePlan(
  userId: string,
  feature: PlanFeature,
): Promise<{ allowed: boolean; reason?: string; upgradeUrl?: string; plan?: 'FREE' | 'PREMIUM' | 'PRO' | 'MAX' }> {
  const context = await getBillingContext(userId);
  const entitlementKey = FEATURE_TO_ENTITLEMENT[feature];

  // Handle flags (boolean features)
  if (!entitlementKey) {
    const flagMap: Record<string, keyof typeof context.config.flags> = {
      adaptiveParcours: 'ADAPTIVE_PARCOURS',
      avocatDuDiable: 'AVOCAT_DU_DIABLE',
      spacedRepetition: 'SPACED_REPETITION_TIER',
      rapportHebdo: 'ORAL_REPORT_HISTORY',
      graphRag: 'GRAPH_RAG',
    };
    const flagKey = flagMap[feature];
    if (flagKey) {
      const flagValue = context.config.flags[flagKey];
      const allowed = flagValue === true || (flagValue !== false && flagValue !== undefined);
      if (!allowed) {
        return {
          allowed: false,
          reason: 'feature_not_in_plan',
          upgradeUrl: '/pricing',
          plan: context.planId,
        };
      }
    }
    return { allowed: true, plan: context.planId };
  }

  // Handle quotas
  const quota = context.config.quotas[entitlementKey];
  if (!quota) return { allowed: true, plan: context.planId };

  if (quota.limit === 'unlimited') return { allowed: true, plan: context.planId };

  const periodKey = currentPeriodKey(quota.period);
  const count = await readUsageCount(userId, feature, periodKey);

  if (count >= quota.limit) {
    return {
      allowed: false,
      reason: 'Feature disabled',
      upgradeUrl: '/pricing',
      plan: context.planId,
    };
  }

  return { allowed: true, plan: context.planId };
}
