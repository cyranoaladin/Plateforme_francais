import { type ExamPersona, type Prisma } from '@prisma/client';
import { assertDatabaseAvailable, prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';

type OralStep = 'LECTURE' | 'EXPLICATION' | 'GRAMMAIRE' | 'ENTRETIEN';

type OralInteraction = {
  step: OralStep;
  transcript: string;
  duration: number;
  feedback: {
    feedback: string;
    score: number;
    max: number;
    points_forts: string[];
    axes: string[];
    relance?: string;
    citations?: Array<{
      title: string;
      source_interne: string;
      snippet: string;
    }>;
  };
  createdAt: string;
};

export type OralSessionState = {
  id: string;
  userId: string;
  status?: string;
  mode?: string;
  oeuvre: string;
  extrait: string;
  questionGrammaire: string;
  interactions: OralInteraction[];
  score?: number | null;
  maxScore?: number | null;
  finalFeedback?: Prisma.JsonValue | null;
  createdAt: string;
  endedAt: string | null;
};

export type OralSessionSummary = {
  id: string;
  status?: string;
  mode?: string;
  oeuvre: string;
  score?: number | null;
  maxScore?: number | null;
  finalFeedback?: Prisma.JsonValue | null;
  createdAt: string;
  endedAt: string | null;
};

async function ensureOralDatabaseAvailable() {
  try {
    await assertDatabaseAvailable('Base de données indisponible pour les sessions orales.');
  } catch (error) {
    logger.error('oral.repository.db_required');
    throw error;
  }
}

function mapDbToState(input: {
  id: string;
  userId: string;
  status?: string;
  mode?: string;
  oeuvre: string;
  extrait: string;
  question: string;
  score?: number | null;
  maxScore?: number | null;
  feedback: Prisma.JsonValue | null;
  createdAt: Date;
  endedAt: Date | null;
}): OralSessionState {
  return {
    id: input.id,
    userId: input.userId,
    status: input.status,
    mode: input.mode,
    oeuvre: input.oeuvre,
    extrait: input.extrait,
    questionGrammaire: input.question,
    interactions: ((input.feedback as { interactions?: OralInteraction[] } | null)?.interactions ?? []),
    score: input.score ?? null,
    maxScore: input.maxScore ?? null,
    finalFeedback: ((input.feedback as { final?: Prisma.JsonValue } | null)?.final ?? null),
    createdAt: input.createdAt.toISOString(),
    endedAt: input.endedAt ? input.endedAt.toISOString() : null,
  };
}

export async function createOralSession(input: {
  userId: string;
  oeuvre: string;
  extrait: string;
  questionGrammaire: string;
  texteDescriptifId?: string | null;
  feedback?: Prisma.InputJsonValue;
}): Promise<OralSessionState> {
  await ensureOralDatabaseAvailable();
  const created = await prisma.oralSession.create({
    data: {
      userId: input.userId,
      oeuvre: input.oeuvre,
      extrait: input.extrait,
      question: input.questionGrammaire,
      ...(input.texteDescriptifId ? { texteDescriptifId: input.texteDescriptifId } : {}),
      status: 'DRAFT',
      feedback: input.feedback ?? { interactions: [] },
    },
  });

  return mapDbToState({ ...created, feedback: created.feedback });
}

export async function findOralSessionById(id: string): Promise<OralSessionState | null> {
  await ensureOralDatabaseAvailable();
  const found = await prisma.oralSession.findUnique({ where: { id } });
  return found ? mapDbToState({ ...found, feedback: found.feedback }) : null;
}

export async function listOralSessionsByUser(
  userId: string,
  options?: { limit?: number; cursor?: string },
): Promise<OralSessionSummary[]> {
  await ensureOralDatabaseAvailable();
  const sessions = await prisma.oralSession.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: options?.limit ?? 20,
    ...(options?.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
    select: {
      id: true,
      status: true,
      mode: true,
      oeuvre: true,
      score: true,
      maxScore: true,
      createdAt: true,
      endedAt: true,
      oralBilan: {
        select: {
          note: true,
          mention: true,
          bilanGlobal: true,
        },
      },
    },
  });

  return sessions.map((session) => ({
    id: session.id,
    status: session.status,
    mode: session.mode,
    oeuvre: session.oeuvre,
    score: session.score ?? null,
    maxScore: session.maxScore ?? null,
    finalFeedback: session.oralBilan
      ? {
          note: session.oralBilan.note,
          mention: session.oralBilan.mention,
          bilan_global: session.oralBilan.bilanGlobal,
        }
      : null,
    createdAt: session.createdAt.toISOString(),
    endedAt: session.endedAt ? session.endedAt.toISOString() : null,
  }));
}

