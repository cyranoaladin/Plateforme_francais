import { NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { validateCsrf } from '@/lib/security/csrf';
import { checkRateLimit } from '@/lib/security/rate-limit';
import { orchestrate } from '@/lib/llm/orchestrator';
import { type Skill } from '@/lib/llm/skills/types';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { parseJsonBody } from '@/lib/validation/request';

const juryRespondBodySchema = z.object({
  sessionId: z.string().min(1),
  phase: z.enum(['lecture', 'explication', 'grammaire', 'entretien']),
  studentResponse: z.string().min(1).max(8000),
  ttsEnabled: z.boolean().optional().default(false),
});

const PHASE_TO_SKILL: Record<string, Skill> = {
  lecture: 'coach_lecture',
  explication: 'coach_explication',
  grammaire: 'grammaire_ciblee',
  entretien: 'oral_entretien',
};

/**
 * POST /api/v1/oral/jury-respond
 * Receives a student's oral answer, generates jury feedback, optionally returns TTS audio URL.
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

  const rl = await checkRateLimit({
    request,
    key: `jury:${auth.user.id}`,
    limit: 15,
    windowMs: 60 * 1000,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Trop de requêtes jury. Réessayez dans quelques secondes.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const parsed = await parseJsonBody(request, juryRespondBodySchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const { sessionId, phase, studentResponse, ttsEnabled } = parsed.data;
  const skill = PHASE_TO_SKILL[phase] ?? 'oral_entretien';

  try {
    const result = await orchestrate({
      skill,
      userId: auth.user.id,
      userQuery: studentResponse,
      context: `Phase orale: ${phase}. SessionId: ${sessionId}.`,
    });

    const output = result.output as {
      feedback?: string;
      score?: number;
      max?: number;
      points_forts?: string[];
      axes?: string[];
      relance?: string;
    };

    let ttsAudioUrl: string | null = null;
    if (ttsEnabled && output.feedback) {
      try {
        const { generateTtsUrl } = await import('@/lib/tts/generator');
        ttsAudioUrl = await generateTtsUrl(output.feedback, { voice: 'jury_fr' });
      } catch (err) {
        logger.warn({ err, sessionId, phase }, 'jury_respond.tts_unavailable');
      }
    }

    return NextResponse.json({
      sessionId,
      phase,
      feedback: output.feedback ?? 'Analyse en cours.',
      score: output.score ?? null,
      max: output.max ?? null,
      points_forts: output.points_forts ?? [],
      axes: output.axes ?? [],
      relance: output.relance ?? null,
      ttsUrl: ttsAudioUrl,
      useWebSpeech: ttsAudioUrl === null,
      model: result.model,
      latencyMs: result.latencyMs,
    });
  } catch (err) {
    logger.error({ err, userId: auth.user.id, sessionId, phase }, 'jury_respond.error');
    return NextResponse.json(
      { error: 'Évaluation indisponible. Réessayez.' },
      { status: 500 },
    );
  }
}
