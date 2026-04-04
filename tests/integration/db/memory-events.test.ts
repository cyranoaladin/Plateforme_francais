import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/client', () => ({
  assertDatabaseAvailable: vi.fn(async () => {
    throw new Error('Base de données indisponible pour les événements mémoire.');
  }),
  prisma: {},
}));

describe('DB memory-events', () => {
  it('échoue explicitement quand la DB est indisponible', async () => {
    const repo = await import('@/lib/db/repositories/memoryRepo');
    await expect(repo.listMemoryEvents()).rejects.toThrow('Base de données indisponible pour les événements mémoire.');
  });
});
