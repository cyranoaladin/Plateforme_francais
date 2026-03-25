import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { createMemoryEventRecord } from '@/lib/db/repositories/memoryRepo';
import { validateCsrf } from '@/lib/security/csrf';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { redeemActivationCode, RedeemError } from '@/lib/billing/redeem';
import { toPublicPlanId } from '@/lib/billing/plan-catalog';
import { prisma } from '@/lib/db/client';
import { sendSubscriptionConfirmationEmail } from '@/lib/email/service';
import { logger } from '@/lib/logger';
import { createMemoryEvent } from '@/lib/memory/store';
import { parseJsonBody } from '@/lib/validation/request';
import { redeemCodeBodySchema } from '@/lib/validation/schemas';

/**
 * POST /api/v1/billing/redeem-code
 * Body: { code: string }
 *
 * Activates a voucher code and upgrades the user's subscription.
 * Protected by CSRF + rate-limit (5 attempts per hour per user).
 *
 * Responses:
 *   200 — { plan, endsAt, message }
 *   400 — code invalid / malformed
 *   402 — (reserved for paywall, not used here)
 *   409 — code already used / revoked
 *   410 — code expired
 *   429 — rate limited
 */
export async function POST(request: Request) {
  try {
    const { auth, errorResponse } = await requireAuthenticatedUser();
    if (!auth || errorResponse) {
      return errorResponse;
    }

    const csrfError = await validateCsrf(request);
    if (csrfError) {
      return csrfError;
    }

    const rl = await checkRateLimit({
      request,
      key: `billing:redeem:${auth.user.id}`,
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Trop de tentatives. Réessaie plus tard.', code: 'RATE_LIMITED' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
      );
    }

    const parsed = await parseJsonBody(request, redeemCodeBodySchema);
    if (!parsed.success) return parsed.response;

    const result = await redeemActivationCode(auth.user.id, parsed.data.code);

    logger.info(
      { userId: auth.user.id, plan: result.plan, endsAt: result.endsAt },
      'billing:code_redeemed',
    );

    await createMemoryEventRecord(
      createMemoryEvent(auth.user.id, {
        type: 'interaction',
        feature: 'subscription_redeem_code',
        path: '/pricing',
        payload: {
          plan: toPublicPlanId(result.plan),
        },
      }),
    ).catch(() => undefined);

    // Send subscription confirmation email (non-blocking)
    prisma.user.findUnique({ where: { id: auth.user.id }, select: { email: true, profile: { select: { displayName: true } } } })
      .then((user) => {
        if (!user) return;
        const firstName = (user.profile?.displayName ?? '').split(/\s+/)[0] || '';
        return sendSubscriptionConfirmationEmail({
          user: { firstName, email: user.email },
          plan: result.plan,
          transactionId: `CODE-${parsed.data.code.slice(0, 8).toUpperCase()}`,
          startDate: new Date(),
          nextBillingDate: result.endsAt,
        });
      })
      .then((emailResult) => {
        if (emailResult && !emailResult.success) {
          logger.warn({ userId: auth.user.id, error: emailResult.error }, 'billing:redeem_code:subscription_email_failed');
        }
      })
      .catch((err) => logger.error({ err, userId: auth.user.id }, 'billing:redeem_code:subscription_email_error'));

    return NextResponse.json(
      {
        plan: toPublicPlanId(result.plan),
        endsAt: result.endsAt.toISOString(),
        message: result.message,
      },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof RedeemError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.httpStatus },
      );
    }

    logger.error(
      { error: err instanceof Error ? err.message : String(err) },
      'billing:redeem_code:unhandled_error',
    );

    return NextResponse.json(
      { error: 'Erreur interne. Réessaie dans quelques instants.' },
      { status: 500 },
    );
  }
}
