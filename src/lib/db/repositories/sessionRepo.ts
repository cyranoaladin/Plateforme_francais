import { type SessionRecord } from '@/lib/auth/types';
import { assertDatabaseAvailable, prisma } from '@/lib/db/client';

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
  await assertDatabaseAvailable('Base de données indisponible pour les sessions.');
  await prisma.session.create({
    data: {
      token: session.token,
      userId: session.userId,
      createdAt: new Date(session.createdAt),
      expiresAt: new Date(session.expiresAt),
      lastSeenAt: new Date(session.lastSeenAt),
    },
  });
}

export async function findSessionByToken(token: string): Promise<SessionRecord | null> {
  await assertDatabaseAvailable('Base de données indisponible pour les sessions.');
  const session = await prisma.session.findUnique({ where: { token } });
  return session ? toSessionRecord(session) : null;
}

export async function listSessions(): Promise<SessionRecord[]> {
  await assertDatabaseAvailable('Base de données indisponible pour les sessions.');
  const sessions = await prisma.session.findMany();
  return sessions.map(toSessionRecord);
}

export async function touchSession(token: string) {
  await assertDatabaseAvailable('Base de données indisponible pour les sessions.');
  await prisma.session.update({
    where: { token },
    data: { lastSeenAt: new Date() },
  });
}

/**
 * Enforce max concurrent sessions per user.
 * Deletes the oldest sessions beyond the limit (FIFO eviction).
 * Default: 3 active sessions max.
 */
export async function enforceMaxSessions(userId: string, maxSessions: number = 3) {
  await assertDatabaseAvailable('Base de données indisponible pour les sessions.');
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
}

export async function deleteSessionByToken(token: string) {
  await assertDatabaseAvailable('Base de données indisponible pour les sessions.');
  await prisma.session.deleteMany({ where: { token } });
}
