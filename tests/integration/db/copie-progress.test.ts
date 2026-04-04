import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/client', () => ({
  assertDatabaseAvailable: vi.fn(async () => {
    throw new Error('Base de données indisponible pour les événements de copie.');
  }),
  prisma: {},
}));

describe('DB copie progress events', () => {
  it('échoue explicitement quand la DB est indisponible', async () => {
    const repo = await import('@/lib/epreuves/repository');
    await expect(repo.listCopieProgressEvents('copie-1')).rejects.toThrow('Base de données indisponible pour les événements de copie.');
  });
});
