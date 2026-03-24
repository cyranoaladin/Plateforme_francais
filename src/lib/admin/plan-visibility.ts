import { normalizePlanId, type PublicPlanId } from '@/lib/billing/plan-catalog';

type RawSubscription = {
  plan: string;
  status: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
};

export type AdminVisiblePlanId = PublicPlanId;

export type AdminVisibleSubscription = {
  plan: AdminVisiblePlanId;
  status: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
};

function toAdminVisiblePlanId(plan: string | null | undefined): AdminVisiblePlanId {
  const normalized = normalizePlanId(plan ?? 'FREE');

  if (normalized === 'PREMIUM') return 'PREMIUM';
  if (normalized === 'PRO') return 'MASTERIUM';
  return 'FREEMIUM';
}

export function toAdminVisibleSubscription(subscription: RawSubscription | null | undefined): AdminVisibleSubscription {
  if (!subscription) {
    return {
      plan: 'FREEMIUM',
      status: 'ACTIVE',
      currentPeriodStart: null,
      currentPeriodEnd: null,
    };
  }

  return {
    ...subscription,
    plan: toAdminVisiblePlanId(subscription.plan),
  };
}

export function countAdminVisiblePlans(subscriptions: Array<RawSubscription | null | undefined>) {
  const counts: Record<AdminVisiblePlanId, number> = {
    FREEMIUM: 0,
    PREMIUM: 0,
    MASTERIUM: 0,
  };

  for (const subscription of subscriptions) {
    const visible = toAdminVisibleSubscription(subscription);
    counts[visible.plan] += 1;
  }

  return [
    { plan: 'FREEMIUM' as const, count: counts.FREEMIUM },
    { plan: 'PREMIUM' as const, count: counts.PREMIUM },
    { plan: 'MASTERIUM' as const, count: counts.MASTERIUM },
  ];
}
