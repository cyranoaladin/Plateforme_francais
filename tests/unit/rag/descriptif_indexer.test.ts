import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockExecuteRaw = vi.fn().mockResolvedValue(1);
const mockGetEmbeddings = vi.fn().mockResolvedValue(Array(1024).fill(0.1));

vi.mock('@/lib/db/client', () => ({
  isDatabaseAvailable: vi.fn().mockResolvedValue(true),
  prisma: {
    $executeRaw: (...args: unknown[]) => mockExecuteRaw(...args),
  },
}));

vi.mock('@/lib/llm/factory', () => ({
  getLLMProvider: () => ({
    getEmbeddings: (...args: unknown[]) => mockGetEmbeddings(...args),
  }),
}));

describe('indexerTexteDescriptif', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockExecuteRaw.mockResolvedValue(1);
    mockGetEmbeddings.mockResolvedValue(Array(1024).fill(0.1));
  });

  it('retourne { indexed: 0, chunks: 0 } si contenu trop court (< 50 chars)', async () => {
    const { indexerTexteDescriptif } = await import('@/lib/rag/indexer');
    const result = await indexerTexteDescriptif({
      texteDescriptifId: 'test-id',
      studentId: 'student-id',
      contenu: 'trop court',
      metadata: { titre: 'T', auteur: 'A', typeTexte: 'EXTRAIT_OEUVRE' },
    });
    expect(result.indexed).toBe(0);
    expect(result.chunks).toBe(0);
  });

  it('retourne { indexed: 0, chunks: 0 } si DB indisponible', async () => {
    const { isDatabaseAvailable } = await import('@/lib/db/client');
    vi.mocked(isDatabaseAvailable).mockResolvedValueOnce(false);

    const { indexerTexteDescriptif } = await import('@/lib/rag/indexer');
    const result = await indexerTexteDescriptif({
      texteDescriptifId: 'test-db-down',
      studentId: 'student-id',
      contenu: 'a'.repeat(200),
      metadata: { titre: 'T', auteur: 'A', typeTexte: 'EXTRAIT_OEUVRE' },
    });
    expect(result.indexed).toBe(0);
  });

  it('indexe correctement un texte long (appelle getEmbeddings + $executeRaw)', async () => {
    const { indexerTexteDescriptif } = await import('@/lib/rag/indexer');
    const result = await indexerTexteDescriptif({
      texteDescriptifId: 'test-id-long',
      studentId: 'student-id',
      contenu: 'a'.repeat(600),
      metadata: { titre: 'Texte Long', auteur: 'Auteur Test', typeTexte: 'EXTRAIT_OEUVRE' },
    });
    expect(result.chunks).toBeGreaterThan(0);
    expect(result.indexed).toBeGreaterThan(0);
    expect(mockGetEmbeddings).toHaveBeenCalled();
    expect(mockExecuteRaw).toHaveBeenCalled();
  });

  it('encode le studentId dans sourceUrl pour le filtrage RAG', async () => {
    const calls: unknown[] = [];
    mockExecuteRaw.mockImplementation((...args: unknown[]) => {
      calls.push(args);
      return Promise.resolve(1);
    });

    const { indexerTexteDescriptif } = await import('@/lib/rag/indexer');
    await indexerTexteDescriptif({
      texteDescriptifId: 'test-priv',
      studentId: 'student-private-42',
      contenu: 'x'.repeat(200),
      metadata: { titre: 'Mon Texte', auteur: 'Mon Auteur', typeTexte: 'EXTRAIT_OEUVRE' },
    });

    const callsStr = JSON.stringify(calls);
    // sourceUrl must embed studentId for per-student filtering
    expect(callsStr).toContain('student-private-42');
  });

  it('supprime les anciens chunks avant de ré-indexer (DELETE puis INSERT)', async () => {
    const callOrder: string[] = [];
    mockExecuteRaw.mockImplementation((...args: unknown[]) => {
      const sql = JSON.stringify(args);
      callOrder.push(sql.includes('DELETE') ? 'DELETE' : 'INSERT');
      return Promise.resolve(1);
    });

    const { indexerTexteDescriptif } = await import('@/lib/rag/indexer');
    await indexerTexteDescriptif({
      texteDescriptifId: 'test-reindex',
      studentId: 'student-reindex',
      contenu: 'y'.repeat(200),
      metadata: { titre: 'T', auteur: 'A', typeTexte: 'EXTRAIT_OEUVRE' },
    });

    expect(callOrder[0]).toBe('DELETE');
    expect(callOrder.some((c) => c === 'INSERT')).toBe(true);
  });
});

describe('supprimerTexteDescriptifRAG', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockExecuteRaw.mockResolvedValue(1);
  });

  it('appelle $executeRaw avec DELETE', async () => {
    const { supprimerTexteDescriptifRAG } = await import('@/lib/rag/indexer');
    await supprimerTexteDescriptifRAG('texte-to-delete');

    expect(mockExecuteRaw).toHaveBeenCalledTimes(1);
    const callStr = JSON.stringify(mockExecuteRaw.mock.calls[0]);
    expect(callStr).toContain('texte-to-delete');
  });
});
