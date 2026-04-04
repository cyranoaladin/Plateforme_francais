import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { PrismaClient, type UserRole } from '@prisma/client';

const prisma = new PrismaClient();
const ARCHIVE = '.data/migration-backups/20260404_1155_db_only/memory-store.json';

type ArchiveUser = {
  id: string;
  email?: string;
  passwordHash?: string;
  passwordSalt?: string;
  role?: string;
  profile?: {
    displayName?: string;
    classLevel?: string;
    targetScore?: string;
  };
};

type ArchiveEvent = {
  id: string;
  userId: string;
  type: string;
  feature: string;
  path?: string | null;
  payload?: object | null;
  createdAt: string;
};

function normalizeRole(role: string | undefined): UserRole {
  if (role === 'admin' || role === 'parent' || role === 'enseignant' || role === 'eleve') {
    return role;
  }
  return 'eleve';
}

async function main() {
  const raw = JSON.parse(readFileSync(ARCHIVE, 'utf-8')) as {
    users?: ArchiveUser[];
    events?: ArchiveEvent[];
  };

  const dbUsers = await prisma.user.findMany({ select: { id: true } });
  const dbUserIds = new Set(dbUsers.map((user) => user.id));
  const orphanIds = new Set<string>();

  for (const event of raw.events ?? []) {
    if (!dbUserIds.has(event.userId)) {
      orphanIds.add(event.userId);
    }
  }

  console.log('userId orphelins:', [...orphanIds]);

  for (const userId of orphanIds) {
    const archiveUser = raw.users?.find((user) => user.id === userId);
    await prisma.user.upsert({
      where: { id: userId },
      create: {
        id: userId,
        email: archiveUser?.email ?? `${userId}@legacy.nexus.local`,
        passwordHash: archiveUser?.passwordHash ?? randomUUID().replace(/-/g, ''),
        passwordSalt: archiveUser?.passwordSalt ?? randomUUID().replace(/-/g, ''),
        role: normalizeRole(archiveUser?.role),
        emailVerified: null,
        profile: {
          create: {
            displayName: archiveUser?.profile?.displayName ?? userId,
            classLevel: archiveUser?.profile?.classLevel ?? 'Première générale',
            targetScore: archiveUser?.profile?.targetScore ?? '12/20',
            anneeScolaire: '2025-2026',
          },
        },
      },
      update: {},
    });
    console.log(`Utilisateur créé/trouvé: ${userId}`);
  }

  for (const event of raw.events ?? []) {
    if (!orphanIds.has(event.userId)) {
      continue;
    }

    await prisma.memoryEvent.upsert({
      where: { id: event.id },
      create: {
        id: event.id,
        userId: event.userId,
        type: event.type,
        feature: event.feature,
        path: event.path ?? null,
        payload: event.payload ?? undefined,
        createdAt: new Date(event.createdAt),
      },
      update: {},
    });
  }

  const finalCount = await prisma.memoryEvent.count();
  console.log('Ré-migration terminée');
  console.log('memory_events:', finalCount);
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
