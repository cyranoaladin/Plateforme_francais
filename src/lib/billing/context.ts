/**
 * Billing context — resolves the active plan for a user from the database.
 * Single entry point for all server-side plan checks.
 */

import { prisma } from '@/lib/db/client';
import { type PlanId, type PlanConfig, PLAN_CATALOG, normalizePlanId } from './plan-catalog';

export type BillingContext = {
  planId: PlanId;
  config: PlanConfig;
  endsAt: Date | null;
  isActive: boolean;
};

export class BillingContextUnavailableError extends Error {
  constructor() {
    super('Contexte abonnement indisponible.');
    this.name = 'BillingContextUnavailableError';
  }
}

/**
 * Get the billing context for a user.
 * Falls back to FREE if no subscription or subscription expired.
 */
export async function getBillingContext(userId: string): Promise<BillingContext> {
  try {
    const sub = await prisma.subscription.findUnique({ where: { userId } });

    if (!sub) {
      return {
        planId: 'FREE',
        config: PLAN_CATALOG.FREE,
        endsAt: null,
        isActive: true,
      };
    }

    const planId = normalizePlanId(sub.plan);
    const now = new Date();

    // Check if subscription is active and not expired
    const isExpired = sub.currentPeriodEnd ? sub.currentPeriodEnd < now : false;
    const isActive = sub.status === 'ACTIVE' && !isExpired;

    if (!isActive) {
      return {
        planId: 'FREE',
        config: PLAN_CATALOG.FREE,
        endsAt: sub.currentPeriodEnd ?? null,
        isActive: false,
      };
    }

    return {
      planId,
      config: PLAN_CATALOG[planId],
      endsAt: sub.currentPeriodEnd ?? null,
      isActive: true,
    };
  } catch {
    throw new BillingContextUnavailableError();
  }
}
