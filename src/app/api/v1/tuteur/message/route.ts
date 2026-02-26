import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { createMemoryEventRecord } from '@/lib/db/repositories/memoryRepo';
import { orchestrate } from '@/lib/llm/orchestrator';
import { createMemoryEvent } from '@/lib/memory/store';
import { searchOfficialReferences } from '@/lib/rag/search';
import { validateCsrf } from '@/lib/security/csrf';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { requirePlan, incrementUsage } from '@/lib/billing/gating';
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

  const gate = await requirePlan(auth.user.id, 'tuteurMessagesPerDay');
  if (!gate.allowed) {
    return NextResponse.json(
      { error: 'Quota de messages atteint. Passez au plan premium pour un accès illimité.', upgradeUrl: gate.upgradeUrl },
      { status: 403 },
    );
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

  const userMessage = parsed.data.message;
  const lower = userMessage.toLowerCase();
  const asksFullCopy =
    (lower.includes('rédige') || lower.includes('fais')) &&
    (lower.includes('dissertation complète') || lower.includes('commentaire complet') || lower.includes('copie complète'));

  if (asksFullCopy) {
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
    .map((ref, index) => `[${index + 1}] ${ref.title} (${ref.sourceRef})\n${ref.excerpt}`)
    .join('\n\n');

  const historyText = (parsed.data.conversationHistory ?? [])
    .map((item) => `${item.role}: ${item.content}`)
    .join('\n');

  const orchestrateResult = await orchestrate({
    skill: 'tuteur_libre',
    userId: auth.user.id,
    userQuery: userMessage,
    context: `Historique:\n${historyText}\n\nSources RAG:\n${context}`,
  });
  const generated = orchestrateResult.output as {
    answer?: string;
    suggestions?: string[];
  };

  const citations = refs.map((ref, index) => ({
    index: index + 1,
    title: ref.title,
    source: ref.type,
  }));

  await incrementUsage(auth.user.id, 'tuteurMessagesPerDay');

  await createMemoryEventRecord(
    createMemoryEvent(auth.user.id, {
      type: 'discussion',
      feature: 'tuteur_message',
      payload: {
        citations: citations.length,
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
