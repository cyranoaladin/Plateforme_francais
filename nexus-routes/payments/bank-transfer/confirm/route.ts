import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !['ADMIN', 'ASSISTANTE'].includes(session.user?.role ?? '')) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const { paymentId, confirmedAmount, notes } = await req.json();
  if (!paymentId) return NextResponse.json({ error: 'paymentId requis' }, { status: 400 });

  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status: 'VALIDATED',
      confirmedAmount: confirmedAmount,
      notes: notes,
      validatedAt: new Date(),
      validatedBy: session.user?.id,
    },
    include: { user: true },
  });

  await prisma.subscription.upsert({
    where: { userId: payment.userId },
    update: { status: 'ACTIVE', expiresAt: new Date(Date.now() + 30 * 86400000) },
    create: {
      userId: payment.userId,
      status: 'ACTIVE',
      plan: payment.plan ?? 'BASIC',
      expiresAt: new Date(Date.now() + 30 * 86400000),
    },
  });

  return NextResponse.json({ payment, message: 'Virement confirmé, abonnement activé' });
}
