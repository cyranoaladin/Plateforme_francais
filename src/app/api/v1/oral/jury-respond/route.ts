import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { createMemoryEventRecord } from '@/lib/db/repositories/memoryRepo';
import { orchestrate } from '@/lib/llm/orchestrator';
import { createMemoryEvent } from '@/lib/memory/store';
import { validateCsrf } from '@/lib/security/csrf';
import { parseJsonBody } from '@/lib/validation/request';
import { z } from 'zod';
import { generateTtsUrl } from '@/lib/tts/generator';
import { buildExaminerPersonaContext } from '@/lib/oral/examiner-context';
import { buildOralRagContext } from '@/lib/oral/rag-context';

const bodySchema = z.object({
  message: z.string().trim().min(1).max(4000),
  oeuvreChoisie: z.string().trim().max(200).optional(),
  examinerProfile: z.enum(['BIENVEILLANT', 'NEUTRE', 'HOSTILE']).optional(),
  conversationHistory: z.array(
    z.object({
      role: z.enum(['jury', 'eleve']),
      content: z.string().trim().min(1).max(1000),
    }),
  ).max(20).optional(),
});

export async function POST(request: Request) {
  const { auth, errorResponse } = await requireAuthenticatedUser();
  if (!auth || errorResponse) {
    return errorResponse;
  }

  const csrfError = await validateCsrf(request);
  if (csrfError) {
    return csrfError;
  }

  const parsed = await parseJsonBody(request, bodySchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const profile = parsed.data.examinerProfile ?? 'NEUTRE';
  const history = parsed.data.conversationHistory ?? [];
  const memoryContext = history
    .slice(-6)
    .map((item, idx) => `${idx + 1}. [${item.role}] ${item.content}`)
    .join('\n');

  const personaContext = buildExaminerPersonaContext(profile);
  const ragContext = await buildOralRagContext({
    phase: 'JURY',
    oeuvreChoisie: parsed.data.oeuvreChoisie,
    transcript: parsed.data.message,
  });

  let juryText = 'Peux-tu préciser ton argument avec un exemple du texte ?';
  try {
    const result = (await orchestrate({
      skill: 'examinateur_virtuel',
      userId: auth.user.id,
      workId: parsed.data.oeuvreChoisie,
      userQuery: parsed.data.message,
      context: [
        parsed.data.oeuvreChoisie ? `Œuvre choisie : ${parsed.data.oeuvreChoisie}` : '',
        `Persona examinateur: ${profile}`,
        personaContext,
        `Historique récent:\n${memoryContext || 'Aucun échange précédent.'}`,
        ragContext.promptContext ? `Contexte officiel (RAG):\n${ragContext.promptContext}` : '',
        'Objectif: produire UNE relance imprévisible mais pertinente en tenant compte des réponses précédentes.',
      ].filter(Boolean).join('\n\n'),
    })) as {
      questions?: Array<{ question: string; difficulte: number }>;
      consigne_examinateur?: string;
    };

    const questions = Array.isArray(result.questions) ? result.questions : [];
    if (questions.length > 0) {
      const targetDifficulty = Math.min(3, 1 + Math.floor(history.length / 2));
      const picked = questions
        .slice()
        .sort((a, b) => Math.abs((a.difficulte ?? 1) - targetDifficulty) - Math.abs((b.difficulte ?? 1) - targetDifficulty))[0];
      juryText = picked?.question ?? juryText;
    } else if (result.consigne_examinateur) {
      juryText = result.consigne_examinateur;
    }
  } catch {
    const fallback = (await orchestrate({
      skill: 'oral_entretien',
      userId: auth.user.id,
      workId: parsed.data.oeuvreChoisie,
      userQuery: parsed.data.message,
      context: parsed.data.oeuvreChoisie ? `Œuvre choisie : ${parsed.data.oeuvreChoisie}` : undefined,
    })) as { feedback?: string; relance?: string };
    juryText = fallback.relance ?? fallback.feedback ?? juryText;
  }

  const ttsUrl = await generateTtsUrl(juryText);

  await createMemoryEventRecord(
    createMemoryEvent(auth.user.id, {
      type: 'discussion',
      feature: 'oral_jury_respond',
      path: '/atelier-oral',
      payload: {
        historyCount: history.length,
        oeuvreChoisie: parsed.data.oeuvreChoisie ?? 'non_renseignee',
        ttsAvailable: ttsUrl !== null,
      },
    }),
  ).catch(() => undefined);

  return NextResponse.json(
    {
      juryText,
      ttsUrl,
      useWebSpeech: ttsUrl === null,
    },
    { status: 200 },
  );
}
