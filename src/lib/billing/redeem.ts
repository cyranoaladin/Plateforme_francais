/**
 * Activation code redemption logic.
 * Codes are hashed with a pepper before storage — never stored in plain text.
 * Redemption is transactional and idempotent per code.
 */

import crypto from 'crypto';
import { type SubscriptionPlan } from '@prisma/client';
import { prisma } from '@/lib/db/client';
import { type PlanId, PLAN_CATALOG, comparePlans, normalizePlanId } from './plan-catalog';

/* ─────────────────── Error codes ─────────────────── */

export type RedeemErrorCode =
  | 'CODE_INVALID'
  | 'CODE_ALREADY_USED'
  | 'CODE_EXPIRED'
  | 'CODE_REVOKED'
  | 'PLAN_UNKNOWN';

export class RedeemError extends Error {
  readonly code: RedeemErrorCode;
  readonly httpStatus: number;

  constructor(code: RedeemErrorCode, message: string, httpStatus: number) {
    super(message);
    this.name = 'RedeemError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

/* ─────────────────── Helpers ─────────────────── */

/**
 * Normalize a raw activation code: uppercase, strip non-alphanumeric.
 */
export function normalizeCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Hash a normalized code with pepper (SHA-256).
 */
export function hashCode(normalized: string): string {
  const pepper = process.env.BILLING_CODE_PEPPER;
  if (!pepper) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('BILLING_CODE_PEPPER is required in production');
    }
    // Dev-only fallback — never used in production
    return crypto.createHash('sha256').update('eaf-dev-only-pepper' + normalized).digest('hex');
  }
  return crypto.createHash('sha256').update(pepper + normalized).digest('hex');
}

/**
 * Validate code format: must be 12–20 alphanumeric chars after normalization.
 */
export function isValidCodeFormat(normalized: string): boolean {
  return /^[A-Z0-9]{12,20}$/.test(normalized);
}

/* ─────────────────── Main redemption logic ─────────────────── */

export type RedeemResult = {
  plan: PlanId;
  endsAt: Date;
  message: string;
};

/**
 * Redeem an activation code for a user.
 * Runs inside a Prisma transaction for atomicity.
 *
 * @throws {RedeemError} with appropriate code and HTTP status
 */
export async function redeemActivationCode(
  userId: string,
  rawCode: string,
): Promise<RedeemResult> {
  const normalized = normalizeCode(rawCode);

  if (!isValidCodeFormat(normalized)) {
    throw new RedeemError('CODE_INVALID', 'Code invalide. Vérifie le format.', 400);
  }

  const codeHash = hashCode(normalized);

  return await prisma.$transaction(async (tx) => {
    // 1. Find code by hash
    const code = await tx.activationCode.findUnique({ where: { codeHash } });

    if (!code) {
      throw new RedeemError('CODE_INVALID', 'Code introuvable. Vérifie la saisie.', 400);
    }

    if (code.status === 'REDEEMED') {
      throw new RedeemError('CODE_ALREADY_USED', 'Ce code a déjà été utilisé.', 409);
    }

    if (code.status === 'REVOKED') {
      throw new RedeemError('CODE_REVOKED', 'Ce code a été révoqué.', 409);
    }

    if (code.status !== 'CREATED' && code.status !== 'DELIVERED') {
      throw new RedeemError('CODE_INVALID', 'Ce code n\u2019est pas activable.', 400);
    }

    if (code.expiresAt && code.expiresAt < new Date()) {
      throw new RedeemError('CODE_EXPIRED', 'Ce code a expiré.', 410);
    }

    const rawPlan = String(code.plan ?? 'FREE');
    if (rawPlan.toUpperCase() === 'MAX') {
      throw new RedeemError(
        'PLAN_UNKNOWN',
        'Ce code correspond à une ancienne offre non activable. Contacte le support.',
        400,
      );
    }
    const newPlan = normalizePlanId(rawPlan);
    if (!PLAN_CATALOG[newPlan]) {
      throw new RedeemError('PLAN_UNKNOWN', 'Plan associé au code inconnu.', 400);
    }

    const now = new Date();

    // 2. Find current active subscription
    const current = await tx.subscription.findUnique({ where: { userId } });

    // 3. Compute new endsAt (stacking: extend from max of current end or now)
    const base =
      current?.status === 'ACTIVE' && current.currentPeriodEnd && current.currentPeriodEnd > now
        ? current.currentPeriodEnd
        : now;
    const endsAt = new Date(base.getTime() + code.durationDays * 86_400_000);

    // 4. Determine final plan (keep the highest)
    let finalPlan: PlanId = newPlan;
    if (current?.status === 'ACTIVE' && current.plan) {
      const currentPlanId = normalizePlanId(String(current.plan));
      if (PLAN_CATALOG[currentPlanId] && comparePlans(currentPlanId, newPlan) > 0) {
        finalPlan = currentPlanId;
      }
    }

    // 5. Upsert subscription
    await tx.subscription.upsert({
      where: { userId },
      update: {
        plan: finalPlan as SubscriptionPlan,
        status: 'ACTIVE',
        currentPeriodEnd: endsAt,
        currentPeriodStart: now,
      },
      create: {
        userId,
        plan: finalPlan as SubscriptionPlan,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: endsAt,
      },
    });

    // 6. Mark code as redeemed
    await tx.activationCode.update({
      where: { id: code.id },
      data: {
        status: 'REDEEMED',
        redeemedAt: now,
        redeemedByUserId: userId,
      },
    });

    const daysLabel = code.durationDays >= 365
      ? `${Math.round(code.durationDays / 365)} an(s)`
      : `${code.durationDays} jours`;

    return {
      plan: finalPlan,
      endsAt,
      message: `Plan ${PLAN_CATALOG[finalPlan as PlanId]?.label ?? finalPlan} activé pour ${daysLabel}. Valable jusqu'au ${endsAt.toLocaleDateString('fr-FR')}.`,
    };
  });
}
