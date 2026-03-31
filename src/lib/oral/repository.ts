import { randomUUID } from 'crypto';
import { type ExamPersona, type Prisma } from '@prisma/client';
import { isDatabaseAvailable, prisma } from '@/lib/db/client';
import { promises as fs } from 'fs';
import path from 'path';

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
  oeuvre: string;
  extrait: string;
  questionGrammaire: string;
  interactions: OralInteraction[];
  createdAt: string;
  endedAt: string | null;
};

type FallbackStore = {
  sessions: OralSessionState[];
};

const STORE_PATH = path.join(process.cwd(), '.data', 'oral-sessions.json');
let writeQueue: Promise<void> = Promise.resolve();

async function ensureStore() {
  try {
    await fs.access(STORE_PATH);
    JSON.parse(await fs.readFile(STORE_PATH, 'utf8'));
  } catch {
    await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
    await fs.writeFile(STORE_PATH, JSON.stringify({ sessions: [] }, null, 2), 'utf8');
  }
}

async function readStore(): Promise<FallbackStore> {
  await ensureStore();
  return JSON.parse(await fs.readFile(STORE_PATH, 'utf8')) as FallbackStore;
}

async function writeStore(update: (store: FallbackStore) => FallbackStore) {
  writeQueue = writeQueue.then(async () => {
    const current = await readStore();
    const next = update(current);
    const tmp = `${STORE_PATH}.${process.pid}.${randomUUID()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(next, null, 2), 'utf8');
    await fs.rename(tmp, STORE_PATH);
  });

  await writeQueue;
}

function mapDbToState(input: {
  id: string;
  userId: string;
  oeuvre: string;
  extrait: string;
  question: string;
  feedback: Prisma.JsonValue | null;
  createdAt: Date;
  endedAt: Date | null;
}): OralSessionState {
  return {
    id: input.id,
    userId: input.userId,
    oeuvre: input.oeuvre,
    extrait: input.extrait,
    questionGrammaire: input.question,
    interactions: ((input.feedback as { interactions?: OralInteraction[] } | null)?.interactions ?? []),
    createdAt: input.createdAt.toISOString(),
    endedAt: input.endedAt ? input.endedAt.toISOString() : null,
  };
}

export async function createOralSession(input: {
  userId: string;
  oeuvre: string;
  extrait: string;
  questionGrammaire: string;
}): Promise<OralSessionState> {
  if (await isDatabaseAvailable()) {
    const created = await prisma.oralSession.create({
      data: {
        userId: input.userId,
        oeuvre: input.oeuvre,
        extrait: input.extrait,
        question: input.questionGrammaire, status: "DRAFT",
        feedback: { interactions: [] },
      },
    });

    return mapDbToState({ ...created, feedback: created.feedback });
  }

  const state: OralSessionState = {
    id: randomUUID(),
    userId: input.userId,
    oeuvre: input.oeuvre,
    extrait: input.extrait,
    questionGrammaire: input.questionGrammaire,
    interactions: [],
    createdAt: new Date().toISOString(),
    endedAt: null,
  };

  await writeStore((current) => ({ ...current, sessions: [...current.sessions, state] }));
  return state;
}

export async function findOralSessionById(id: string): Promise<OralSessionState | null> {
  if (await isDatabaseAvailable()) {
    const found = await prisma.oralSession.findUnique({ where: { id } });
    return found ? mapDbToState({ ...found, feedback: found.feedback }) : null;
  }

  const store = await readStore();
  return store.sessions.find((item) => item.id === id) ?? null;
}

export async function listOralSessionsByUser(userId: string): Promise<OralSessionState[]> {
  if (await isDatabaseAvailable()) {
    const sessions = await prisma.oralSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return sessions.map((session) => mapDbToState({ ...session, feedback: session.feedback }));
  }

  const store = await readStore();
  return store.sessions
    .filter((item) => item.userId === userId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export async function appendOralInteraction(input: {
  sessionId: string;
  interaction: OralInteraction;
}) {
  if (await isDatabaseAvailable()) {
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
    return;
  }

  await writeStore((current) => ({
    ...current,
    sessions: current.sessions.map((item) =>
      item.id === input.sessionId
        ? { ...item, interactions: [...item.interactions, input.interaction] }
        : item,
    ),
  }));
}

export async function finalizeOralSession(input: {
  sessionId: string;
  finalFeedback: Prisma.JsonObject;
  score: number;
  maxScore: number;
  personaType?: ExamPersona;
}) {
  if (await isDatabaseAvailable()) {
    const found = await prisma.oralSession.findUnique({ where: { id: input.sessionId } });
    if (!found) return;

    const interactions = ((found.feedback as { interactions?: OralInteraction[] } | null)?.interactions ?? []);
    const transcript = interactions.map((item) => `[${item.step}] ${item.transcript}`).join('\n\n');

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

    const byPhase = interactions.reduce<Record<string, string>>((acc, item) => {
      acc[item.step] = item.transcript;
      return acc;
    }, {});

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
    return;
  }

  await writeStore((current) => ({
    ...current,
    sessions: current.sessions.map((item) =>
      item.id === input.sessionId
        ? {
            ...item,
            endedAt: new Date().toISOString(),
          }
        : item,
    ),
  }));
}

export async function startOralPrep(sessionId: string) {
  if (await isDatabaseAvailable()) {
    return await prisma.oralSession.update({
      where: { id: sessionId },
      data: {
        status: 'PREP_RUNNING',
        prepStartedAt: new Date(),
      },
    });
  }
}

export async function endOralPrep(sessionId: string) {
  if (await isDatabaseAvailable()) {
    return await prisma.oralSession.update({
      where: { id: sessionId },
      data: {
        status: 'PREP_ENDED',
        prepEndedAt: new Date(),
      },
    });
  }
}

export async function startOralPassage(sessionId: string) {
  if (await isDatabaseAvailable()) {
    return await prisma.oralSession.update({
      where: { id: sessionId },
      data: {
        status: 'PASSAGE_RUNNING',
        passageStartedAt: new Date(),
      },
    });
  }
}
