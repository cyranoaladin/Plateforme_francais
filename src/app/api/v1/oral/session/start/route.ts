import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { createMemoryEventRecord } from '@/lib/db/repositories/memoryRepo';
import { createMemoryEvent } from '@/lib/memory/store';
import { createOralSession } from '@/lib/oral/repository';
import { pickOralExtrait } from '@/lib/oral/service';
import { validateCsrf } from '@/lib/security/csrf';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { BillingContextUnavailableError, getBillingContext } from '@/lib/billing/context';
import { PLAN_DISPLAY_LABELS } from '@/lib/billing/plan-catalog';
import { getResetMessage } from '@/lib/billing/quota-messages';
import { consumeQuota, QuotaExceededError } from '@/lib/billing/usage';
import { parseJsonBody } from '@/lib/validation/request';
import { oralSessionStartBodySchema } from '@/lib/validation/schemas';

/**
 * POST /api/v1/oral/session/start
 * Body: { oeuvre, extrait?, questionGrammaire? }
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
      key: `oral:start:${auth.user.id}`,
      limit: 3,
      windowMs: 60 * 60 * 1000,
    });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Trop de sessions orales. Réessayez dans 1 heure.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
      );
    }

    let billing: Awaited<ReturnType<typeof getBillingContext>>;
    try {
      billing = await getBillingContext(auth.user.id);
    } catch (error) {
      if (error instanceof BillingContextUnavailableError) {
        return NextResponse.json(
          { error: 'La vérification de ton abonnement est momentanément indisponible. Réessaie dans quelques minutes.' },
          { status: 503 },
        );
      }
      throw error;
    }

    const oralQuota = billing.config.quotas.ORAL_SESSIONS;
    if (oralQuota) {
      try {
        await consumeQuota(auth.user.id, 'ORAL_SESSIONS', oralQuota);
      } catch (err) {
        if (err instanceof QuotaExceededError) {
          return NextResponse.json(
            {
              error: `Tu as atteint la limite incluse pour l'oral (${err.limit} sessions par ${oralQuota.period === 'day' ? 'jour' : oralQuota.period === 'week' ? 'semaine' : 'mois'}, plan ${PLAN_DISPLAY_LABELS[billing.planId]}). Tes données restent en place. Passe au plan supérieur pour relancer une simulation tout de suite.`,
              code: 'QUOTA_EXCEEDED',
              upgradeUrl: '/pricing',
              plan: billing.planId,
              reset_info: getResetMessage(oralQuota.period),
            },
            { status: 402 },
          );
        }
        throw err;
      }
    }

    const parsed = await parseJsonBody(request, oralSessionStartBodySchema);
    if (!parsed.success) {
      return parsed.response;
    }

    let selected;
    try {
      selected = await pickOralExtrait({
        oeuvre: parsed.data.oeuvre,
        userId: auth.user.id,
        mode: parsed.data.mode as 'SIMULATION' | 'FREE_PRACTICE',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la sélection de l\'extrait';
      console.error('[oral/start] pickOralExtrait error:', message);
      return NextResponse.json(
        { error: message },
        { status: 400 }
      );
    }
    const texte = parsed.data.extrait ?? selected.texte;
    const questionGrammaire = parsed.data.questionGrammaire ?? selected.questionGrammaire;
    const phraseGrammaire = selected.phraseGrammaire;
    const oeuvreChoisie = parsed.data.oeuvre;

    let session;
    try {
      session = await createOralSession({
        userId: auth.user.id,
        oeuvre: oeuvreChoisie,
        extrait: texte,
        questionGrammaire,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la création de la session';
      console.error('[oral/start] createOralSession error:', message, err);
      return NextResponse.json(
        { error: `Erreur création session: ${message}` },
        { status: 500 }
      );
    }

    await createMemoryEventRecord(
      createMemoryEvent(auth.user.id, {
        type: 'interaction',
        feature: 'oral_session_start',
        path: '/atelier-oral',
        payload: {
          sessionId: session.id,
          oeuvre: oeuvreChoisie,
          mode: parsed.data.mode ?? 'SIMULATION',
        },
      }),
    );

    return NextResponse.json(
      {
        sessionId: session.id,
        texte,
        questionGrammaire,
        phraseGrammaire,
        oeuvreChoisie,
        instructions:
          'Suivez les 4 étapes officielles : lecture (2 min), explication (8 min), grammaire (2 min), entretien (8 min sur l\'oeuvre choisie).',
      },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur interne du serveur';
    console.error('[oral/start] Unhandled error:', message, err);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
