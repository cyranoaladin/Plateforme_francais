import { type SessionRecord } from '@/lib/auth/types';
import { isDatabaseAvailable, prisma } from '@/lib/db/client';
import { readFallbackStore, writeFallbackStore } from '@/lib/db/fallback-store';

function toSessionRecord(session: {
  token: string;
  userId: string;
  createdAt: Date | string;
  expiresAt: Date | string;
  lastSeenAt: Date | string;
}): SessionRecord {
  return {
    token: session.token,
    userId: session.userId,
    createdAt: session.createdAt instanceof Date ? session.createdAt.toISOString() : session.createdAt,
    expiresAt: session.expiresAt instanceof Date ? session.expiresAt.toISOString() : session.expiresAt,
    lastSeenAt: session.lastSeenAt instanceof Date ? session.lastSeenAt.toISOString() : session.lastSeenAt,
  };
}

export async function createSessionRecord(session: SessionRecord) {
  if (await isDatabaseAvailable()) {
    await prisma.session.create({
      data: {
        token: session.token,
        userId: session.userId,
        createdAt: new Date(session.createdAt),
        expiresAt: new Date(session.expiresAt),
        lastSeenAt: new Date(session.lastSeenAt),
      },
    });
    return;
  }

  await writeFallbackStore((current) => ({
    ...current,
    sessions: [...current.sessions, session],
  }));
}

export async function findSessionByToken(token: string): Promise<SessionRecord | null> {
  if (await isDatabaseAvailable()) {
    const session = await prisma.session.findUnique({ where: { token } });
    return session ? toSessionRecord(session) : null;
  }

  const store = await readFallbackStore();
  return store.sessions.find((item) => item.token === token) ?? null;
}

export async function listSessions(): Promise<SessionRecord[]> {
  if (await isDatabaseAvailable()) {
    const sessions = await prisma.session.findMany();
    return sessions.map(toSessionRecord);
  }

  const store = await readFallbackStore();
  return store.sessions;
}

export async function touchSession(token: string) {
  if (await isDatabaseAvailable()) {
    await prisma.session.update({
      where: { token },
      data: { lastSeenAt: new Date() },
    });
    return;
  }

  await writeFallbackStore((current) => ({
    ...current,
    sessions: current.sessions.map((item) =>
      item.token === token ? { ...item, lastSeenAt: new Date().toISOString() } : item,
    ),
  }));
}

/**
 * Enforce max concurrent sessions per user.
 * Deletes the oldest sessions beyond the limit (FIFO eviction).
 * Default: 3 active sessions max.
 */
export async function enforceMaxSessions(userId: string, maxSessions: number = 3) {
  if (await isDatabaseAvailable()) {
    const sessions = await prisma.session.findMany({
      where: { userId },
      orderBy: { lastSeenAt: 'desc' },
    });

    if (sessions.length >= maxSessions) {
      const tokensToDelete = sessions.slice(maxSessions - 1).map((s) => s.token);
      if (tokensToDelete.length > 0) {
        await prisma.session.deleteMany({
          where: { token: { in: tokensToDelete } },
        });
      }
    }
    return;
  }

  await writeFallbackStore((current) => {
    const userSessions = current.sessions
      .filter((s) => s.userId === userId)
      .sort((a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime());

    if (userSessions.length >= maxSessions) {
      const tokensToKeep = new Set(userSessions.slice(0, maxSessions - 1).map((s) => s.token));
      return {
        ...current,
        sessions: current.sessions.filter((s) => s.userId !== userId || tokensToKeep.has(s.token)),
      };
    }
    return current;
  });
}

export async function deleteSessionByToken(token: string) {
  if (await isDatabaseAvailable()) {
    await prisma.session.deleteMany({ where: { token } });
    return;
  }

  await writeFallbackStore((current) => ({
    ...current,
    sessions: current.sessions.filter((item) => item.token !== token),
  }));
}
