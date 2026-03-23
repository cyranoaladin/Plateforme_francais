import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFindUnique = vi.fn();
const mockCreate = vi.fn();
const mockUpsert = vi.fn();

vi.mock('@/lib/db/client', () => ({
  isDatabaseAvailable: vi.fn().mockResolvedValue(true),
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
    studentProfile: {
      upsert: (...args: unknown[]) => mockUpsert(...args),
    },
  },
}));

vi.mock('@/lib/db/fallback-store', () => ({
  readFallbackStore: vi.fn(),
  writeFallbackStore: vi.fn(),
}));

describe('userRepo contact fields', () => {
  beforeEach(() => {
    vi.resetModules();
    mockFindUnique.mockReset();
    mockCreate.mockReset();
    mockUpsert.mockReset();
  });

  it('maps parentEmail and teacherEmail from prisma reads', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'u-contact',
      email: 'contact@test.local',
      passwordHash: 'hash',
      passwordSalt: 'salt',
      role: 'eleve',
      createdAt: new Date('2026-03-23T00:00:00Z'),
      profile: {
        displayName: 'Contact',
        classLevel: 'Première générale',
        targetScore: '14/20',
        onboardingCompleted: false,
        selectedOeuvres: [],
        classCode: null,
        parcoursProgress: [],
        badges: [],
        preferredObjects: [],
        weakSkills: [],
        oeuvreChoisieEntretien: null,
        parentEmail: 'parent@test.local',
        teacherEmail: 'teacher@test.local',
      },
    });

    const repo = await import('@/lib/db/repositories/userRepo');
    const found = await repo.findUserByEmail('contact@test.local');

    expect(found?.profile.parentEmail).toBe('parent@test.local');
    expect(found?.profile.teacherEmail).toBe('teacher@test.local');
  });

  it('persists teacherEmail at account creation', async () => {
    mockCreate.mockResolvedValue(undefined);

    const repo = await import('@/lib/db/repositories/userRepo');
    await repo.createUser({
      id: 'u-create',
      email: 'create@test.local',
      passwordHash: 'hash',
      passwordSalt: 'salt',
      profile: {
        displayName: 'Create',
        classLevel: 'Première générale',
        targetScore: '14/20',
        onboardingCompleted: false,
        selectedOeuvres: [],
        parcoursProgress: [],
        badges: [],
        preferredObjects: [],
        weakSkills: [],
        parentEmail: 'parent-create@test.local',
        teacherEmail: 'teacher-create@test.local',
      },
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          profile: {
            create: expect.objectContaining({
              parentEmail: 'parent-create@test.local',
              teacherEmail: 'teacher-create@test.local',
            }),
          },
        }),
      }),
    );
  });

  it('persists parentEmail and teacherEmail on profile updates', async () => {
    mockUpsert.mockResolvedValue(undefined);

    const repo = await import('@/lib/db/repositories/userRepo');
    await repo.updateUserProfile('u-update', {
      displayName: 'Update',
      classLevel: 'Première générale',
      targetScore: '15/20',
      onboardingCompleted: true,
      selectedOeuvres: ['Cahier de Douai'],
      parcoursProgress: ['onboarding'],
      badges: [],
      preferredObjects: [],
      weakSkills: ['Grammaire'],
      parentEmail: 'parent-update@test.local',
      teacherEmail: 'teacher-update@test.local',
    });

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          parentEmail: 'parent-update@test.local',
          teacherEmail: 'teacher-update@test.local',
        }),
        create: expect.objectContaining({
          parentEmail: 'parent-update@test.local',
          teacherEmail: 'teacher-update@test.local',
        }),
      }),
    );
  });
});
