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
