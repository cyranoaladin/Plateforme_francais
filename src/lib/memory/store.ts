import { randomUUID } from 'crypto';
import {
  type MemoryEvent,
  type MemoryStore,
  type SessionRecord,
} from '@/lib/auth/types';
import { isDatabaseAvailable, prisma } from '@/lib/db/client';
import { readFallbackStore, writeFallbackStore } from '@/lib/db/fallback-store';
import { listMemoryEvents } from '@/lib/db/repositories/memoryRepo';
import { listSessions } from '@/lib/db/repositories/sessionRepo';
import { listUsers } from '@/lib/db/repositories/userRepo';

const SESSION_TTL_DAYS = 14;

function nowIso() {
  return new Date().toISOString();
}

function plusDaysIso(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

export async function readStore(): Promise<MemoryStore> {
  if (await isDatabaseAvailable()) {
    const [users, sessions, events] = await Promise.all([
      listUsers(),
      listSessions(),
      listMemoryEvents(),
    ]);

    return {
      users,
      sessions,
      events,
    };
  }

  return readFallbackStore();
}

export async function writeStore(update: (current: MemoryStore) => MemoryStore) {
  const current = await readStore();
  const next = update(current);

  if (await isDatabaseAvailable()) {
    await prisma.$transaction(async (tx) => {
      await tx.memoryEvent.deleteMany();
      await tx.session.deleteMany();
      await tx.studentProfile.deleteMany();
      await tx.user.deleteMany();

      for (const user of next.users) {
        await tx.user.create({
          data: {
            id: user.id,
            email: user.email,
            passwordHash: user.passwordHash,
            passwordSalt: user.passwordSalt,
            role: user.role,
            createdAt: new Date(user.createdAt),
            profile: {
              create: {
                displayName: user.profile.displayName,
                classLevel: user.profile.classLevel,
                targetScore: user.profile.targetScore,
                preferredObjects: user.profile.preferredObjects,
                weakSkills: user.profile.weakSkills,
              },
            },
          },
        });
      }

      if (next.sessions.length > 0) {
        await tx.session.createMany({
          data: next.sessions.map((session) => ({
            token: session.token,
            userId: session.userId,
            createdAt: new Date(session.createdAt),
            expiresAt: new Date(session.expiresAt),
            lastSeenAt: new Date(session.lastSeenAt),
          })),
        });
      }

      if (next.events.length > 0) {
        await tx.memoryEvent.createMany({
          data: next.events.map((event) => ({
            id: event.id,
            userId: event.userId,
            type: event.type,
            feature: event.feature,
            path: event.path,
            payload: event.payload,
            createdAt: new Date(event.createdAt),
          })),
        });
      }
    });
    return;
  }

  await writeFallbackStore(() => next);
}

export function createSession(userId: string): SessionRecord {
  const timestamp = nowIso();
  return {
    token: randomUUID(),
    userId,
    createdAt: timestamp,
    lastSeenAt: timestamp,
    expiresAt: plusDaysIso(SESSION_TTL_DAYS),
  };
}

export function isSessionExpired(session: SessionRecord): boolean {
  return new Date(session.expiresAt).getTime() <= Date.now();
}

export function createMemoryEvent(
  userId: string,
  event: Omit<MemoryEvent, 'id' | 'userId' | 'createdAt'>,
): MemoryEvent {
  return {
    id: randomUUID(),
    userId,
    createdAt: nowIso(),
    ...event,
  };
}
