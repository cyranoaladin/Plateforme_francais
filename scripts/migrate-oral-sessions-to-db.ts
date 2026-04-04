import { PrismaClient, type OralPhase, type Prisma } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { logger } from '../src/lib/logger';

type OralInteraction = {
  step: 'LECTURE' | 'EXPLICATION' | 'GRAMMAIRE' | 'ENTRETIEN';
  transcript: string;
  duration: number;
  createdAt: string;
  feedback: {
    feedback: string;
    score: number;
    max: number;
    points_forts: string[];
    axes: string[];
    citations?: unknown;
  };
};

type OralStoreFile = {
  sessions?: Array<{
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
  }>;
};

const prisma = new PrismaClient();
const filePath = '.data/oral-sessions.json';

async function migrateOralSessions() {
  let data: OralStoreFile;

  try {
    data = JSON.parse(readFileSync(filePath, 'utf-8')) as OralStoreFile;
  } catch (error) {
    logger.warn({ filePath, error }, 'oral-sessions.json absent ou invalide');
    return;
  }

  const sessions = data.sessions ?? [];
  logger.info({ count: sessions.length }, 'Début migration oral-sessions → PostgreSQL');

  for (const session of sessions) {
    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true } });
    if (!user) {
      logger.warn({ sessionId: session.id, userId: session.userId }, 'Session orale ignorée: utilisateur absent');
      continue;
    }

    const transcript = session.interactions.map((item) => `[${item.step}] ${item.transcript}`).join('\n\n');
    const byPhase = session.interactions.reduce<Record<string, string>>((acc, item) => {
      acc[item.step] = item.transcript;
      return acc;
    }, {});

    await prisma.oralSession.upsert({
      where: { id: session.id },
      update: {
        userId: session.userId,
        oeuvre: session.oeuvre,
        extrait: session.extrait,
        question: session.questionGrammaire,
        status: (session.status as never) ?? 'FINALIZED',
        mode: (session.mode as never) ?? 'SIMULATION',
        feedback: {
          interactions: session.interactions,
          final: session.finalFeedback ?? null,
        } as Prisma.InputJsonValue,
        transcript,
        score: session.score ?? null,
        maxScore: session.maxScore ?? null,
        totalScore: session.score ?? null,
        createdAt: new Date(session.createdAt),
        endedAt: session.endedAt ? new Date(session.endedAt) : null,
      },
      create: {
        id: session.id,
        userId: session.userId,
        oeuvre: session.oeuvre,
        extrait: session.extrait,
        question: session.questionGrammaire,
        status: (session.status as never) ?? 'FINALIZED',
        mode: (session.mode as never) ?? 'SIMULATION',
        feedback: {
          interactions: session.interactions,
          final: session.finalFeedback ?? null,
        } as Prisma.InputJsonValue,
        transcript,
        score: session.score ?? null,
        maxScore: session.maxScore ?? null,
        totalScore: session.score ?? null,
        createdAt: new Date(session.createdAt),
        endedAt: session.endedAt ? new Date(session.endedAt) : null,
      },
    });

    if (transcript) {
      await prisma.oralTranscript.upsert({
        where: { sessionId: session.id },
        update: {
          fullText: transcript,
          byPhase: byPhase as Prisma.InputJsonValue,
        },
        create: {
          sessionId: session.id,
          fullText: transcript,
          byPhase: byPhase as Prisma.InputJsonValue,
        },
      });
    }

    for (const interaction of session.interactions) {
      await prisma.oralPhaseScore.upsert({
        where: {
          sessionId_phase: {
            sessionId: session.id,
            phase: interaction.step as OralPhase,
          },
        },
        update: {
          score: interaction.feedback.score,
          maxScore: interaction.feedback.max,
          aiScore: interaction.feedback.score,
          transcript: interaction.transcript,
          feedback: interaction.feedback.feedback,
          pointsForts: interaction.feedback.points_forts,
          axes: interaction.feedback.axes,
          citations: (interaction.feedback.citations ?? null) as Prisma.InputJsonValue,
          duration: interaction.duration,
        },
        create: {
          sessionId: session.id,
          phase: interaction.step as OralPhase,
          score: interaction.feedback.score,
          maxScore: interaction.feedback.max,
          aiScore: interaction.feedback.score,
          transcript: interaction.transcript,
          feedback: interaction.feedback.feedback,
          pointsForts: interaction.feedback.points_forts,
          axes: interaction.feedback.axes,
          citations: (interaction.feedback.citations ?? null) as Prisma.InputJsonValue,
          duration: interaction.duration,
        },
      });
    }
  }

  logger.info('Migration oral-sessions terminée');
}

migrateOralSessions()
  .catch((error) => {
    logger.error({ error }, 'Erreur migration oral-sessions');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
