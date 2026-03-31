import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { getBillingContext } from '@/lib/billing/context';
import { listOralSessionsByUser } from '@/lib/oral/repository';

export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const rawLimit = Number.parseInt(url.searchParams.get('limit') ?? '20', 10);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 20;
  const cursor = url.searchParams.get('cursor') ?? undefined;

  const sessions = await listOralSessionsByUser(auth.user.id, { limit, cursor });
  const nextCursor = sessions.length === limit ? sessions.at(-1)?.id ?? null : null;
  const safeSessions = sessions.map((session) => ({
    id: session.id,
    status: session.status,
    mode: session.mode,
    oeuvre: session.oeuvre,
    score: session.score,
    maxScore: session.maxScore,
    createdAt: session.createdAt,
    endedAt: session.endedAt,
    finalFeedback: session.finalFeedback,
  }));

  return NextResponse.json({ sessions: safeSessions, nextCursor }, { status: 200 });
}
