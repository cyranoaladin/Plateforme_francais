import { NextResponse, type NextRequest } from 'next/server';
import { getAuthenticatedUserId } from '@/lib/auth/session';
import { getBillingContext } from '@/lib/billing/context';
import { type EntitlementKey, PLAN_DISPLAY_LABELS, toPublicPlanId } from '@/lib/billing/plan-catalog';
import { checkQuota } from '@/lib/billing/usage';

const VALID_FEATURES: Set<string> = new Set([
  'ORAL_SESSIONS', 'WRITTEN_CORRECTIONS', 'TUTOR_QUESTIONS',
  'OCR_COPIES', 'LLM_TOKENS', 'RAG_SEARCH', 'QUIZ_PER_DAY',
]);

export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 });
  }

  const feature = request.nextUrl.searchParams.get('feature');
  if (!feature || !VALID_FEATURES.has(feature)) {
    return NextResponse.json({ error: 'Fonctionnalité invalide.' }, { status: 400 });
  }

  const billing = await getBillingContext(userId);
  const quotaEntry = billing.config.quotas[feature as EntitlementKey];

  if (!quotaEntry) {
    return NextResponse.json({ allowed: true, plan: toPublicPlanId(billing.planId) });
  }

  const result = await checkQuota(userId, feature as EntitlementKey, quotaEntry);

  return NextResponse.json({
    allowed: result.allowed,
    plan: toPublicPlanId(billing.planId),
    used: result.current,
    limit: result.limit,
    remaining: result.remaining,
    planLabel: PLAN_DISPLAY_LABELS[billing.planId],
    message: result.allowed
      ? undefined
      : `Tu as atteint ta limite de ${typeof result.limit === 'number' ? result.limit : '∞'} par ${quotaEntry.period === 'day' ? 'jour' : quotaEntry.period === 'week' ? 'semaine' : 'mois'} (plan ${PLAN_DISPLAY_LABELS[billing.planId]}). Passe au plan supérieur pour continuer.`,
  });
}
