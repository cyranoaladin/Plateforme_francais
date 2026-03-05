import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = {
  users: [] as Array<{ id: string; email: string; passwordHash: string; passwordSalt: string; role: 'eleve'; createdAt: string; profile: any }>,
};

vi.mock('@/lib/db/client', () => ({
  isDatabaseAvailable: vi.fn().mockResolvedValue(false),
  prisma: {},
}));

vi.mock('@/lib/db/fallback-store', () => ({
  readFallbackStore: vi.fn(async () => ({ users: state.users, sessions: [], events: [] })),
  writeFallbackStore: vi.fn(async (updater: any) => {
    const next = updater({ users: state.users, sessions: [], events: [] });
    state.users = next.users;
  }),
}));

describe('DB user-repo', () => {
  beforeEach(() => {
    state.users = [];
  });

  it('create + find user en fallback store', async () => {
    const repo = await import('@/lib/db/repositories/userRepo');
    await repo.createUser({
      id: 'u1', email: 'u1@test.local', passwordHash: 'h', passwordSalt: 's',
      profile: {
        displayName: 'U1', classLevel: 'Première', targetScore: '14/20', onboardingCompleted: false,
        selectedOeuvres: [], parcoursProgress: [], badges: [], preferredObjects: [], weakSkills: [],
      },
    });

    const found = await repo.findUserByEmail('u1@test.local');
    expect(found?.id).toBe('u1');
  });
});
