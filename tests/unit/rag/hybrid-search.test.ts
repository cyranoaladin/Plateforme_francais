import { beforeEach, describe, expect, it, vi } from 'vitest';

const externalSearchMock = vi.fn();
const vectorSearchMock = vi.fn();

vi.mock('@/lib/rag/external-client', () => ({
  externalRAG: {
    isConfigured: () => true,
    search: externalSearchMock,
  },
}));

vi.mock('@/lib/rag/vector-search', () => ({
  vectorSearch: vectorSearchMock,
  scoreFromDistance: (distance: number) => Number((100 / (1 + Math.max(distance, 0))).toFixed(2)),
  levelFromDocId: () => 'Niveau B',
}));

describe('searchOfficialReferences hybrid chain', () => {
  beforeEach(() => {
    vi.resetModules();
    externalSearchMock.mockReset();
    vectorSearchMock.mockReset();
  });

  it('utilise external + local fusion quand external répond', async () => {
    externalSearchMock.mockResolvedValueOnce({
      results: [{ content: 'Barème oral 20 points', score: 0.9, metadata: { title: 'BO', source: 'BO' } }],
    });
    vectorSearchMock.mockResolvedValueOnce({ chunks: [], distances: [] });

    const { searchOfficialReferences } = await import('@/lib/rag/search');
    const results = await searchOfficialReferences('barème oral EAF', 5);

    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => /barème|20/i.test(r.excerpt))).toBe(true);
  });

  it('fallback lexical si external vide et vector indisponible', async () => {
    externalSearchMock.mockResolvedValueOnce({ results: [] });
    vectorSearchMock.mockRejectedValueOnce(new Error('db down'));

    const { searchOfficialReferences } = await import('@/lib/rag/search');
    const results = await searchOfficialReferences('explication linéaire', 5);

    expect(results.length).toBeGreaterThan(0);
  });
});
