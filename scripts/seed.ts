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

  // Force clean existing student data for E2E user to ensure fresh seed
  const existingProfile = await prisma.studentProfile.findUnique({ where: { userId: user.id } });
  if (existingProfile) {
    await prisma.descriptifTexte.deleteMany({ where: { studentId: existingProfile.id } });
    await prisma.studentProfile.delete({ where: { userId: user.id } });
    console.log('♻️ Cleared existing profile and texts for Jean.');
  }

  const profile = await prisma.studentProfile.create({
    data: {
      userId: user.id,
      displayName: 'Jean Dupont',
      classLevel: 'Première générale',
      targetScore: '14/20',
      selectedOeuvres: ['La rage de l expression'], // Match index 1 in E2E
      preferredObjects: ['Poésie', 'Roman'],
      weakSkills: ['Problématisation', 'Grammaire'],
    },
  });

  // Seed 20 entries for Descriptif de lecture (P0-04 requirement)
  // Using "La rage de l expression" to match E2E index selection
  await prisma.descriptifTexte.createMany({
    data: Array.from({ length: 20 }).map((_, i) => ({
      studentId: profile.id,
      objetEtude: 'Poésie',
      oeuvre: `La rage de l expression`,
      auteur: "Francis Ponge",
      titre: `Extrait n°${i + 1}`,
      typeExtrait: "Poème en prose",
      premieresLignes: "Ceci est un extrait de test pour la simulation E2E.",
    })),
  });
  console.log('✅ 20 extraits de descriptif ajoutés pour Jean.');
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
