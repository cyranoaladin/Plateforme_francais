import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/client', () => ({
  assertDatabaseAvailable: vi.fn(async () => {
    throw new Error('Base de données indisponible pour les copies.');
  }),
  prisma: {},
}));

describe('DB copie', () => {
  it('échoue explicitement quand la DB est indisponible', async () => {
    const repo = await import('@/lib/epreuves/repository');
    await expect(repo.createCopie({ epreuveId: 'ep1', userId: 'u1', filePath: 'f', fileType: 'image/jpeg' }))
      .rejects.toThrow('Base de données indisponible pour les copies.');
  });
});
