import { NextResponse } from 'next/server';
import { requireUserRole } from '@/lib/auth/guard';
import { validateCsrf } from '@/lib/security/csrf';
import { prisma } from '@/lib/db/client';
import { normalizePlanId } from '@nexus-eaf/shared-billing';
import { logAdminAction, getClientIp } from '@/lib/admin/audit';
import { sendSubscriptionConfirmationEmail } from '@/lib/email/service';
import { logger } from '@/lib/logger';

export async function PATCH(request: Request) {
  const csrfError = await validateCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  const { auth, errorResponse } = await requireUserRole('admin');
  if (!auth || errorResponse) {
    return errorResponse;
  }

  try {
    const { userId, plan } = await request.json();

    if (!userId || !plan) {
      return NextResponse.json(
        { error: 'userId et plan sont requis' },
        { status: 400 }
      );
    }

    // Validate plan
    const normalizedPlan = normalizePlanId(plan);
    if (!['FREE', 'PREMIUM', 'PRO'].includes(normalizedPlan)) {
      return NextResponse.json(
        { error: 'Plan invalide' },
        { status: 400 }
      );
    }

    // Update or create subscription
    const subscription = await prisma.subscription.upsert({
      where: { userId },
      update: {
        plan: normalizedPlan,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        updatedAt: new Date(),
      },
      create: {
        userId,
        plan: normalizedPlan,
        status: 'ACTIVE',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    logAdminAction({ adminId: auth.user.id, action: 'user.plan-change', targetType: 'user', targetId: userId, details: { plan: normalizedPlan }, ip: getClientIp(request) });

    // Notify user by email (non-blocking)
    prisma.user.findUnique({ where: { id: userId }, select: { email: true, profile: { select: { displayName: true } } } })
      .then((user) => {
        if (!user) return;
        const firstName = (user.profile?.displayName ?? '').split(/\s+/)[0] || '';
        return sendSubscriptionConfirmationEmail({
          user: { firstName, email: user.email },
          plan: normalizedPlan,
          transactionId: `ADMIN-${Date.now()}`,
          startDate: new Date(),
          nextBillingDate: subscription.currentPeriodEnd ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
      })
      .then((r) => { if (r && !r.success) logger.warn({ userId, error: r.error }, 'admin.plan_change.email_failed'); })
      .catch((err) => logger.error({ err, userId }, 'admin.plan_change.email_error'));

    return NextResponse.json({
      success: true,
      subscription,
      message: `Plan mis à jour vers ${normalizedPlan} avec succès`,
    }, { status: 200 });

  } catch (error) {
    logger.error({ error }, 'admin.users.plan.failed');
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du plan' },
      { status: 500 }
    );
  }
}
