import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { createMemoryEventRecord } from '@/lib/db/repositories/memoryRepo';
import { orchestrate } from '@/lib/llm/orchestrator';
import { createLlmStream } from '@/lib/llm/streaming';
import { createMemoryEvent } from '@/lib/memory/store';
import { searchOfficialReferences } from '@/lib/rag/search';
import { validateCsrf } from '@/lib/security/csrf';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { BillingContextUnavailableError, getBillingContext } from '@/lib/billing/context';
import { PLAN_DISPLAY_LABELS } from '@/lib/billing/plan-catalog';
import { getResetMessage } from '@/lib/billing/quota-messages';
import { consumeQuota, QuotaExceededError as BillingQuotaExceededError } from '@/lib/billing/usage';
import { sanitizeString } from '@/lib/security/sanitize';
import { checkLLMQuota, QuotaExceededError } from '@/lib/security/llm-rate-limiter';
import { parseJsonBody } from '@/lib/validation/request';
import { tuteurMessageBodySchema } from '@/lib/validation/schemas';

/**
 * POST /api/v1/tuteur/message
 * Body: { message, conversationHistory }
 */
export async function POST(request: Request) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const csrfError = await validateCsrf(request);
  if (csrfError) {
    return csrfError;
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

  const tutorQuota = billing.config.quotas.TUTOR_QUESTIONS;
  if (tutorQuota) {
    try {
      await consumeQuota(auth.user.id, 'TUTOR_QUESTIONS', tutorQuota);
    } catch (err) {
      if (err instanceof BillingQuotaExceededError) {
        return NextResponse.json(
          {
            error: `Tu as atteint la limite incluse pour le tuteur (${err.limit} messages par jour, plan ${PLAN_DISPLAY_LABELS[billing.planId]}). La conversation n'est pas perdue. Passe au plan supérieur pour continuer maintenant.`,
            code: 'QUOTA_EXCEEDED',
            upgradeUrl: '/pricing',
            plan: billing.planId,
            reset_info: getResetMessage('day'),
          },
          { status: 402 },
        );
      }
      throw err;
    }
  }

  const rl = await checkRateLimit({
    request,
    key: `tuteur:msg:${auth.user.id}`,
    limit: 30,
    windowMs: 60 * 60 * 1000,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Trop de messages. Réessayez dans quelques minutes.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const parsed = await parseJsonBody(request, tuteurMessageBodySchema);
  if (!parsed.success) {
    return parsed.response;
  }
  const { searchParams } = new URL(request.url);
  const wantsStream =
    searchParams.get('stream') === '1' ||
    request.headers.get('accept')?.includes('text/event-stream') === true;

  // ✅ SANITIZATION des inputs utilisateur
  const userMessage = sanitizeString(parsed.data.message, { maxLength: 4000, allowHtml: false });
  const workId = parsed.data.workId
    ? sanitizeString(parsed.data.workId, { maxLength: 200, allowHtml: false })
    : undefined;
  const parcours = parsed.data.parcours
    ? sanitizeString(parsed.data.parcours, { maxLength: 200, allowHtml: false })
    : undefined;
  const sessionId = parsed.data.sessionId
    ? sanitizeString(parsed.data.sessionId, { maxLength: 120, allowHtml: false })
    : undefined;
  const conversationHistory = (parsed.data.conversationHistory ?? []).map(item => ({
    role: item.role as 'user' | 'assistant',
    content: sanitizeString(item.content, { maxLength: 4000, allowHtml: false }),
  }));

  const lower = userMessage.toLowerCase();
  const asksFullCopy =
    (lower.includes('rédige') || lower.includes('fais')) &&
    (lower.includes('dissertation complète') || lower.includes('commentaire complet') || lower.includes('copie complète'));

  if (asksFullCopy) {
    if (wantsStream) {
      const encoder = new TextEncoder();
      const text =
        "Je ne peux pas rédiger une copie complète à ta place. Je peux te guider étape par étape\u00a0: problématique, plan, puis amélioration paragraphe par paragraphe.";
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          for (const token of text.split(' ')) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: `${token} ` })}\n\n`));
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        },
      });
      return new NextResponse(stream, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      });
    }

    return NextResponse.json(
      {
        answer:
          "Je ne peux pas rédiger une copie complète à ta place. Je peux en revanche te guider étape par étape: problématique, plan, puis amélioration paragraphe par paragraphe.",
        citations: [],
        suggestions: [
          'Aide-moi à formuler une problématique.',
          'Propose un plan détaillé sur ce sujet.',
          'Corrige mon introduction.',
        ],
      },
      { status: 200 },
    );
  }

  const refs = await searchOfficialReferences(userMessage, 4);
  const context = refs
    .map((ref, index) => `[${index + 1}] ${ref.title} (${ref.id})\n${ref.excerpt}`)
    .join('\n\n');

  const historyText = conversationHistory
    .map((item) => `${item.role}: ${item.content}`)
    .join('\n');

  const pedagogicalContext = [
    workId ? `Œuvre ciblée: ${workId}` : '',
    parcours ? `Parcours ciblé: ${parcours}` : '',
  ].filter(Boolean).join('\n');

  const citations = refs.map((ref, index) => ({
    index: index + 1,
    title: ref.title,
    source: ref.sourceRef ?? ref.type,
  }));

  if (wantsStream) {
    try {
      await checkLLMQuota(auth.user.id, 'tuteur_libre');
    } catch (error) {
      if (error instanceof QuotaExceededError) {
        return NextResponse.json(
          { error: `Limite atteinte pour ce type d'accompagnement (${error.scope}). Réessayez plus tard.` },
          { status: 429 },
        );
      }
      throw error;
    }

    const messages = [
      {
        role: 'system' as const,
        content:
          'Tu es un tuteur EAF. Réponds en français clair et structuré, sans URL, avec méthode concrète.',
      },
      {
        role: 'user' as const,
        content: [pedagogicalContext, `Historique:\n${historyText}`, `Sources RAG:\n${context}`, `Question élève:\n${userMessage}`]
          .filter(Boolean)
          .join('\n\n'),
      },
    ];

    await createMemoryEventRecord(
      createMemoryEvent(auth.user.id, {
        type: 'discussion',
        feature: 'tuteur_message_stream',
        payload: {
          citations: citations.length,
          workId: workId ?? 'none',
          parcours: parcours ?? 'none',
          sessionId: sessionId ?? 'none',
          historyCount: conversationHistory.length,
        },
      }),
    );

    return new NextResponse(
      createLlmStream({
        skill: 'tuteur_libre',
        userId: auth.user.id,
        sessionId,
        workId,
        parcours,
        ragSourcesCount: citations.length,
        contextSummary: [pedagogicalContext, `Historique:\n${historyText}`, `Sources RAG:\n${context}`].filter(Boolean).join('\n\n'),
        messages,
        options: { temperature: 0.2 },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
        },
      },
    );
  }

  let orchestrateResult: unknown;
  try {
    orchestrateResult = await orchestrate({
      skill: 'tuteur_libre',
      userId: auth.user.id,
      userQuery: userMessage,
      workId,
      parcours,
      context: [pedagogicalContext, `Historique:\n${historyText}`, `Sources RAG:\n${context}`].filter(Boolean).join('\n\n'),
    });
  } catch (error) {
    if (error instanceof QuotaExceededError) {
      return NextResponse.json(
        { error: `Limite atteinte pour ce type d'accompagnement (${error.scope}). Réessayez plus tard.` },
        { status: 429 },
      );
    }
    throw error;
  }
  const generated = orchestrateResult as {
    answer?: string;
    suggestions?: string[];
  };

  await createMemoryEventRecord(
    createMemoryEvent(auth.user.id, {
      type: 'discussion',
      feature: 'tuteur_message',
      payload: {
        citations: citations.length,
        workId: workId ?? 'none',
        parcours: parcours ?? 'none',
        sessionId: sessionId ?? 'none',
        historyCount: conversationHistory.length,
      },
    }),
  );

  return NextResponse.json(
    {
      answer: generated.answer ?? 'Je n\'ai pas assez de sources pour répondre précisément. Reformule ta question.',
      citations,
      suggestions:
        generated.suggestions?.slice(0, 3) ?? [
          'Peux-tu me rappeler la méthode du commentaire ?',
          'Donne-moi un mini quiz de grammaire.',
          'Comment améliorer ma conclusion ?',
        ],
    },
    { status: 200 },
  );
}
