import { randomUUID } from 'crypto';
import { type Prisma } from '@prisma/client';
import { isDatabaseAvailable, prisma } from '@/lib/db/client';
import { readEpreuvesFallbackStore, writeEpreuvesFallbackStore } from '@/lib/epreuves/fallback-store';
import { type CopieRecord, type CopieStatus, type CorrectionJson, type EpreuveRecord, type EpreuveType } from '@/lib/epreuves/types';

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

export async function createEpreuve(input: {
  userId: string;
  type: EpreuveType;
  sujet: string;
  texte: string;
  consignes: string;
  bareme: Record<string, number>;
}): Promise<EpreuveRecord> {
  if (await isDatabaseAvailable()) {
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

  const record: EpreuveRecord = {
    id: randomUUID(),
    userId: input.userId,
    type: input.type,
    sujet: input.sujet,
    texte: input.texte,
    consignes: input.consignes,
    bareme: input.bareme,
    generatedAt: new Date().toISOString(),
  };

  await writeEpreuvesFallbackStore((current) => ({ ...current, epreuves: [...current.epreuves, record] }));
  return record;
}

export async function findEpreuveById(epreuveId: string): Promise<EpreuveRecord | null> {
  if (await isDatabaseAvailable()) {
    const found = await prisma.epreuveBlanche.findUnique({ where: { id: epreuveId } });
    return found ? mapEpreuve({ ...found, bareme: found.bareme }) : null;
  }

  const store = await readEpreuvesFallbackStore();
  return store.epreuves.find((item) => item.id === epreuveId) ?? null;
}

export async function createCopie(input: {
  epreuveId: string;
  userId: string;
  filePath: string;
  fileType: string;
}): Promise<CopieRecord> {
  if (await isDatabaseAvailable()) {
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

  const record: CopieRecord = {
    id: randomUUID(),
    epreuveId: input.epreuveId,
    userId: input.userId,
    filePath: input.filePath,
    fileType: input.fileType,
    status: 'pending',
    ocrText: null,
    correction: null,
    createdAt: new Date().toISOString(),
    correctedAt: null,
  };

  await writeEpreuvesFallbackStore((current) => ({ ...current, copies: [...current.copies, record] }));
  return record;
}

export async function updateCopieStatus(input: {
  copieId: string;
  status: CopieStatus;
  ocrText?: string | null;
  correction?: CorrectionJson | null;
  correctedAt?: string | null;
}) {
  if (await isDatabaseAvailable()) {
    await prisma.copieDeposee.update({
      where: { id: input.copieId },
      data: {
        status: input.status,
        ocrText: input.ocrText,
        correction: input.correction as Prisma.InputJsonValue | undefined,
        correctedAt: input.correctedAt ? new Date(input.correctedAt) : undefined,
      },
    });
    return;
  }

  await writeEpreuvesFallbackStore((current) => ({
    ...current,
    copies: current.copies.map((item) =>
      item.id === input.copieId
        ? {
            ...item,
            status: input.status,
            ocrText: input.ocrText ?? item.ocrText,
            correction: input.correction ?? item.correction,
            correctedAt: input.correctedAt ?? item.correctedAt,
          }
        : item,
    ),
  }));
}

export async function findCopieById(copieId: string): Promise<CopieRecord | null> {
  if (await isDatabaseAvailable()) {
    const found = await prisma.copieDeposee.findUnique({ where: { id: copieId } });
    return found ? mapCopie({ ...found, correction: found.correction }) : null;
  }

  const store = await readEpreuvesFallbackStore();
  return store.copies.find((item) => item.id === copieId) ?? null;
}
