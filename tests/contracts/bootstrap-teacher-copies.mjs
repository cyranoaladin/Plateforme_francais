#!/usr/bin/env node
import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function createPasswordCredentials(password) {
  const passwordSalt = crypto.randomBytes(16).toString('hex');
  const passwordHash = crypto.pbkdf2Sync(password, passwordSalt, 120000, 48, 'sha512').toString('hex');
  return { passwordHash, passwordSalt };
}

async function upsertTeacher(email, displayName, classCode) {
  const creds = createPasswordCredentials('contract1234');
  return prisma.user.upsert({
    where: { email },
    update: {
      role: 'enseignant',
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
            classCode,
            parcoursProgress: [],
            badges: [],
            preferredObjects: [],
            weakSkills: [],
          },
          update: { displayName, classCode },
        },
      },
    },
    create: {
      email,
      role: 'enseignant',
      passwordHash: creds.passwordHash,
      passwordSalt: creds.passwordSalt,
      profile: {
        create: {
          displayName,
          classLevel: 'Première générale',
          targetScore: '14/20',
          onboardingCompleted: true,
          selectedOeuvres: [],
          classCode,
          parcoursProgress: [],
          badges: [],
          preferredObjects: [],
          weakSkills: [],
        },
      },
    },
    include: { profile: true },
  });
}

async function upsertStudent(email, displayName, classCode) {
  const creds = createPasswordCredentials('contract1234');
  return prisma.user.upsert({
    where: { email },
    update: {
      role: 'eleve',
      passwordHash: creds.passwordHash,
      passwordSalt: creds.passwordSalt,
      profile: {
        upsert: {
          create: {
            displayName,
            classLevel: 'Première générale',
            targetScore: '12/20',
            onboardingCompleted: true,
            selectedOeuvres: [],
            classCode,
            parcoursProgress: [],
            badges: [],
            preferredObjects: [],
            weakSkills: [],
          },
          update: { displayName, classCode },
        },
      },
    },
    create: {
      email,
      role: 'eleve',
      passwordHash: creds.passwordHash,
      passwordSalt: creds.passwordSalt,
      profile: {
        create: {
          displayName,
          classLevel: 'Première générale',
          targetScore: '12/20',
          onboardingCompleted: true,
          selectedOeuvres: [],
          classCode,
          parcoursProgress: [],
          badges: [],
          preferredObjects: [],
          weakSkills: [],
        },
      },
    },
    include: { profile: true },
  });
}

async function createCopyForStudent(studentId) {
  const epreuve = await prisma.epreuveBlanche.create({
    data: {
      userId: studentId,
      type: 'commentaire',
      sujet: 'Sujet contrat enseignant',
      texte: 'Texte support contrat',
      consignes: 'Consignes test',
      bareme: { analyse: 10, langue: 10 },
    },
  });

  const copy = await prisma.copieDeposee.create({
    data: {
      epreuveId: epreuve.id,
      userId: studentId,
      filePath: 'uploads/copies/contract/test.jpg',
      fileType: 'image/jpeg',
      status: 'done',
      correction: { note: 12, mention: 'Passable' },
    },
  });

  return copy.id;
}

async function main() {
  await prisma.$queryRaw`SELECT 1`;

  const teacher = await upsertTeacher('teacher.contract@eaf.local', 'Teacher Contract', 'CLS123');
  const studentSameClass = await upsertStudent('student.same.contract@eaf.local', 'Student Same Class', 'CLS123');
  const studentOtherClass = await upsertStudent('student.other.contract@eaf.local', 'Student Other Class', 'CLS999');

  const copieSameClassId = await createCopyForStudent(studentSameClass.id);
  const copieOtherClassId = await createCopyForStudent(studentOtherClass.id);

  process.stdout.write(
    JSON.stringify({
      teacherEmail: teacher.email,
      teacherPassword: 'contract1234',
      copieSameClassId,
      copieOtherClassId,
    }),
  );
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

