import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { BillingContextUnavailableError, getBillingContext } from '@/lib/billing/context';
import { PLAN_DISPLAY_LABELS, toPublicPlanId } from '@/lib/billing/plan-catalog';
import { getResetMessage } from '@/lib/billing/quota-messages';
import { checkQuota as checkBillingQuota } from '@/lib/billing/usage';
import { createMemoryEventRecord } from '@/lib/db/repositories/memoryRepo';
import { normalizeGeneratedEpreuve } from '@/lib/epreuves/generation-normalizer';
import { createEpreuve } from '@/lib/epreuves/repository';
import { type EpreuveType } from '@/lib/epreuves/types';
import { orchestrate } from '@/lib/llm/orchestrator';
import { logger } from '@/lib/logger';
import { createMemoryEvent } from '@/lib/memory/store';
import { searchOfficialReferences, formatRagContextForPrompt } from '@/lib/rag/search';
import { QuotaExceededError } from '@/lib/security/llm-rate-limiter';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { validateCsrf } from '@/lib/security/csrf';
import { parseJsonBody } from '@/lib/validation/request';
import { epreuveGenerateBodySchema } from '@/lib/validation/schemas';

/**
 * POST /api/v1/epreuves/generate
 * Body: { type: 'commentaire'|'dissertation'|'contraction_essai', oeuvre?: string, theme?: string }
 * Response: { epreuveId, sujet, texte, consignes, bareme, generatedAt }
 */
export async function POST(request: Request) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const limit = await checkRateLimit({ request, key: 'epreuves:generate', limit: 10, windowMs: 3_600_000 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Trop de générations d\u2019épreuves. Réessaie dans quelques minutes.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
    );
  }

  const csrfError = await validateCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  const parsed = await parseJsonBody(request, epreuveGenerateBodySchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const type = parsed.data.type as EpreuveType;
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

  // Check WRITTEN_CORRECTIONS quota upfront so the user knows
  // BEFORE writing their essay if they can actually submit it.
  // Note: OCR_COPIES is NOT checked here — generating a subject is always
  // allowed even on FREE (limit 0 for OCR). OCR quota is enforced only
  // at copy upload time (POST /epreuves/{id}/copie).
  const writtenQuota = billing.config.quotas.WRITTEN_CORRECTIONS;
  if (writtenQuota && writtenQuota.limit !== 0) {
    const availability = await checkBillingQuota(auth.user.id, 'WRITTEN_CORRECTIONS', writtenQuota);
    if (!availability.allowed) {
      return NextResponse.json(
        {
          error: `Tu as atteint la limite incluse pour les corrections écrites (${writtenQuota.limit} par mois, plan ${PLAN_DISPLAY_LABELS[billing.planId]}). Passe au plan supérieur pour générer et corriger une nouvelle épreuve.`,
          code: 'QUOTA_EXCEEDED',
          upgradeUrl: '/pricing',
          plan: toPublicPlanId(billing.planId),
          reset_info: getResetMessage('month'),
        },
        { status: 402 },
      );
    }
  }

  // Fetch RAG context for subject generation (texts, jury reports, methodology)
  const ragQuery = parsed.data.oeuvre
    ? `sujet ${type} ${parsed.data.oeuvre} ${parsed.data.theme ?? ''}`
    : `sujet ${type} EAF baccalauréat français ${parsed.data.theme ?? ''}`;
  let ragContext = '';
  try {
    const ragResults = await searchOfficialReferences(ragQuery, 4, {
      oeuvre: parsed.data.oeuvre,
    });
    ragContext = formatRagContextForPrompt(ragResults);
  } catch (error) {
    logger.error({ err: error }, 'epreuves.generate.rag.unavailable');
  }

  let result: unknown;
  try {
    result = await orchestrate({
      skill: 'coach_ecrit',
      userId: auth.user.id,
      workId: parsed.data.oeuvre,
      userQuery: `Génère un sujet de type ${type}. Œuvre : ${parsed.data.oeuvre ?? 'libre'}. Thème : ${parsed.data.theme ?? 'libre'}.`,
      context: [
        `Type demandé: ${type}.`,
        ragContext.length > 0 ? `Sources RAG disponibles:\n${ragContext}` : '',
      ].filter(Boolean).join('\n\n'),
    });
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      return NextResponse.json(
        { error: `Limite atteinte pour cette génération de sujet (${error.scope}). Réessayez plus tard.` },
        { status: 429 },
      );
    }
    throw error;
  }
  const generation = normalizeGeneratedEpreuve({
    type,
    oeuvre: parsed.data.oeuvre,
    theme: parsed.data.theme,
    generation: result as {
      sujet?: string;
      texte?: string;
      consignes?: string;
      bareme?: Record<string, number>;
    },
  });

  const epreuve = await createEpreuve({
    userId: auth.user.id,
    type,
    sujet: generation.sujet,
    texte: generation.texte,
    consignes: generation.consignes,
    bareme: generation.bareme,
  });

  try {
    await createMemoryEventRecord(
      createMemoryEvent(auth.user.id, {
        type: 'interaction',
        feature: 'epreuve_generate',
        path: '/atelier-ecrit',
        payload: {
          epreuveId: epreuve.id,
          type,
          oeuvre: parsed.data.oeuvre ?? 'libre',
        },
      }),
    );
  } catch (error) {
    logger.warn({ err: error }, 'epreuves.generate.memoryEvent.failed');
  }

  return NextResponse.json(
    {
      epreuveId: epreuve.id,
      sujet: epreuve.sujet,
      texte: epreuve.texte,
      consignes: epreuve.consignes,
      bareme: epreuve.bareme,
      generatedAt: epreuve.generatedAt,
    },
    { status: 200 },
  );
}
