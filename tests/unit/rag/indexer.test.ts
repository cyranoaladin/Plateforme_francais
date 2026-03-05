import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/client', () => ({
  isDatabaseAvailable: vi.fn().mockResolvedValue(false),
  prisma: { chunk: { deleteMany: vi.fn() } },
}));

describe('indexReferencesToVectorStore', () => {
  it('skippe proprement si DB indisponible', async () => {
    const { indexReferencesToVectorStore } = await import('@/lib/rag/indexer');
    const out = await indexReferencesToVectorStore();
    expect(out).toEqual({ indexed: 0, skipped: true });
  });
});
