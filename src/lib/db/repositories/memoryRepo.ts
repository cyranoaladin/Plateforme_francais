import { type Prisma } from '@prisma/client';
import { type MemoryEvent } from '@/lib/auth/types';
import { isDatabaseAvailable, prisma } from '@/lib/db/client';
import { readFallbackStore, writeFallbackStore } from '@/lib/db/fallback-store';

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
  if (!await isDatabaseAvailable()) {
    return false;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  return Boolean(user);
}

export async function createMemoryEventRecord(event: MemoryEvent) {
  if (await hasPersistableUser(event.userId)) {
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
    return;
  }

  await writeFallbackStore((current) => ({
    ...current,
    events: [...current.events, event],
  }));
}

export async function listMemoryEventsByUser(userId: string, limit?: number): Promise<MemoryEvent[]> {
  if (await hasPersistableUser(userId)) {
    const events = await prisma.memoryEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return events.map(toEventRecord);
  }

  const store = await readFallbackStore();
  const sorted = store.events
    .filter((event) => event.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return typeof limit === 'number' ? sorted.slice(0, limit) : sorted;
}

export async function listMemoryEvents(): Promise<MemoryEvent[]> {
  if (await isDatabaseAvailable()) {
    const events = await prisma.memoryEvent.findMany({ orderBy: { createdAt: 'desc' } });
    return events.map(toEventRecord);
  }

  const store = await readFallbackStore();
  return store.events;
}
