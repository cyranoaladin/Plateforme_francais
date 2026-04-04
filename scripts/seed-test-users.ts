import { PrismaClient } from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): { hash: string; salt: string } {
  const salt = randomUUID();
  const hash = createHash('sha256').update(password + salt).digest('hex');
  return { hash, salt };
}

const USERS = [
  { email: 'test-eleve@nexus-eaf.local', role: 'eleve' as const },
  { email: 'test-enseignant@nexus-eaf.local', role: 'enseignant' as const },
  { email: 'test-parent@nexus-eaf.local', role: 'parent' as const },
];

async function main() {
  const password = process.env.TEST_USER_PASSWORD ?? 'NexusTest2026!';
  for (const user of USERS) {
    const { hash, salt } = hashPassword(password);
    await prisma.user.upsert({
      where: { email: user.email },
      create: {
        email: user.email,
        passwordHash: hash,
        passwordSalt: salt,
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
        userId: eleve.id, plan: 'PREMIUM', status: 'active',
        provider: 'manual',
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 3600 * 1000),
      },
      update: { plan: 'PREMIUM', status: 'active' },
    });
    console.log(`✓ PREMIUM activé pour ${USERS[0].email}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
