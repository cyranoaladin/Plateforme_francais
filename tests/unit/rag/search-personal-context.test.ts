import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockVectorSearch = vi.fn();
const mockFetchStudentDescriptifChunks = vi.fn();

vi.mock('@/lib/rag/vector-search', () => ({
  vectorSearch: (...args: unknown[]) => mockVectorSearch(...args),
  fetchStudentDescriptifChunks: (...args: unknown[]) => mockFetchStudentDescriptifChunks(...args),
  levelFromDocId: () => 'Premi\u00e8re',
  scoreFromDistance: (d: number) => 1 - d,
}));

// Mock external RAG so searchOfficialReferences returns predictable results
vi.mock('@/lib/rag/external-client', () => ({
  fetchExternalRAGResults: vi.fn().mockResolvedValue([]),
}));

const officialResult = {
  id: 'off-1',
  title: 'Baudelaire \u2014 Sp\u00e9leen',
  type: 'texte_officiel' as const,
  level: 'Premi\u00e8re',
  sourceRef: 'Programme officiel',
  excerpt: 'Quand le ciel bas et lourd\u2026',
  score: 0.8,
};

const personalChunk = {
  docId: 'pers-1',
  sourceTitle: 'Mon texte personnel',
  content: 'Contenu personnel extrait du descriptif de lecture de l\u2019\u00e9l\u00e8ve.',
};

describe('searchWithPersonalContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    // vectorSearch returns one official-like result
    mockVectorSearch.mockResolvedValue([
      { id: 'off-1', distance: 0.2, content: officialResult.excerpt },
    ]);
    mockFetchStudentDescriptifChunks.mockResolvedValue([personalChunk]);
  });

  it('pr\u00e9fixe les r\u00e9sultats personnels avant les r\u00e9f\u00e9rences officielles', async () => {
    const { searchWithPersonalContext } = await import('@/lib/rag/search');
    const results = await searchWithPersonalContext('Baudelaire', 'stu-1', 5);

    // Personal results have score 1.5; official results come from vectorSearch (score < 1.5)
    const personalIdx = results.findIndex((r) => r.score === 1.5);
    expect(personalIdx).toBeGreaterThanOrEqual(0);
    // Personal must appear before official (lower index)
    const officialIdx = results.findIndex((r) => r.score < 1.5);
    if (officialIdx !== -1) {
      expect(personalIdx).toBeLessThan(officialIdx);
    }
  });

  it('assigne un score 1.5 aux chunks personnels', async () => {
    const { searchWithPersonalContext } = await import('@/lib/rag/search');
    const results = await searchWithPersonalContext('Baudelaire', 'stu-1', 5);

    const personal = results.find((r) => r.id === 'pers-1');
    expect(personal).toBeDefined();
    expect(personal?.score).toBe(1.5);
  });

  it('retourne uniquement les r\u00e9sultats vectorSearch si pas de chunks personnels', async () => {
    mockFetchStudentDescriptifChunks.mockResolvedValue([]);

    const { searchWithPersonalContext } = await import('@/lib/rag/search');
    const results = await searchWithPersonalContext('Baudelaire', 'stu-2', 3);

    expect(results.every((r) => r.score !== 1.5)).toBe(true);
  });

  it("ne l\u00e8ve pas d'erreur si fetchStudentDescriptifChunks \u00e9choue", async () => {
    mockFetchStudentDescriptifChunks.mockRejectedValue(new Error('DB unavailable'));

    const { searchWithPersonalContext } = await import('@/lib/rag/search');
    await expect(searchWithPersonalContext('Baudelaire', 'stu-3', 3)).resolves.toBeDefined();
  });

  it('appelle fetchStudentDescriptifChunks avec le bon studentId', async () => {
    const { searchWithPersonalContext } = await import('@/lib/rag/search');
    await searchWithPersonalContext('Baudelaire', 'stu-targeted', 3);

    expect(mockFetchStudentDescriptifChunks).toHaveBeenCalledWith('stu-targeted', expect.any(Number));
  });
});

describe('buildOralRagContext avec userId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockVectorSearch.mockResolvedValue([]);
    mockFetchStudentDescriptifChunks.mockResolvedValue([personalChunk]);
  });

  it('appelle fetchStudentDescriptifChunks quand userId est fourni', async () => {
    const { buildOralRagContext } = await import('@/lib/oral/rag-context');
    await buildOralRagContext({
      phase: 'ENTRETIEN',
      oeuvreChoisie: 'Candide',
      transcript: 'Je pense que\u2026',
      userId: 'stu-ctx',
    });

    expect(mockFetchStudentDescriptifChunks).toHaveBeenCalledWith('stu-ctx', expect.any(Number));
  });

  it("n'appelle pas fetchStudentDescriptifChunks quand userId est null", async () => {
    const { buildOralRagContext } = await import('@/lib/oral/rag-context');
    await buildOralRagContext({
      phase: 'EXPLICATION',
      oeuvre: 'Candide',
      userId: null,
    });

    expect(mockFetchStudentDescriptifChunks).not.toHaveBeenCalled();
  });
});
