import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { DocumentMetadata } from '@/lib/rag/ingestion/pipeline';

/**
 * Ingestion pipeline tests.
 *
 * ingestDocument uses prisma + LLM embeddings, so we mock both.
 * We test the pipeline's behavior: short content skipping, chunk counting,
 * DB-unavailable fallback, and deduplication via ON CONFLICT.
 */

const mockExecuteRawUnsafe = vi.fn().mockResolvedValue(undefined);

vi.mock('@/lib/db/client', () => ({
  isDatabaseAvailable: vi.fn().mockResolvedValue(true),
  prisma: {
    $executeRawUnsafe: (...args: unknown[]) => mockExecuteRawUnsafe(...args),
  },
}));

vi.mock('@/lib/llm/factory', () => ({
  getLLMProvider: () => ({
    getEmbeddings: vi.fn().mockResolvedValue(new Array(768).fill(0)),
  }),
}));

vi.mock('@/lib/llm/embeddings', () => ({
  toVectorLiteral: vi.fn().mockReturnValue('[0,0,0]'),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe('ingestDocument', () => {
  let ingestDocument: typeof import('@/lib/rag/ingestion/pipeline').ingestDocument;

  const baseMeta: DocumentMetadata = {
    sourceType: 'OEUVRE',
    annee: '2025',
    titre: 'Les Fleurs du Mal',
    sourceRef: 'baudelaire-fleurs-du-mal',
    authorityLevel: 'C',
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('@/lib/rag/ingestion/pipeline');
    ingestDocument = mod.ingestDocument;
  });

  it('skips content shorter than 50 characters', async () => {
    const result = await ingestDocument('Trop court.', baseMeta);
    expect(result.skipped).toBe(true);
    expect(result.chunksIndexed).toBe(0);
  });

  it('indexes a short document as a single chunk', async () => {
    const content = 'A'.repeat(200) + '\n\nParagraphe court mais suffisant pour être indexé dans le RAG.';
    const result = await ingestDocument(content, baseMeta);
    expect(result.skipped).toBe(false);
    expect(result.chunksIndexed).toBeGreaterThanOrEqual(1);
    expect(mockExecuteRawUnsafe).toHaveBeenCalled();
  });

  it('creates multiple chunks for long content', async () => {
    const paragraph = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(50);
    const content = Array.from({ length: 10 }, () => paragraph).join('\n\n');
    const result = await ingestDocument(content, baseMeta);
    expect(result.skipped).toBe(false);
    expect(result.chunksIndexed).toBeGreaterThan(1);
  });

  it('uses ON CONFLICT for deduplication', async () => {
    const content = 'A'.repeat(200) + '\n\nContenu suffisant pour indexation.';
    await ingestDocument(content, baseMeta);
    const sqlCall = mockExecuteRawUnsafe.mock.calls[0]?.[0] as string;
    expect(sqlCall).toContain('ON CONFLICT');
    expect(sqlCall).toContain('hash');
  });

  it('passes metadata to the SQL insert', async () => {
    const content = 'A'.repeat(200) + '\n\nContenu avec métadonnées spécifiques.';
    await ingestDocument(content, baseMeta);
    const args = mockExecuteRawUnsafe.mock.calls[0];
    expect(args).toBeDefined();
    // titre is passed as $3
    expect(args).toContain('Les Fleurs du Mal');
    // sourceType is passed as $5
    expect(args).toContain('OEUVRE');
    // authorityLevel is passed as $10
    expect(args).toContain('C');
  });

  it('returns skipped=true when DB is unavailable', async () => {
    const { isDatabaseAvailable } = await import('@/lib/db/client');
    vi.mocked(isDatabaseAvailable).mockResolvedValueOnce(false);
    const content = 'A'.repeat(200) + '\n\nContenu suffisant.';
    const result = await ingestDocument(content, baseMeta);
    expect(result.skipped).toBe(true);
    expect(result.chunksIndexed).toBe(0);
  });
});

describe('bulkIngest', () => {
  let bulkIngest: typeof import('@/lib/rag/ingestion/pipeline').bulkIngest;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import('@/lib/rag/ingestion/pipeline');
    bulkIngest = mod.bulkIngest;
  });

  it('processes multiple documents and returns totals', async () => {
    const docs = [
      { content: 'A'.repeat(200) + '\n\nDoc un contenu suffisant.', meta: { sourceType: 'OEUVRE' as const, annee: '2025', titre: 'Doc 1', sourceRef: 'ref-1', authorityLevel: 'C' as const } },
      { content: 'B'.repeat(200) + '\n\nDoc deux contenu suffisant.', meta: { sourceType: 'BO' as const, annee: '2025', titre: 'Doc 2', sourceRef: 'ref-2', authorityLevel: 'A' as const } },
    ];
    const result = await bulkIngest(docs);
    expect(result.documentsProcessed).toBe(2);
    expect(result.errors).toBe(0);
    expect(result.totalChunks).toBeGreaterThanOrEqual(2);
  });
});
