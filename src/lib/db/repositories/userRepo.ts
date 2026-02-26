import { type UserRole } from '@prisma/client';
import { type StudentProfile, type UserRecord } from '@/lib/auth/types';
import { isDatabaseAvailable, prisma } from '@/lib/db/client';
import { readFallbackStore, writeFallbackStore } from '@/lib/db/fallback-store';

function toUserRecord(input: {
  id: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  role: UserRole;
  createdAt: Date | string;
  profile: StudentProfile;
}): UserRecord {
  return {
    id: input.id,
    email: input.email,
    passwordHash: input.passwordHash,
    passwordSalt: input.passwordSalt,
    role: input.role,
    createdAt: input.createdAt instanceof Date ? input.createdAt.toISOString() : input.createdAt,
    profile: input.profile,
  };
}

const DEFAULT_PROFILE: StudentProfile = {
  displayName: 'Élève',
  classLevel: 'Première générale',
  targetScore: '14/20',
  onboardingCompleted: false,
  selectedOeuvres: [],
  parcoursProgress: [],
  badges: [],
  preferredObjects: [],
  weakSkills: ['Problématisation', 'Grammaire'],
};

export async function listUsers(): Promise<UserRecord[]> {
  if (await isDatabaseAvailable()) {
    const users = await prisma.user.findMany({ include: { profile: true } });
    return users.map((user) =>
      toUserRecord({
        id: user.id,
        email: user.email,
        passwordHash: user.passwordHash,
        passwordSalt: user.passwordSalt,
        role: user.role,
        createdAt: user.createdAt,
        profile: user.profile
          ? {
              displayName: user.profile.displayName,
              classLevel: user.profile.classLevel,
              targetScore: user.profile.targetScore,
              establishment: user.profile.establishment ?? undefined,
              eafDate: user.profile.eafDate?.toISOString(),
              onboardingCompleted: user.profile.onboardingCompleted,
              selectedOeuvres: user.profile.selectedOeuvres,
              classCode: user.profile.classCode ?? undefined,
              parcoursProgress: user.profile.parcoursProgress,
              badges: user.profile.badges,
              preferredObjects: user.profile.preferredObjects,
              weakSkills: user.profile.weakSkills,
              oeuvreChoisieEntretien: user.profile.oeuvreChoisieEntretien ?? undefined,
            }
          : DEFAULT_PROFILE,
      }),
    );
  }

  const store = await readFallbackStore();
  return store.users.map((user) => ({ ...user, role: user.role ?? 'eleve' }));
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  if (await isDatabaseAvailable()) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user) {
      return null;
    }

    return toUserRecord({
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      passwordSalt: user.passwordSalt,
      role: user.role,
      createdAt: user.createdAt,
      profile: user.profile
        ? {
            displayName: user.profile.displayName,
            classLevel: user.profile.classLevel,
            targetScore: user.profile.targetScore,
            establishment: user.profile.establishment ?? undefined,
            eafDate: user.profile.eafDate?.toISOString(),
            onboardingCompleted: user.profile.onboardingCompleted,
            selectedOeuvres: user.profile.selectedOeuvres,
            classCode: user.profile.classCode ?? undefined,
            parcoursProgress: user.profile.parcoursProgress,
            badges: user.profile.badges,
            preferredObjects: user.profile.preferredObjects,
            weakSkills: user.profile.weakSkills,
              oeuvreChoisieEntretien: user.profile.oeuvreChoisieEntretien ?? undefined,
          }
        : DEFAULT_PROFILE,
    });
  }

  const store = await readFallbackStore();
  const user = store.users.find((item) => item.email === email);
  return user ? { ...user, role: user.role ?? 'eleve' } : null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  if (await isDatabaseAvailable()) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!user) {
      return null;
    }

    return toUserRecord({
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      passwordSalt: user.passwordSalt,
      role: user.role,
      createdAt: user.createdAt,
      profile: user.profile
        ? {
            displayName: user.profile.displayName,
            classLevel: user.profile.classLevel,
            targetScore: user.profile.targetScore,
            establishment: user.profile.establishment ?? undefined,
            eafDate: user.profile.eafDate?.toISOString(),
            onboardingCompleted: user.profile.onboardingCompleted,
            selectedOeuvres: user.profile.selectedOeuvres,
            classCode: user.profile.classCode ?? undefined,
            parcoursProgress: user.profile.parcoursProgress,
            badges: user.profile.badges,
            preferredObjects: user.profile.preferredObjects,
            weakSkills: user.profile.weakSkills,
              oeuvreChoisieEntretien: user.profile.oeuvreChoisieEntretien ?? undefined,
          }
        : DEFAULT_PROFILE,
    });
  }

  const store = await readFallbackStore();
  const user = store.users.find((item) => item.id === id);
  return user ? { ...user, role: user.role ?? 'eleve' } : null;
}