export async function appendOralInteraction(input: {
  sessionId: string;
  interaction: OralInteraction;
}) {
  await ensureOralDatabaseAvailable();
  const found = await prisma.oralSession.findUnique({ where: { id: input.sessionId } });
  if (!found) return;

  const current = ((found.feedback as { interactions?: OralInteraction[] } | null)?.interactions ?? []);
  const interactions = [...current, input.interaction];
  const transcript = interactions.map((item) => `[${item.step}] ${item.transcript}`).join('\n\n');

  await prisma.oralSession.update({
    where: { id: input.sessionId },
    data: {
      transcript,
      feedback: { interactions },
    },
  });

  await prisma.oralPhaseScore.upsert({
    where: {
      sessionId_phase: {
        sessionId: input.sessionId,
        phase: input.interaction.step,
      },
    },
    update: {
      score: input.interaction.feedback.score,
      maxScore: input.interaction.feedback.max,
      aiScore: input.interaction.feedback.score,
      transcript: input.interaction.transcript,
      feedback: input.interaction.feedback.feedback,
      pointsForts: input.interaction.feedback.points_forts,
      axes: input.interaction.feedback.axes,
      citations: (input.interaction.feedback.citations ?? null) as Prisma.InputJsonValue,
      duration: input.interaction.duration,
    },
    create: {
      sessionId: input.sessionId,
      phase: input.interaction.step,
      score: input.interaction.feedback.score,
      maxScore: input.interaction.feedback.max,
      aiScore: input.interaction.feedback.score,
      transcript: input.interaction.transcript,
      feedback: input.interaction.feedback.feedback,
      pointsForts: input.interaction.feedback.points_forts,
      axes: input.interaction.feedback.axes,
      citations: (input.interaction.feedback.citations ?? null) as Prisma.InputJsonValue,
      duration: input.interaction.duration,
    },
  });
}

export async function finalizeOralSession(input: {
  sessionId: string;
  finalFeedback: Prisma.JsonObject;
  score: number;
  maxScore: number;
  personaType?: ExamPersona;
}) {
  await ensureOralDatabaseAvailable();
  const found = await prisma.oralSession.findUnique({ where: { id: input.sessionId } });
  if (!found) return;

  const interactions = ((found.feedback as { interactions?: OralInteraction[] } | null)?.interactions ?? []);
  const transcript = interactions.map((item) => `[${item.step}] ${item.transcript}`).join('\n\n');
  const byPhase = interactions.reduce<Record<string, string>>((acc, item) => {
    acc[item.step] = item.transcript;
    return acc;
  }, {});

  await prisma.oralSession.update({
    where: { id: input.sessionId },
    data: {
      feedback: {
        interactions,
        final: input.finalFeedback,
      } as Prisma.InputJsonValue,
      score: input.score,
      maxScore: input.maxScore,
      totalScore: input.score,
      ...(input.personaType ? { personaType: input.personaType } : {}),
      status: 'FINALIZED',
      endedAt: new Date(),
    },
  });

  await prisma.oralTranscript.upsert({
    where: { sessionId: input.sessionId },
    update: {
      fullText: transcript,
      byPhase: byPhase as Prisma.InputJsonValue,
    },
    create: {
      sessionId: input.sessionId,
      fullText: transcript,
      byPhase: byPhase as Prisma.InputJsonValue,
    },
  });

  const bilanPayload = input.finalFeedback as {
    mention?: string;
    bilan_global?: string;
    conseil_final?: string;
    citations?: Prisma.JsonValue;
  };

  await prisma.oralBilan.upsert({
    where: { sessionId: input.sessionId },
    update: {
      note: input.score,
      mention: bilanPayload.mention ?? 'Non renseignée',
      bilanGlobal: bilanPayload.bilan_global ?? 'Bilan indisponible.',
      conseilFinal: bilanPayload.conseil_final ?? 'Conseil indisponible.',
      citations: (bilanPayload.citations ?? null) as Prisma.InputJsonValue,
    },
    create: {
      sessionId: input.sessionId,
      note: input.score,
      mention: bilanPayload.mention ?? 'Non renseignée',
      bilanGlobal: bilanPayload.bilan_global ?? 'Bilan indisponible.',
      conseilFinal: bilanPayload.conseil_final ?? 'Conseil indisponible.',
      citations: (bilanPayload.citations ?? null) as Prisma.InputJsonValue,
    },
  });
}

export async function startOralPrep(sessionId: string) {
  await ensureOralDatabaseAvailable();
  return await prisma.oralSession.update({
    where: { id: sessionId },
    data: {
      status: 'PREP_RUNNING',
      prepStartedAt: new Date(),
    },
  });
}

export async function endOralPrep(sessionId: string) {
  await ensureOralDatabaseAvailable();
  return await prisma.oralSession.update({
    where: { id: sessionId },
    data: {
      status: 'PREP_ENDED',
      prepEndedAt: new Date(),
    },
  });
}

export async function startOralPassage(sessionId: string) {
  await ensureOralDatabaseAvailable();
  return await prisma.oralSession.update({
    where: { id: sessionId },
    data: {
      status: 'PASSAGE_RUNNING',
      passageStartedAt: new Date(),
    },
  });
}
