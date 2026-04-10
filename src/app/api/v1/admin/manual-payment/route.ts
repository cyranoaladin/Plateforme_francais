import { NextResponse } from 'next/server';
import { requireUserRole } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/client';
import { validateCsrf } from '@/lib/security/csrf';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { parseJsonBody } from '@/lib/validation/request';
import { z } from 'zod';
import type { SubscriptionPlan } from '@prisma/client';
import { formatPlanLabel, parseCommercialPlanId } from '@/lib/billing/plan-catalog';
import { sendSubscriptionConfirmationEmail } from '@/lib/email/service';
import { logAdminAction, getClientIp } from '@/lib/admin/audit';
import { logger } from '@/lib/logger';
import { sendMetaCapiEvent } from '@/lib/tracking/meta-capi';

const manualPaymentSchema = z.object({
  userId: z.string().uuid(),
  plan: z.enum(['PREMIUM', 'MASTERIUM']),
  amountMillimes: z.number().int().positive(),
  paymentMethod: z.enum(['VIREMENT', 'ESPECES', 'AUTRE']),
  reference: z.string().min(1),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  const { auth, errorResponse } = await requireUserRole('admin');
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const csrfError = await validateCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  const rl = await checkRateLimit({ request, key: `admin:manual-payment:${auth.user.id}`, limit: 10, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Trop de requêtes.' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } });
  }

  const parsed = await parseJsonBody(request, manualPaymentSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const { userId, plan, amountMillimes, paymentMethod, reference, notes } = parsed.data;
  const internalPlan = parseCommercialPlanId(plan);

  if (!internalPlan || internalPlan === 'FREE') {
    return NextResponse.json({ error: 'Plan de paiement manuel invalide.' }, { status: 400 });
  }

  try {
    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable.' }, { status: 404 });
    }

    // Créer la transaction de paiement
    const payment = await prisma.paymentTransaction.create({
      data: {
        userId,
        provider: 'MANUAL', // Paiement manuel (virement/espèces)
        status: 'ACCEPTED',
        plan: internalPlan as SubscriptionPlan,
        amountMillimes,
        orderRef: `MANUAL-${reference}`,
        providerRef: reference,
        callbackPayload: {
          method: paymentMethod,
          notes: notes || '',
          validatedBy: auth.user.id,
          validatedAt: new Date().toISOString(),
        },
        initiatedAt: new Date(),
        completedAt: new Date(),
      },
    });

    // Calculer les dates de période (tous les plans payants sont mensuels)
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    // Mettre à jour ou créer la subscription
    if (user.subscription) {
      await prisma.subscription.update({
        where: { id: user.subscription.id },
        data: {
          plan: internalPlan as SubscriptionPlan,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
        },
      });
    } else {
      await prisma.subscription.create({
        data: {
          userId,
          plan: internalPlan as SubscriptionPlan,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });
    }

    // Send subscription confirmation email (non-blocking)
    prisma.studentProfile.findUnique({ where: { userId }, select: { displayName: true } })
      .then((profile) => {
        const firstName = (profile?.displayName ?? '').split(/\s+/)[0] || '';
        return sendSubscriptionConfirmationEmail({
          user: { firstName, email: user.email },
          plan: internalPlan,
          transactionId: `MANUAL-${reference}`,
          startDate: now,
          nextBillingDate: periodEnd,
        });
      })
      .then((emailResult) => {
        if (emailResult && !emailResult.success) {
          logger.warn({ userId, error: emailResult.error }, 'admin:manual_payment:subscription_email_failed');
        }
      })
      .catch((err) => logger.error({ err, userId }, 'admin:manual_payment:subscription_email_error'));

    logAdminAction({ adminId: auth.user.id, action: 'payment.manual', targetType: 'user', targetId: userId, details: { plan, amountMillimes, reference, paymentMethod }, ip: getClientIp(request) });

    // Meta CAPI — Purchase event (non-blocking)
    void sendMetaCapiEvent({
      eventName: 'Purchase',
      email: user.email,
      sourceUrl: `${process.env.APP_URL ?? 'https://eaf.nexusreussite.academy'}/tarifs`,
      value: amountMillimes / 1000,
      currency: 'TND',
      contentName: plan,
      eventId: `purchase-${payment.id}`,
    });

    return NextResponse.json(
      {
        success: true,
        payment,
        message: `Paiement validé et abonnement ${formatPlanLabel(internalPlan)} activé pour l\u2019utilisateur.`,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: 'Erreur lors de la validation du paiement.' },
      { status: 500 }
    );
  }
}
