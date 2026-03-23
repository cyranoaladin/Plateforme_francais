import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { validateCsrf } from '@/lib/security/csrf';
import { getMediaForAgent, formatMediaContextForPrompt, type MediaEntry } from '@/data/media-catalog';
import { createMemoryEventRecord } from '@/lib/db/repositories/memoryRepo';
import { BillingContextUnavailableError, getBillingContext } from '@/lib/billing/context';
import { PLAN_DISPLAY_LABELS, toPublicPlanId } from '@/lib/billing/plan-catalog';
import { getResetMessage } from '@/lib/billing/quota-messages';
import { orchestrate } from '@/lib/llm/orchestrator';
import { createMemoryEvent } from '@/lib/memory/store';
import { getThemeConfig } from '@/lib/quiz/theme-mapping';
import { searchOfficialReferences, type RagSearchResult } from '@/lib/rag/search';
import { consumeQuota, QuotaExceededError as BillingQuotaExceededError } from '@/lib/billing/usage';
import { parseJsonBody } from '@/lib/validation/request';
import { quizGenerateBodySchema } from '@/lib/validation/schemas';

/**
 * POST /api/v1/quiz/generate
 * Body: { theme: QuizTheme, difficulte: 1|2|3, nbQuestions: 5|10|20 }
 *
 * Pipeline:
 *   1. Resolve theme → ThemeConfig (RAG query, LLM prompt, media categories)
 *   2. RAG search: fetch relevant context chunks (external + local hybrid)
 *   3. Media filter: select videos/docs matching theme categories
 *   4. Build enriched context: RAG excerpts + media descriptions + student profile
 *   5. Orchestrate LLM call with quiz_maitre skill + enriched context
 */
export async function POST(request: Request) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const limit = await checkRateLimit({ request, key: 'quiz:generate', limit: 20, windowMs: 3_600_000 });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Trop de quiz générés. Réessaie dans quelques minutes.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
    );
  }

  const csrfError = await validateCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  const parsed = await parseJsonBody(request, quizGenerateBodySchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const { theme, difficulte, nbQuestions } = parsed.data;
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

  const quizQuota = billing.config.quotas.QUIZ_PER_DAY;
  if (quizQuota) {
    try {
      await consumeQuota(auth.user.id, 'QUIZ_PER_DAY', quizQuota);
    } catch (error) {
      if (error instanceof BillingQuotaExceededError) {
        return NextResponse.json(
          {
            error: `Tu as atteint la limite incluse pour les quiz (${error.limit} par jour, plan ${PLAN_DISPLAY_LABELS[billing.planId]}). Passe au plan supérieur pour continuer.`,
            code: 'QUOTA_EXCEEDED',
            upgradeUrl: '/pricing',
            plan: toPublicPlanId(billing.planId),
            reset_info: getResetMessage('day'),
          },
          { status: 402 },
        );
      }
      throw error;
    }
  }

  const themeConfig = getThemeConfig(theme);

  // ── Step 1: RAG search for theme-specific context ──
  let ragResults: RagSearchResult[] = [];
  try {
    ragResults = await searchOfficialReferences(
      themeConfig.ragQuery,
      6,
      {
        oeuvre: themeConfig.ragOeuvreFilter,
        parcours: themeConfig.ragParcoursFilter,
      },
    );
  } catch (err) {
    console.error('[quiz/generate] RAG search error:', err instanceof Error ? err.message : err);
  }

  const ragContext = ragResults.length > 0
    ? ragResults.map((r, i) => `[Source ${i + 1}] ${r.title}: ${r.excerpt}`).join('\n')
    : 'Aucune source RAG disponible.';

  // ── Step 2: Media context filtered by theme categories ──
  let mediaContext = '';
  try {
    const allMedia = getMediaForAgent('QUIZ_ADAPTATIF');
    const filtered: MediaEntry[] = allMedia.filter((m) =>
      themeConfig.mediaCategories.includes(m.category),
    );
    if (filtered.length > 0) {
      mediaContext = formatMediaContextForPrompt(filtered.slice(0, 3));
    }
  } catch {
    // Media context is optional
  }

  // ── Step 3: Student profile context ──
  const weakSkills = auth.user.profile.weakSkills ?? [];
  const studentContext = weakSkills.length > 0
    ? `Faiblesses de l'élève: ${weakSkills.join(', ')}.`
    : '';

  // ── Step 4: Build enriched context for LLM ──
  const enrichedContext = [
    `Thème sélectionné: ${themeConfig.label}.`,
    `Difficulté: ${difficulte}/3. Nombre de questions: ${nbQuestions}.`,
    studentContext,
    '--- SOURCES RAG (base tes questions sur ces contenus vérifiés) ---',
    ragContext,
    mediaContext ? `--- RESSOURCES PÉDAGOGIQUES ---\n${mediaContext}` : '',
    'Retourne strictement le format JSON attendu avec questions[].options (4 items) et bonneReponse (index 0-3).',
  ].filter(Boolean).join('\n');

  // ── Step 5: LLM orchestration ──
  let orchestrateResult: unknown;
  try {
    orchestrateResult = await orchestrate({
      skill: 'quiz_maitre',
      userId: auth.user.id,
      workId: themeConfig.ragOeuvreFilter,
      parcours: themeConfig.ragParcoursFilter,
      userQuery: `Génère exactement ${nbQuestions} questions QCM de niveau ${difficulte}/3.

${themeConfig.llmPromptSuffix}

IMPORTANT: Chaque question doit avoir exactement 4 options, 1 seule bonne réponse (index 0-3), et une explication pédagogique citant la source ou la règle officielle.`,
      context: enrichedContext,
    });
  } catch (err) {
    console.error('[quiz/generate] orchestrate error:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: 'Impossible de générer le quiz. Réessayez.' },
      { status: 503 },
    );
  }

  const generated = orchestrateResult as {
    questions?: Array<{
      id: string;
      enonce: string;
      options: string[];
      bonneReponse: 0 | 1 | 2 | 3;
      explication: string;
    }>;
  };

  const questions =
    generated.questions && generated.questions.length > 0
      ? generated.questions.slice(0, nbQuestions)
      : [];

  if (questions.length === 0) {
    return NextResponse.json(
      { error: 'Le générateur de quiz n\'a pas pu produire de questions. Réessayez.' },
      { status: 503 },
    );
  }

  await createMemoryEventRecord(
    createMemoryEvent(auth.user.id, {
      type: 'quiz',
      feature: 'quiz_generate',
      payload: {
        theme,
        themeLabel: themeConfig.label,
        difficulte,
        questionCount: questions.length,
        ragSourceCount: ragResults.length,
      },
    }),
  );

  return NextResponse.json({ questions, theme: themeConfig.label }, { status: 200 });
}
