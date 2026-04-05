import { PrismaClient } from '@prisma/client';
import { createPasswordCredentials } from '../src/lib/auth/session';

const prisma = new PrismaClient();

const USERS = [
  { email: 'test-eleve@nexus-eaf.local', role: 'eleve' as const },
  { email: 'test-enseignant@nexus-eaf.local', role: 'enseignant' as const },
  { email: 'test-parent@nexus-eaf.local', role: 'parent' as const },
];

async function main() {
  const password = process.env.TEST_USER_PASSWORD ?? 'NexusTest2026!';
  for (const user of USERS) {
    const credentials = createPasswordCredentials(password);
    await prisma.user.upsert({
      where: { email: user.email },
      create: {
        email: user.email,
        passwordHash: credentials.passwordHash,
        passwordSalt: credentials.passwordSalt,
        role: user.role,
        emailVerified: new Date(),
        profile: {
          create: {
            displayName: `Test ${user.role}`,
            classLevel: 'Première générale',
            targetScore: '14/20',
            anneeScolaire: '2025-2026',
            onboardingCompleted: true,
          },
        },
      },
      update: { emailVerified: new Date() },
    });
    console.log(`✓ ${user.email} [${user.role}] password: ${password}`);
  }
  // Abonnement Premium pour l'élève de test
  const eleve = await prisma.user.findUnique({ where: { email: USERS[0].email } });
  if (eleve) {
    await prisma.subscription.upsert({
      where: { userId: eleve.id },
      create: {
        userId: eleve.id, plan: 'PREMIUM', status: 'ACTIVE',
      },
      update: { plan: 'PREMIUM', status: 'ACTIVE' },
    });
    console.log(`✓ PREMIUM activé pour ${USERS[0].email}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
