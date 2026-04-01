import { prisma } from '../src/lib/db/client';
import { createPasswordCredentials } from '../src/lib/auth/session';
import { logger } from '../src/lib/logger';

type SeedUser = {
  email: string;
  password: string;
  displayName: string;
  plan: 'FREE' | 'PREMIUM' | 'PRO';
  classLevel: string;
  targetScore: string;
  selectedOeuvres: string[];
  oeuvreChoisieEntretien: string;
  weakSkills: string[];
};

type SeedAdmin = {
  email: string;
  password: string;
};

const SEED_ADMIN: SeedAdmin = {
  email: 'admin@eaf.local',
  password: 'AdminTest2026!',
};

const SEED_USERS: SeedUser[] = [
  {
    email: 'eleve.free@eaf.local',
    password: 'FreeTest2026!',
    displayName: 'Camille Duval (Free)',
    plan: 'FREE',
    classLevel: 'Première générale',
    targetScore: '12/20',
    selectedOeuvres: ['Cahier de Douai', 'Manon Lescaut', 'Le Menteur'],
    oeuvreChoisieEntretien: 'Cahier de Douai',
    weakSkills: ['Grammaire', 'Problématisation'],
  },
  {
    email: 'eleve.pro@eaf.local',
    password: 'ProTest2026!',
    displayName: 'Lucas Martin (Pro)',
    plan: 'PREMIUM',
    classLevel: 'Première générale',
    targetScore: '15/20',
    selectedOeuvres: [
      'Cahier de Douai',
      'Mes forêts',
      'Discours de la servitude volontaire',
      'Le Menteur',
      'Manon Lescaut',
      'La Peau de chagrin',
    ],
    oeuvreChoisieEntretien: 'Discours de la servitude volontaire',
    weakSkills: ['Lecture expressive'],
  },
  {
    email: 'eleve.masterium@eaf.local',
    password: 'MasteriumTest2026!',
    displayName: 'Emma Benali (Masterium)',
    plan: 'PRO',
    classLevel: 'Première générale',
    targetScore: '18/20',
    selectedOeuvres: [
      'Cahier de Douai',
      'La Rage de l\u2019expression',
      'Mes forêts',
      'Discours de la servitude volontaire',
      'Entretiens sur la pluralité des mondes',
      'Lettres d\u2019une Péruvienne',
      'Le Menteur',
      'On ne badine pas avec l\u2019amour',
      'Pour un oui ou pour un non',
      'Manon Lescaut',
      'La Peau de chagrin',
      'Sido / Les Vrilles de la vigne',
    ],
    oeuvreChoisieEntretien: 'Manon Lescaut',
    weakSkills: [],
  },
];

async function seedAdmin(data: SeedAdmin) {
  const credentials = createPasswordCredentials(data.password);
  await prisma.user.upsert({
    where: { email: data.email },
    update: {
      passwordHash: credentials.passwordHash,
      passwordSalt: credentials.passwordSalt,
      role: 'admin',
    },
    create: {
      email: data.email,
      passwordHash: credentials.passwordHash,
      passwordSalt: credentials.passwordSalt,
      role: 'admin',
    },
  });
  console.log(`  ✅ Admin (${data.email})`);
}

async function seedUser(data: SeedUser) {
  const credentials = createPasswordCredentials(data.password);

  const user = await prisma.user.upsert({
    where: { email: data.email },
    update: {
      passwordHash: credentials.passwordHash,
      passwordSalt: credentials.passwordSalt,
    },
    create: {
      email: data.email,
      passwordHash: credentials.passwordHash,
      passwordSalt: credentials.passwordSalt,
      role: 'eleve',
    },
  });

  // Clean existing profile
  const existing = await prisma.studentProfile.findUnique({ where: { userId: user.id } });
  if (existing) {
    await prisma.descriptifTexte.deleteMany({ where: { studentId: existing.id } });
    await prisma.carnetEntry.deleteMany({ where: { studentId: existing.id } });
    await prisma.studentProfile.delete({ where: { userId: user.id } });
  }

  await prisma.studentProfile.create({
    data: {
      userId: user.id,
      displayName: data.displayName,
      classLevel: data.classLevel,
      targetScore: data.targetScore,
      onboardingCompleted: true,
      selectedOeuvres: data.selectedOeuvres,
      oeuvreChoisieEntretien: data.oeuvreChoisieEntretien,
      preferredObjects: ['Poésie', 'Roman'],
      weakSkills: data.weakSkills,
      eafDate: new Date('2026-06-08'),
      anneeScolaire: '2025-2026',
    },
  });

  // Create subscription for PREMIUM and PRO
  if (data.plan !== 'FREE') {
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days

    await prisma.subscription.upsert({
      where: { userId: user.id },
      update: {
        plan: data.plan,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      create: {
        userId: user.id,
        plan: data.plan,
        status: 'ACTIVE',
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    });
  }

  console.log(`  ✅ ${data.displayName} (${data.email}) — Plan ${data.plan}`);
}

async function main() {
  console.log('=== Seed Nexus EAF — 4 profils test ===\n');

  await seedAdmin(SEED_ADMIN);

  for (const userData of SEED_USERS) {
    await seedUser(userData);
  }

  // Also keep the legacy jean@eaf.local for backward compatibility
  const legacyCredentials = createPasswordCredentials('demo1234');
  const legacyUser = await prisma.user.upsert({
    where: { email: 'jean@eaf.local' },
    update: { passwordHash: legacyCredentials.passwordHash, passwordSalt: legacyCredentials.passwordSalt },
    create: { email: 'jean@eaf.local', passwordHash: legacyCredentials.passwordHash, passwordSalt: legacyCredentials.passwordSalt, role: 'eleve' },
  });
  const legacyProfile = await prisma.studentProfile.findUnique({ where: { userId: legacyUser.id } });
  if (!legacyProfile) {
    await prisma.studentProfile.create({
      data: {
        userId: legacyUser.id,
        displayName: 'Jean Dupont',
        classLevel: 'Première générale',
        targetScore: '14/20',
        selectedOeuvres: ['La Rage de l\u2019expression'],
        preferredObjects: ['Poésie', 'Roman'],
        weakSkills: ['Problématisation', 'Grammaire'],
        anneeScolaire: '2025-2026',
      },
    });
  }
  console.log('  ✅ Jean Dupont (jean@eaf.local) — Legacy\n');

  console.log('=== Seed terminé ===');
  console.log('\nComptes test :');
  console.log(`  ADMIN     : ${SEED_ADMIN.email} / ${SEED_ADMIN.password}`);
  console.log('  FREEMIUM  : eleve.free@eaf.local / FreeTest2026!');
  console.log('  PREMIUM   : eleve.pro@eaf.local / ProTest2026!');
  console.log('  MASTERIUM : eleve.masterium@eaf.local / MasteriumTest2026!');
  console.log('  LEGACY    : jean@eaf.local / demo1234');
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (error: unknown) => {
    logger.error({ route: 'scripts/seed', error }, 'Seed error');
    await prisma.$disconnect();
    process.exit(1);
  });
