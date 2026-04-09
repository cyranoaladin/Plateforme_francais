import { NextResponse } from 'next/server';
import { requireUserRole } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/client';
import { validateCsrf } from '@/lib/security/csrf';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { parseJsonBody } from '@/lib/validation/request';
import { z } from 'zod';
import type { SubscriptionPlan } from '@prisma/client';
import { formatPlanLabel } from '@/lib/billing/plan-catalog';
import { sendSubscriptionConfirmationEmail } from '@/lib/email/service';
import { logAdminAction, getClientIp } from '@/lib/admin/audit';
import { logger } from '@/lib/logger';

const confirmOrderSchema = z.object({
  orderId: z.string().uuid(),
});

/**
 * POST /api/v1/admin/orders/confirm
 * Body: { orderId: string }
 *
 * Admin-only endpoint that confirms a pending order:
 * - Sets PaymentTransaction status to ACCEPTED
 * - Activates or upgrades the user's subscription
 * - Sends confirmation email
 */
export async function POST(request: Request) {
  const { auth, errorResponse } = await requireUserRole('admin');
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const csrfError = await validateCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  const rl = await checkRateLimit({
    request,
    key: `admin:orders-confirm:${auth.user.id}`,
    limit: 30,
    windowMs: 60_000,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Trop de requêtes.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const parsed = await parseJsonBody(request, confirmOrderSchema);
  if (!parsed.success) return parsed.response;

  const { orderId } = parsed.data;

  try {
    const payment = await prisma.paymentTransaction.findUnique({
      where: { id: orderId },
      include: { user: { include: { subscription: true, profile: true } } },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Commande introuvable.' }, { status: 404 });
    }

    if (payment.status === 'ACCEPTED') {
      return NextResponse.json({ error: 'Cette commande est déjà confirmée.' }, { status: 409 });
    }

    if (payment.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Impossible de confirmer une commande au statut ${payment.status}.` },
        { status: 400 },
      );
    }

    // Mark as paid
    await prisma.paymentTransaction.update({
      where: { id: orderId },
      data: {
        status: 'ACCEPTED',
        completedAt: new Date(),
        callbackPayload: {
          confirmedBy: auth.user.id,
          confirmedAt: new Date().toISOString(),
        },
      },
    });

    // Activate / upgrade subscription
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const internalPlan = payment.plan as SubscriptionPlan;

    if (payment.user.subscription) {
      await prisma.subscription.update({
        where: { id: payment.user.subscription.id },
        data: {
          plan: internalPlan,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
        },
      });
    } else {
      await prisma.subscription.create({
        data: {
          userId: payment.userId,
          plan: internalPlan,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });
    }

    // Send confirmation email (non-blocking)
    const firstName = (payment.user.profile?.displayName ?? '').split(/\s+/)[0] || '';
    sendSubscriptionConfirmationEmail({
      user: { firstName, email: payment.user.email },
      plan: payment.plan,
      transactionId: payment.orderRef,
      startDate: now,
      nextBillingDate: periodEnd,
    })
      .then((emailResult) => {
        if (emailResult && !emailResult.success) {
          logger.warn(
            { userId: payment.userId, error: emailResult.error },
            'admin:order_confirm:subscription_email_failed',
          );
        }
      })
      .catch((err) =>
        logger.error({ err, userId: payment.userId }, 'admin:order_confirm:subscription_email_error'),
      );

    logger.info(
      {
        orderId,
        userId: payment.userId,
        plan: payment.plan,
        orderRef: payment.orderRef,
        confirmedBy: auth.user.id,
      },
      'admin:order_confirmed',
    );
    logAdminAction({ adminId: auth.user.id, action: 'payment.confirm', targetType: 'payment', targetId: orderId, details: { userId: payment.userId, plan: payment.plan, orderRef: payment.orderRef }, ip: getClientIp(request) });

    return NextResponse.json(
      {
        ok: true,
        message: `Commande ${payment.orderRef} confirmée — abonnement ${formatPlanLabel(payment.plan)} activé.`,
      },
      { status: 200 },
    );
  } catch (err) {
    logger.error(
      { error: err instanceof Error ? err.message : String(err), orderId },
      'admin:order_confirm:unhandled_error',
    );
    return NextResponse.json(
      { error: 'Erreur lors de la confirmation de la commande.' },
      { status: 500 },
    );
  }
}
