import { prisma } from '../src/lib/db/client';
import { createPasswordCredentials } from '../src/lib/auth/session';
import { logger } from '../src/lib/logger';

async function main() {
  const email = 'jean@eaf.local';
  const credentials = createPasswordCredentials('demo1234');

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: credentials.passwordHash,
      passwordSalt: credentials.passwordSalt,
    },
    create: {
      email,
      passwordHash: credentials.passwordHash,
      passwordSalt: credentials.passwordSalt,
      role: 'eleve',
    },
  });

  await prisma.studentProfile.upsert({
    where: { userId: user.id },
    update: {
      displayName: 'Jean Dupont',
      classLevel: 'Première générale',
      targetScore: '14/20',
      preferredObjects: ['Poésie', 'Roman'],
      weakSkills: ['Problématisation', 'Grammaire'],
    },
    create: {
      userId: user.id,
      displayName: 'Jean Dupont',
      classLevel: 'Première générale',
      targetScore: '14/20',
      preferredObjects: ['Poésie', 'Roman'],
      weakSkills: ['Problématisation', 'Grammaire'],
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    logger.error({ route: 'scripts/seed', error }, 'Erreur pendant le seed.');
    await prisma.$disconnect();
    process.exit(1);
  });
