import { prisma } from '@/lib/db/client';

export const PLAN_LIMITS = {
  FREE: {
    epreuvesPerMonth: 3,
    correctionsPerMonth: 1,
    oralSessionsPerMonth: 2,
    tuteurMessagesPerDay: 10,
    quizPerDay: 3,
    adaptiveParcours: false,
    avocatDuDiable: false,
    spacedRepetition: false,
    rapportHebdo: false,
    graphRag: false,
  },
  MONTHLY: {
    epreuvesPerMonth: Number.POSITIVE_INFINITY,
    correctionsPerMonth: Number.POSITIVE_INFINITY,
    oralSessionsPerMonth: Number.POSITIVE_INFINITY,
    tuteurMessagesPerDay: Number.POSITIVE_INFINITY,
    quizPerDay: Number.POSITIVE_INFINITY,
    adaptiveParcours: true,
    avocatDuDiable: true,
    spacedRepetition: true,
    rapportHebdo: true,
    graphRag: false,
  },
  LIFETIME: {
    epreuvesPerMonth: Number.POSITIVE_INFINITY,
    correctionsPerMonth: Number.POSITIVE_INFINITY,
    oralSessionsPerMonth: Number.POSITIVE_INFINITY,
    tuteurMessagesPerDay: Number.POSITIVE_INFINITY,
    quizPerDay: Number.POSITIVE_INFINITY,
    adaptiveParcours: true,
    avocatDuDiable: true,
    spacedRepetition: true,
    rapportHebdo: true,
    graphRag: true,
  },
} as const;

export type PlanFeature = keyof typeof PLAN_LIMITS.FREE;
export type SubscriptionPlanName = keyof typeof PLAN_LIMITS;

export async function getUserPlan(userId: string): Promise<SubscriptionPlanName> {
  try {
    const sub = (await prisma.subscription.findUnique({ where: { userId } })) as
      | { plan?: SubscriptionPlanName; expiresAt?: Date | string | null }
      | null;
    if (!sub || !sub.plan) {
      return 'FREE';
    }
    // LIFETIME n'expire jamais
    if (sub.plan === 'LIFETIME') {
      return 'LIFETIME';
    }
    // Vérifier l'expiration pour les plans temporaires
    if (sub.expiresAt) {
      const expiry = new Date(sub.expiresAt).getTime();
      if (expiry < Date.now()) {
        return 'FREE';
      }
    }
    return sub.plan as SubscriptionPlanName;
  } catch {
    return 'FREE';
  }
}

function currentPeriodKey(feature: PlanFeature): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');

  if (feature === 'tuteurMessagesPerDay' || feature === 'quizPerDay') {
    return `${y}-${m}-${d}`;
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
  const periodKey = currentPeriodKey(feature);

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
): Promise<{ allowed: boolean; reason?: string; upgradeUrl?: string; plan?: SubscriptionPlanName }> {
  const plan = await getUserPlan(userId);
  const limits = PLAN_LIMITS[plan];
  const limit = limits[feature];

  if (typeof limit === 'boolean') {
    if (!limit) {
      return {
        allowed: false,
        reason: 'feature_not_in_plan',
        upgradeUrl: '/pricing',
        plan,
      };
    }

    return { allowed: true, plan };
  }

  if (!Number.isFinite(limit)) {
    return { allowed: true, plan };
  }

  const periodKey = currentPeriodKey(feature);
  const count = await readUsageCount(userId, feature, periodKey);

  if (count >= limit) {
    return {
      allowed: false,
      reason: 'quota_exceeded',
      upgradeUrl: '/pricing',
      plan,
    };
  }

  return { allowed: true, plan };
}
