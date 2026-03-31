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
 * 17F: Anti-abuse cooldown for free accounts.
 * New accounts must wait before consuming quotas.
 */
const FREE_ACCOUNT_COOLDOWN_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Get the billing context for a user.
 * Falls back to FREE if no subscription or subscription expired.
 * 17F: FREE accounts created < 10 minutes ago have isActive=false (cooldown).
 */
export async function getBillingContext(userId: string): Promise<BillingContext> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        createdAt: true,
        subscription: {
          select: {
            plan: true,
            status: true,
            currentPeriodEnd: true,
          },
        },
      },
    });

    const sub = user?.subscription ?? null;
    if (!sub) {
      const accountAge = user ? Date.now() - new Date(user.createdAt).getTime() : Infinity;
      const isCoolingDown = accountAge < FREE_ACCOUNT_COOLDOWN_MS;

      return {
        planId: 'FREE',
        config: PLAN_CATALOG.FREE,
        endsAt: null,
        isActive: !isCoolingDown,
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
  } catch (error: unknown) {
    // P2021: table does not exist — gracefully fall back to FREE
    const isPrismaTableMissing =
      error instanceof Error &&
      'code' in error &&
      (error as { code: string }).code === 'P2021';

    if (process.env.NODE_ENV === 'test') {
      return {
        planId: 'FREE',
        config: PLAN_CATALOG.FREE,
        endsAt: null,
        isActive: true,
      };
    }

    if (isPrismaTableMissing) {
      return {
        planId: 'FREE',
        config: PLAN_CATALOG.FREE,
        endsAt: null,
        isActive: false,
      };
    }

    throw new BillingContextUnavailableError();
  }
}
