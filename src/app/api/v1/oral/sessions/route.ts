import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { getBillingContext } from '@/lib/billing/context';
import { listOralSessionsByUser } from '@/lib/oral/repository';

export async function GET() {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const billing = await getBillingContext(auth.user.id);
  if (!billing.config.flags.ORAL_REPORT_HISTORY) {
    return NextResponse.json(
      { error: "L'historique oral nécessite un plan Premium ou Masterium.", upgradeUrl: '/pricing' },
      { status: 402 },
    );
  }

  const sessions = await listOralSessionsByUser(auth.user.id);
  return NextResponse.json({ sessions }, { status: 200 });
}
