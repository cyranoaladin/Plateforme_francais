import { type Prisma } from '@prisma/client';
import { type MemoryEvent } from '@/lib/auth/types';
import { assertDatabaseAvailable, prisma } from '@/lib/db/client';

function parsePayload(value: Prisma.JsonValue | null): MemoryEvent['payload'] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  return value as MemoryEvent['payload'];
}

function toEventRecord(event: {
  id: string;
  userId: string;
  type: string;
  feature: string;
  path: string | null;
  payload: Prisma.JsonValue | null;
  createdAt: Date | string;
}): MemoryEvent {
  return {
    id: event.id,
    userId: event.userId,
    type: event.type as MemoryEvent['type'],
    feature: event.feature,
    path: event.path ?? undefined,
    payload: parsePayload(event.payload),
    createdAt: event.createdAt instanceof Date ? event.createdAt.toISOString() : event.createdAt,
  };
}

async function hasPersistableUser(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  return Boolean(user);
}

export async function createMemoryEventRecord(event: MemoryEvent) {
  await assertDatabaseAvailable('Base de données indisponible pour les événements mémoire.');
  if (!await hasPersistableUser(event.userId)) {
    throw new Error(`Utilisateur introuvable pour l'événement mémoire: ${event.userId}`);
  }

  await prisma.memoryEvent.create({
    data: {
      id: event.id,
      userId: event.userId,
      type: event.type,
      feature: event.feature,
      path: event.path,
      payload: event.payload ? (event.payload as Prisma.InputJsonValue) : undefined,
      createdAt: new Date(event.createdAt),
    },
  });
}

export async function listMemoryEventsByUser(userId: string, limit?: number): Promise<MemoryEvent[]> {
  await assertDatabaseAvailable('Base de données indisponible pour les événements mémoire.');
  const events = await prisma.memoryEvent.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return events.map(toEventRecord);
}

export async function listMemoryEvents(): Promise<MemoryEvent[]> {
  await assertDatabaseAvailable('Base de données indisponible pour les événements mémoire.');
  const events = await prisma.memoryEvent.findMany({ orderBy: { createdAt: 'desc' } });
  return events.map(toEventRecord);
}
