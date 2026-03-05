import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { validateCsrf } from '@/lib/security/csrf';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { redeemActivationCode, RedeemError } from '@/lib/billing/redeem';
import { logger } from '@/lib/logger';

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

    let body: { code?: string };
    try {
      body = (await request.json()) as { code?: string };
    } catch {
      return NextResponse.json(
        { error: 'Corps de requête invalide.', code: 'INVALID_BODY' },
        { status: 400 },
      );
    }

    if (!body.code || typeof body.code !== 'string' || body.code.trim().length === 0) {
      return NextResponse.json(
        { error: 'Le champ "code" est requis.', code: 'MISSING_CODE' },
        { status: 400 },
      );
    }

    const result = await redeemActivationCode(auth.user.id, body.code);

    logger.info(
      { userId: auth.user.id, plan: result.plan, endsAt: result.endsAt },
      'billing:code_redeemed',
    );

    return NextResponse.json(
      {
        plan: result.plan,
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
