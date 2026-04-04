import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/client', () => ({
  assertDatabaseAvailable: vi.fn(async () => {
    throw new Error('Base de données indisponible pour les utilisateurs.');
  }),
  prisma: {},
}));

describe('DB user-repo', () => {
  it('échoue explicitement quand la DB est indisponible', async () => {
    const repo = await import('@/lib/db/repositories/userRepo');
    await expect(repo.findUserByEmail('u1@test.local')).rejects.toThrow('Base de données indisponible pour les utilisateurs.');
  });
});
