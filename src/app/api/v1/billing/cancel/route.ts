import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { validateCsrf } from '@/lib/security/csrf';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { prisma } from '@/lib/db/client';
import { getBillingContext } from '@/lib/billing/context';
import { formatPlanLabel } from '@/lib/billing/plan-catalog';
import { logger } from '@/lib/logger';

/**
 * POST /api/v1/billing/cancel
 *
 * Cancels the authenticated user's paid subscription at the end of the
 * current billing period.  The user keeps access until `currentPeriodEnd`,
 * after which `getBillingContext` will automatically fall back to FREE.
 *
 * Responses:
 *   200 — { ok, accessUntil }
 *   400 — user is already on the free plan or already scheduled for cancellation
 *   401 — not authenticated
 *   403 — CSRF validation failed
 *   429 — rate limited
 *   500 — unexpected error
 */
export async function POST(request: Request) {
  try {
    // ── Auth ──────────────────────────────────────────────
    const { auth, errorResponse } = await requireAuthenticatedUser();
    if (!auth || errorResponse) {
      return errorResponse;
    }

    // ── CSRF ─────────────────────────────────────────────
    const csrfError = await validateCsrf(request);
    if (csrfError) {
      return csrfError;
    }

    // ── Rate-limit ───────────────────────────────────────
    const rl = await checkRateLimit({
      request,
      key: `billing:cancel:${auth.user.id}`,
      limit: 5,
      windowMs: 60 * 60 * 1000, // 5 per hour
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Réessaie plus tard.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
      );
    }

    const userId = auth.user.id;

    // ── Billing context ──────────────────────────────────
    const billing = await getBillingContext(userId);

    if (billing.planId === 'FREE') {
      return NextResponse.json(
        { error: 'Vous êtes déjà sur le plan Freemium. Rien à annuler.' },
        { status: 400 },
      );
    }

    // ── Load subscription row ────────────────────────────
    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      // Defensive: billing context said paid but no row exists
      return NextResponse.json(
        { error: 'Aucun abonnement actif trouvé.' },
        { status: 400 },
      );
    }

    if (subscription.cancelAtPeriodEnd) {
      return NextResponse.json(
        {
          error: 'L\u2019annulation est déjà programmée.',
          accessUntil: subscription.currentPeriodEnd?.toISOString() ?? null,
        },
        { status: 400 },
      );
    }

    // ── Schedule cancellation at period end ──────────────
    // If there is no period end (edge case), downgrade immediately.
    const now = new Date();
    const hasValidPeriodEnd =
      subscription.currentPeriodEnd && subscription.currentPeriodEnd > now;

    if (hasValidPeriodEnd) {
      // Graceful: keep access until end of current period
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          cancelAtPeriodEnd: true,
        },
      });
    } else {
      // No valid future period — downgrade immediately
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          plan: 'FREE',
          status: 'CANCELED',
          cancelAtPeriodEnd: false,
        },
      });
    }

    const accessUntil = hasValidPeriodEnd
      ? subscription.currentPeriodEnd!.toISOString()
      : now.toISOString();

    // ── Log ──────────────────────────────────────────────
    logger.info(
      {
        userId,
        previousPlan: subscription.plan,
        cancelAtPeriodEnd: hasValidPeriodEnd,
        accessUntil,
      },
      `billing:cancel — ${formatPlanLabel(subscription.plan)} subscription cancelled`,
    );

    return NextResponse.json({
      ok: true,
      accessUntil,
    });
  } catch (err) {
    logger.error({ err }, 'billing:cancel:unexpected_error');
    return NextResponse.json(
      { error: 'Erreur lors de l\u2019annulation de l\u2019abonnement.' },
      { status: 500 },
    );
  }
}
