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
  emailVerified?: Date | string | null;
  createdAt: Date | string;
  profile: StudentProfile;
}): UserRecord {
  return {
    id: input.id,
    email: input.email,
    passwordHash: input.passwordHash,
    passwordSalt: input.passwordSalt,
    role: input.role,
    emailVerified: input.emailVerified instanceof Date ? input.emailVerified.toISOString() : (input.emailVerified ?? null),
    createdAt: input.createdAt instanceof Date ? input.createdAt.toISOString() : input.createdAt,
    profile: sanitizeProfileForRole(input.profile, input.role),
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

type PrismaStudentProfileRecord = NonNullable<Awaited<ReturnType<typeof prisma.studentProfile.findUnique>>>;

function toStudentProfile(profile: PrismaStudentProfileRecord): StudentProfile {
  const teacherEmail = (profile as PrismaStudentProfileRecord & { teacherEmail?: string | null }).teacherEmail;
  return {
    displayName: profile.displayName,
    classLevel: profile.classLevel,
    targetScore: profile.targetScore,
    establishment: profile.establishment ?? undefined,
    eafDate: profile.eafDate?.toISOString(),
    onboardingCompleted: profile.onboardingCompleted,
    selectedOeuvres: profile.selectedOeuvres,
    classCode: profile.classCode ?? undefined,
    parcoursProgress: profile.parcoursProgress,
    badges: profile.badges,
    preferredObjects: profile.preferredObjects,
    weakSkills: profile.weakSkills,
    oeuvreChoisieEntretien: profile.oeuvreChoisieEntretien ?? undefined,
    parentEmail: profile.parentEmail ?? undefined,
    teacherEmail: teacherEmail ?? undefined,
    parentConsentToken: profile.parentConsentToken ?? undefined,
    parentConsentStatus: profile.parentConsentStatus ?? undefined,
    parentConsentDate: profile.parentConsentDate?.toISOString(),
    parentConsentIpHash: profile.parentConsentIpHash ?? undefined,
  };
}

function sanitizeProfileForRole(profile: StudentProfile, role: UserRole): StudentProfile {
  if (role === 'eleve' || role === 'admin') {
    return profile;
  }

  return {
    displayName: profile.displayName,
    classLevel: profile.classLevel,
    targetScore: profile.targetScore,
    establishment: profile.establishment,
    eafDate: profile.eafDate,
    onboardingCompleted: profile.onboardingCompleted,
    selectedOeuvres: profile.selectedOeuvres,
    classCode: profile.classCode,
    parcoursProgress: profile.parcoursProgress,
    badges: profile.badges,
    preferredObjects: profile.preferredObjects,
    weakSkills: profile.weakSkills,
    oeuvreChoisieEntretien: profile.oeuvreChoisieEntretien,
  };
}

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
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        profile: user.profile ? toStudentProfile(user.profile) : DEFAULT_PROFILE,
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
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      profile: user.profile ? toStudentProfile(user.profile) : DEFAULT_PROFILE,
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
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      profile: user.profile ? toStudentProfile(user.profile) : DEFAULT_PROFILE,
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
    const profileCreate = {
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
      parentEmail: input.profile.parentEmail ?? undefined,
      parentConsentToken: input.profile.parentConsentToken ?? undefined,
      parentConsentStatus: input.profile.parentConsentStatus ?? undefined,
      ...(input.profile.teacherEmail !== undefined ? { teacherEmail: input.profile.teacherEmail ?? undefined } : {}),
    };
    await prisma.user.create({
      data: {
        id: input.id,
        email: input.email,
        passwordHash: input.passwordHash,
        passwordSalt: input.passwordSalt,
        role: input.role ?? 'eleve',
        profile: {
          create: profileCreate as never,
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
        emailVerified: null,
        createdAt: new Date().toISOString(),
        profile: input.profile,
      },
    ],
  }));
}

export async function updateUserProfile(userId: string, profile: StudentProfile) {
  if (await isDatabaseAvailable()) {
    const profileUpdate = {
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
      parentEmail: profile.parentEmail ?? null,
      parentConsentToken: profile.parentConsentToken ?? null,
      parentConsentStatus: profile.parentConsentStatus ?? undefined,
      parentConsentDate: profile.parentConsentDate ? new Date(profile.parentConsentDate) : undefined,
      parentConsentIpHash: profile.parentConsentIpHash ?? null,
      ...(profile.teacherEmail !== undefined ? { teacherEmail: profile.teacherEmail ?? null } : {}),
    };
    const profileCreate = {
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
      parentEmail: profile.parentEmail ?? undefined,
      parentConsentToken: profile.parentConsentToken ?? undefined,
      parentConsentStatus: profile.parentConsentStatus ?? undefined,
      parentConsentDate: profile.parentConsentDate ? new Date(profile.parentConsentDate) : undefined,
      parentConsentIpHash: profile.parentConsentIpHash ?? undefined,
      ...(profile.teacherEmail !== undefined ? { teacherEmail: profile.teacherEmail ?? undefined } : {}),
    };
    await prisma.studentProfile.upsert({
      where: { userId },
      update: profileUpdate as never,
      create: profileCreate as never,
    });
    return;
  }

  await writeFallbackStore((current) => ({
    ...current,
    users: current.users.map((item) => (item.id === userId ? { ...item, profile } : item)),
  }));
}
