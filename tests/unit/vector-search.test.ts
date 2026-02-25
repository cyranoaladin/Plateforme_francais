import { beforeEach, describe, expect, it, vi } from 'vitest';

const isDatabaseAvailableMock = vi.fn();
const queryRawUnsafeMock = vi.fn();
const getEmbeddingsMock = vi.fn();

vi.mock('@/lib/db/client', () => ({
  isDatabaseAvailable: isDatabaseAvailableMock,
  prisma: {
    $queryRawUnsafe: queryRawUnsafeMock,
  },
}));

vi.mock('@/lib/llm/factory', () => ({
  getLLMProvider: () => ({
    getEmbeddings: getEmbeddingsMock,
  }),
}));

describe('vectorSearch', () => {
  beforeEach(() => {
    vi.resetModules();
    isDatabaseAvailableMock.mockReset();
    queryRawUnsafeMock.mockReset();
    getEmbeddingsMock.mockReset();
  });

  it('retourne les chunks et distances depuis pgvector', async () => {
    isDatabaseAvailableMock.mockResolvedValueOnce(true);
    getEmbeddingsMock.mockResolvedValueOnce([0.12, 0.34, 0.56]);
    queryRawUnsafeMock.mockResolvedValueOnce([
      {
        id: 'c1',
        docId: 'd1',
        sourceTitle: 'Doc',
        sourceUrl: 'https://example.test',
        sourceType: 'fiche',
        content: 'Contenu',
        distance: 0.2,
      },
    ]);

    const { vectorSearch } = await import('@/lib/rag/vector-search');
    const result = await vectorSearch('analyse', 5);

    expect(result.chunks).toHaveLength(1);
    expect(result.distances).toEqual([0.2]);
    expect(getEmbeddingsMock).toHaveBeenCalledWith('analyse');
  });

  it('lève une erreur si la base est indisponible', async () => {
    isDatabaseAvailableMock.mockResolvedValueOnce(false);
    const { vectorSearch } = await import('@/lib/rag/vector-search');

    await expect(vectorSearch('analyse', 5)).rejects.toThrow('Database unavailable for vector search.');
  });
});
