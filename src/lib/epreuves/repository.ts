import { type Prisma } from '@prisma/client';
import { assertDatabaseAvailable, prisma } from '@/lib/db/client';
import {
  type CopieProgressEventRecord,
  type CopieProgressStage,
  type CopieRecord,
  type CopieStatus,
  type CorrectionJson,
  type EpreuveRecord,
  type EpreuveType,
} from '@/lib/epreuves/types';

function mapEpreuve(input: {
  id: string;
  userId: string;
  type: string;
  sujet: string;
  texte: string;
  consignes: string;
  bareme: Prisma.JsonValue;
  generatedAt: Date;
}): EpreuveRecord {
  return {
    id: input.id,
    userId: input.userId,
    type: input.type as EpreuveType,
    sujet: input.sujet,
    texte: input.texte,
    consignes: input.consignes,
    bareme: (input.bareme as Record<string, number>) ?? {},
    generatedAt: input.generatedAt.toISOString(),
  };
}

function mapCopie(input: {
  id: string;
  epreuveId: string;
  userId: string;
  filePath: string;
  fileType: string;
  status: string;
  ocrText: string | null;
  correction: Prisma.JsonValue | null;
  createdAt: Date;
  correctedAt: Date | null;
}): CopieRecord {
  return {
    id: input.id,
    epreuveId: input.epreuveId,
    userId: input.userId,
    filePath: input.filePath,
    fileType: input.fileType,
    status: input.status as CopieStatus,
    ocrText: input.ocrText,
    correction: (input.correction as CorrectionJson | null) ?? null,
    createdAt: input.createdAt.toISOString(),
    correctedAt: input.correctedAt ? input.correctedAt.toISOString() : null,
  };
}

function mapCopieProgressEvent(input: {
  id: string;
  copieId: string;
  stage: string;
  message: string;
  progress: number | null;
  payload: Prisma.JsonValue | null;
  createdAt: Date;
}): CopieProgressEventRecord {
  return {
    id: input.id,
    copieId: input.copieId,
    stage: input.stage as CopieProgressStage,
    message: input.message,
    progress: input.progress,
    payload: (input.payload as Record<string, unknown> | null) ?? null,
    createdAt: input.createdAt.toISOString(),
  };
}

export async function createEpreuve(input: {
  userId: string;
  type: EpreuveType;
  sujet: string;
  texte: string;
  consignes: string;
  bareme: Record<string, number>;
}): Promise<EpreuveRecord> {
  await assertDatabaseAvailable('Base de données indisponible pour les épreuves.');
  const created = await prisma.epreuveBlanche.create({
    data: {
      userId: input.userId,
      type: input.type,
      sujet: input.sujet,
      texte: input.texte,
      consignes: input.consignes,
      bareme: input.bareme,
    },
  });

  return mapEpreuve({ ...created, bareme: created.bareme });
}

export async function findEpreuveById(epreuveId: string): Promise<EpreuveRecord | null> {
  await assertDatabaseAvailable('Base de données indisponible pour les épreuves.');
  const found = await prisma.epreuveBlanche.findUnique({ where: { id: epreuveId } });
  return found ? mapEpreuve({ ...found, bareme: found.bareme }) : null;
}

export async function createCopie(input: {
  epreuveId: string;
  userId: string;
  filePath: string;
  fileType: string;
}): Promise<CopieRecord> {
  await assertDatabaseAvailable('Base de données indisponible pour les copies.');
  const created = await prisma.copieDeposee.create({
    data: {
      epreuveId: input.epreuveId,
      userId: input.userId,
      filePath: input.filePath,
      fileType: input.fileType,
      status: 'pending',
    },
  });

  return mapCopie({ ...created, correction: created.correction });
}

export async function updateCopieStatus(input: {
  copieId: string;
  status: CopieStatus;
  ocrText?: string | null;
  correction?: CorrectionJson | null;
  correctedAt?: string | null;
  errorMessage?: string | null;
}) {
  await assertDatabaseAvailable('Base de données indisponible pour les copies.');
  const correctionPayload =
    input.errorMessage && input.status === 'error'
      ? ({ errorMessage: input.errorMessage } as Prisma.InputJsonValue)
      : (input.correction as Prisma.InputJsonValue | undefined);

  await prisma.copieDeposee.update({
    where: { id: input.copieId },
    data: {
      status: input.status,
      ocrText: input.ocrText,
      correction: correctionPayload,
      correctedAt: input.correctedAt ? new Date(input.correctedAt) : undefined,
    },
  });
}

export async function findCopieById(copieId: string): Promise<CopieRecord | null> {
  await assertDatabaseAvailable('Base de données indisponible pour les copies.');
  const found = await prisma.copieDeposee.findUnique({ where: { id: copieId } });
  return found ? mapCopie({ ...found, correction: found.correction }) : null;
}

export async function appendCopieProgressEvent(input: {
  copieId: string;
  stage: CopieProgressStage;
  message: string;
  progress?: number | null;
  payload?: Record<string, unknown> | null;
}): Promise<CopieProgressEventRecord> {
  await assertDatabaseAvailable('Base de données indisponible pour les événements de copie.');
  const created = await prisma.copieProgressEvent.create({
    data: {
      copieId: input.copieId,
      stage: input.stage,
      message: input.message,
      progress: input.progress ?? null,
      payload: (input.payload ?? null) as Prisma.InputJsonValue,
    },
  });

  return mapCopieProgressEvent({ ...created, payload: created.payload });
}

export async function listCopieProgressEvents(copieId: string): Promise<CopieProgressEventRecord[]> {
  await assertDatabaseAvailable('Base de données indisponible pour les événements de copie.');
  const events = await prisma.copieProgressEvent.findMany({
    where: { copieId },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
  });

  return events.map((event: {
    id: string;
    copieId: string;
    stage: string;
    message: string;
    progress: number | null;
    payload: Prisma.JsonValue | null;
    createdAt: Date;
  }) => mapCopieProgressEvent({ ...event, payload: event.payload }));
}
