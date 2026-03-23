import { normalizePlanId } from '@/lib/billing/plan-catalog';

type RawSubscription = {
  plan: string;
  status: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
};

export type AdminVisiblePlanId = 'FREE' | 'PREMIUM' | 'PRO';

export type AdminVisibleSubscription = {
  plan: AdminVisiblePlanId;
  status: string;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
};

function toAdminVisiblePlanId(plan: string | null | undefined): AdminVisiblePlanId {
  const normalized = normalizePlanId(plan ?? 'FREE');

  if (normalized === 'MAX') {
    return 'PRO';
  }

  if (normalized === 'PREMIUM' || normalized === 'PRO') {
    return normalized;
  }

  return 'FREE';
}

export function toAdminVisibleSubscription(subscription: RawSubscription | null | undefined): AdminVisibleSubscription {
  if (!subscription) {
    return {
      plan: 'FREE',
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
    FREE: 0,
    PREMIUM: 0,
    PRO: 0,
  };

  for (const subscription of subscriptions) {
    const visible = toAdminVisibleSubscription(subscription);
    counts[visible.plan] += 1;
  }

  return [
    { plan: 'FREE' as const, count: counts.FREE },
    { plan: 'PREMIUM' as const, count: counts.PREMIUM },
    { plan: 'PRO' as const, count: counts.PRO },
  ];
}
