import { PrismaClient, UserRole } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { logger } from '../src/lib/logger';

type MemoryStoreFile = {
  users?: Array<{
    id: string;
    email: string;
    passwordHash: string;
    passwordSalt: string;
    role?: string;
    emailVerified?: string | null;
    createdAt?: string;
    profile?: {
      displayName?: string;
      classLevel?: string;
      targetScore?: string;
      onboardingCompleted?: boolean;
      selectedOeuvres?: string[];
      parcoursProgress?: string[];
      badges?: string[];
      preferredObjects?: string[];
      weakSkills?: string[];
      classCode?: string;
      anneeScolaire?: string;
      teacherEmail?: string;
      parentEmail?: string;
    };
  }>;
  sessions?: Array<{
    token: string;
    userId: string;
    createdAt: string;
    expiresAt: string;
    lastSeenAt: string;
  }>;
  events?: Array<{
    id: string;
    userId: string;
    type: string;
    feature: string;
    path?: string;
    payload?: unknown;
    createdAt: string;
  }>;
};

const prisma = new PrismaClient();
const filePath = '.data/memory-store.json';

async function migrateMemoryStore() {
  let data: MemoryStoreFile;

  try {
    data = JSON.parse(readFileSync(filePath, 'utf-8')) as MemoryStoreFile;
  } catch (error) {
    logger.warn({ filePath, error }, 'memory-store.json absent ou invalide');
    return;
  }

  logger.info(
    {
      users: data.users?.length ?? 0,
      sessions: data.sessions?.length ?? 0,
      events: data.events?.length ?? 0,
    },
    'Début migration memory-store → PostgreSQL',
  );

  for (const user of data.users ?? []) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        passwordHash: user.passwordHash,
        passwordSalt: user.passwordSalt,
        role: (user.role as UserRole | undefined) ?? 'eleve',
        emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
      },
      create: {
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        passwordSalt: user.passwordSalt,
        role: (user.role as UserRole | undefined) ?? 'eleve',
        emailVerified: user.emailVerified ? new Date(user.emailVerified) : null,
        createdAt: user.createdAt ? new Date(user.createdAt) : undefined,
      },
    });

    if (user.profile) {
      await prisma.studentProfile.upsert({
        where: { userId: user.id },
        update: {
          displayName: user.profile.displayName ?? 'Élève',
          classLevel: user.profile.classLevel ?? 'Première générale',
          targetScore: user.profile.targetScore ?? '14/20',
          onboardingCompleted: user.profile.onboardingCompleted ?? false,
          selectedOeuvres: user.profile.selectedOeuvres ?? [],
          parcoursProgress: user.profile.parcoursProgress ?? [],
          badges: user.profile.badges ?? [],
          preferredObjects: user.profile.preferredObjects ?? [],
          weakSkills: user.profile.weakSkills ?? [],
          classCode: user.profile.classCode ?? null,
          anneeScolaire: user.profile.anneeScolaire ?? '2025-2026',
          teacherEmail: user.profile.teacherEmail ?? null,
          parentEmail: user.profile.parentEmail ?? null,
        },
        create: {
          userId: user.id,
          displayName: user.profile.displayName ?? 'Élève',
          classLevel: user.profile.classLevel ?? 'Première générale',
          targetScore: user.profile.targetScore ?? '14/20',
          onboardingCompleted: user.profile.onboardingCompleted ?? false,
          selectedOeuvres: user.profile.selectedOeuvres ?? [],
          parcoursProgress: user.profile.parcoursProgress ?? [],
          badges: user.profile.badges ?? [],
          preferredObjects: user.profile.preferredObjects ?? [],
          weakSkills: user.profile.weakSkills ?? [],
          classCode: user.profile.classCode ?? undefined,
          anneeScolaire: user.profile.anneeScolaire ?? '2025-2026',
          teacherEmail: user.profile.teacherEmail ?? undefined,
          parentEmail: user.profile.parentEmail ?? undefined,
        },
      });
    }
  }

  for (const session of data.sessions ?? []) {
    const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { id: true } });
    if (!user) {
      logger.warn({ token: session.token, userId: session.userId }, 'Session ignorée: utilisateur absent');
      continue;
    }

    await prisma.session.upsert({
      where: { token: session.token },
      update: {
        userId: session.userId,
        createdAt: new Date(session.createdAt),
        expiresAt: new Date(session.expiresAt),
        lastSeenAt: new Date(session.lastSeenAt),
      },
      create: {
        token: session.token,
        userId: session.userId,
        createdAt: new Date(session.createdAt),
        expiresAt: new Date(session.expiresAt),
        lastSeenAt: new Date(session.lastSeenAt),
      },
    });
  }

  for (const event of data.events ?? []) {
    const user = await prisma.user.findUnique({ where: { id: event.userId }, select: { id: true } });
    if (!user) {
      logger.warn({ eventId: event.id, userId: event.userId }, 'MemoryEvent ignoré: utilisateur absent');
      continue;
    }

    await prisma.memoryEvent.upsert({
      where: { id: event.id },
      update: {
        userId: event.userId,
        type: event.type,
        feature: event.feature,
        path: event.path ?? null,
        payload: event.payload as object | undefined,
        createdAt: new Date(event.createdAt),
      },
      create: {
        id: event.id,
        userId: event.userId,
        type: event.type,
        feature: event.feature,
        path: event.path ?? null,
        payload: event.payload as object | undefined,
        createdAt: new Date(event.createdAt),
      },
    });
  }

  logger.info('Migration memory-store terminée');
}

migrateMemoryStore()
  .catch((error) => {
    logger.error({ error }, 'Erreur migration memory-store');
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