export async function createUser(input: {
  id: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  profile: StudentProfile;
  role?: UserRole;
}) {
  if (await isDatabaseAvailable()) {
    await prisma.user.create({
      data: {
        id: input.id,
        email: input.email,
        passwordHash: input.passwordHash,
        passwordSalt: input.passwordSalt,
        role: input.role ?? 'eleve',
        profile: {
          create: {
            displayName: input.profile.displayName,
            classLevel: input.profile.classLevel,
            targetScore: input.profile.targetScore,
            establishment: input.profile.establishment,
            eafDate: input.profile.eafDate ? new Date(input.profile.eafDate) : undefined,
            onboardingCompleted: input.profile.onboardingCompleted,
            selectedOeuvres: input.profile.selectedOeuvres,
            classCode: input.profile.classCode,
            parcoursProgress: input.profile.parcoursProgress,
            badges: input.profile.badges,
            preferredObjects: input.profile.preferredObjects,
            weakSkills: input.profile.weakSkills,
            oeuvreChoisieEntretien: input.profile.oeuvreChoisieEntretien,
          },
        },
      },
    });
    return;
  }

  await writeFallbackStore((current) => ({
    ...current,
    users: [
      ...current.users,
      {
        id: input.id,
        email: input.email,
        passwordHash: input.passwordHash,
        passwordSalt: input.passwordSalt,
        role: input.role ?? 'eleve',
        createdAt: new Date().toISOString(),
        profile: input.profile,
      },
    ],
  }));
}

export async function updateUserProfile(userId: string, profile: StudentProfile) {
  if (await isDatabaseAvailable()) {
    await prisma.studentProfile.upsert({
      where: { userId },
      update: {
        displayName: profile.displayName,
        classLevel: profile.classLevel,
        targetScore: profile.targetScore,
        establishment: profile.establishment,
        eafDate: profile.eafDate ? new Date(profile.eafDate) : undefined,
        onboardingCompleted: profile.onboardingCompleted,
        selectedOeuvres: profile.selectedOeuvres,
        classCode: profile.classCode,
        parcoursProgress: profile.parcoursProgress,
        badges: profile.badges,
        preferredObjects: profile.preferredObjects,
        weakSkills: profile.weakSkills,
        oeuvreChoisieEntretien: profile.oeuvreChoisieEntretien ?? null,
      },
      create: {
        userId,
        displayName: profile.displayName,
        classLevel: profile.classLevel,
        targetScore: profile.targetScore,
        establishment: profile.establishment,
        eafDate: profile.eafDate ? new Date(profile.eafDate) : undefined,
        onboardingCompleted: profile.onboardingCompleted,
        selectedOeuvres: profile.selectedOeuvres,
        classCode: profile.classCode,
        parcoursProgress: profile.parcoursProgress,
        badges: profile.badges,
        preferredObjects: profile.preferredObjects,
        weakSkills: profile.weakSkills,
        oeuvreChoisieEntretien: profile.oeuvreChoisieEntretien ?? null,
      },
    });
    return;
  }

  await writeFallbackStore((current) => ({
    ...current,
    users: current.users.map((item) => (item.id === userId ? { ...item, profile } : item)),
  }));
}
