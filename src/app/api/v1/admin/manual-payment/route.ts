import { NextResponse } from 'next/server';
import { requireUserRole } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/client';
import { validateCsrf } from '@/lib/security/csrf';
import { parseJsonBody } from '@/lib/validation/request';
import { z } from 'zod';
import type { SubscriptionPlan } from '@prisma/client';

const manualPaymentSchema = z.object({
  userId: z.string().uuid(),
  plan: z.enum(['PREMIUM', 'PRO', 'MAX']),
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

  const parsed = await parseJsonBody(request, manualPaymentSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const { userId, plan, amountMillimes, paymentMethod, reference, notes } = parsed.data;

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
        provider: 'CLICTOPAY', // On utilise CLICTOPAY comme provider par défaut
        status: 'ACCEPTED',
        plan: plan as unknown as SubscriptionPlan, // Cast car MAX n'est pas dans l'enum Prisma mais existe dans le catalogue
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

    // Calculer les dates de période
    const now = new Date();
    let periodEnd: Date | null = null;

    if (plan === 'PREMIUM' || plan === 'PRO') {
      periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }
    // Pour MAX (lifetime), pas de date de fin

    // Mettre à jour ou créer la subscription
    if (user.subscription) {
      await prisma.subscription.update({
        where: { id: user.subscription.id },
        data: {
          plan: plan as unknown as SubscriptionPlan,
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
          plan: plan as unknown as SubscriptionPlan,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        payment,
        message: `Paiement validé et abonnement ${plan} activé pour l'utilisateur.`,
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
