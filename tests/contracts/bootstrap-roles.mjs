#!/usr/bin/env node
import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function createPasswordCredentials(password) {
  const passwordSalt = crypto.randomBytes(16).toString('hex');
  const passwordHash = crypto.pbkdf2Sync(password, passwordSalt, 120000, 48, 'sha512').toString('hex');
  return { passwordHash, passwordSalt };
}

async function upsertUser({ email, password, role, displayName }) {
  const creds = createPasswordCredentials(password);

  await prisma.user.upsert({
    where: { email },
    update: {
      role,
      passwordHash: creds.passwordHash,
      passwordSalt: creds.passwordSalt,
      profile: {
        upsert: {
          create: {
            displayName,
            classLevel: 'Première générale',
            targetScore: '14/20',
            onboardingCompleted: true,
            selectedOeuvres: [],
            parcoursProgress: [],
            badges: [],
            preferredObjects: [],
            weakSkills: [],
          },
          update: {
            displayName,
          },
        },
      },
    },
    create: {
      email,
      role,
      passwordHash: creds.passwordHash,
      passwordSalt: creds.passwordSalt,
      profile: {
        create: {
          displayName,
          classLevel: 'Première générale',
          targetScore: '14/20',
          onboardingCompleted: true,
          selectedOeuvres: [],
          parcoursProgress: [],
          badges: [],
          preferredObjects: [],
          weakSkills: [],
        },
      },
    },
  });
}

async function main() {
  await prisma.$queryRaw`SELECT 1`;

  await upsertUser({
    email: 'teacher.contract@eaf.local',
    password: 'Contract1234',
    role: 'enseignant',
    displayName: 'Teacher Contract',
  });

  await upsertUser({
    email: 'admin.contract@eaf.local',
    password: 'Contract1234',
    role: 'admin',
    displayName: 'Admin Contract',
  });
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

