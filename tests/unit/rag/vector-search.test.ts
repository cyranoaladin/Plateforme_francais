import { beforeEach, describe, expect, it, vi } from 'vitest';

const isDatabaseAvailableMock = vi.fn();
const queryRawMock = vi.fn();
const getEmbeddingsMock = vi.fn();

vi.mock('@/lib/db/client', () => ({
  isDatabaseAvailable: isDatabaseAvailableMock,
  prisma: {
    $queryRaw: queryRawMock,
  },
}));

vi.mock('@/lib/llm/factory', () => ({
  getLLMProvider: () => ({
    getEmbeddings: getEmbeddingsMock,
  }),
}));

describe('vectorSearch (module rag)', () => {
  beforeEach(() => {
    vi.resetModules();
    isDatabaseAvailableMock.mockReset();
    queryRawMock.mockReset();
    getEmbeddingsMock.mockReset();
  });

  it('retourne les chunks et distances', async () => {
    isDatabaseAvailableMock.mockResolvedValueOnce(true);
    getEmbeddingsMock.mockResolvedValueOnce([0.1, 0.2, 0.3]);
    queryRawMock.mockResolvedValueOnce([
      { id: 'c1', docId: 'd1', sourceTitle: 'Doc', sourceUrl: '', sourceType: 'fiche', content: 'Contenu', distance: 0.2 },
    ]);

    const { vectorSearch } = await import('@/lib/rag/vector-search');
    const out = await vectorSearch('analyse', 5);
    expect(out.chunks).toHaveLength(1);
    expect(out.distances).toEqual([0.2]);
  });
});
