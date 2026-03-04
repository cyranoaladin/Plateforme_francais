/**
 * RAG Ingestion Pipeline — Production-grade document ingestion.
 *
 * Handles: PDF/text extraction → cleaning → semantic chunking → embedding → pgvector storage.
 * Supports rich metadata (sourceType, annee, voie, workId, parcours, authorityLevel).
 *
 * @module rag/ingestion/pipeline
 */

import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import { isDatabaseAvailable, prisma } from '@/lib/db/client';
import { getLLMProvider } from '@/lib/llm/factory';
import { toVectorLiteral } from '@/lib/llm/embeddings';
import { logger } from '@/lib/logger';
import { createHash } from 'crypto';

export type RagSourceType =
  | 'BO'
  | 'EDUSCOL'
  | 'OEUVRE'
  | 'RAPPORT_JURY'
  | 'ANNALE'
  | 'METHODO'
  | 'GLOSSAIRE'
  | 'GRILLE_NOTATION'
  | 'DICTIONNAIRE_OEUVRES';

export type RagVoie = 'GENERALE' | 'TECHNOLOGIQUE' | 'BOTH';

export type RagAuthorityLevel =
  | 'A'   // Texte officiel (BO, programmes)
  | 'B'   // Document Eduscol / rapport jury
  | 'C'   // Œuvre intégrale / annale officielle
  | 'D';  // Ressource méthodologique / glossaire

export interface DocumentMetadata {
  sourceType: RagSourceType;
  annee: string;
  voie?: RagVoie;
  workId?: string;
  parcoursId?: string;
  objEtude?: string;
  auteur?: string;
  titre: string;
  sourceRef: string;
  authorityLevel: RagAuthorityLevel;
  legalBasis?: string;
}

export interface ChunkingOptions {
  targetTokens?: number;
  maxTokens?: number;
  overlap?: number;
  strategy?: 'paragraph' | 'sentence' | 'fixed';
}

const DEFAULT_CHUNKING: Required<ChunkingOptions> = {
  targetTokens: 450,
  maxTokens: 600,
  overlap: 80,
  strategy: 'paragraph',
};

/**
 * Estimate token count from text (rough: 1 token ≈ 4 chars for French).
 */
function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Clean raw extracted text: remove pagination artifacts, excessive whitespace, page numbers.
 */
function cleanText(raw: string): string {
  return raw
    .replace(/\f/g, '\n\n')
    .replace(/page\s+\d+\s*(de|\/|sur)\s*\d+/gi, '')
    .replace(/^\s*\d+\s*$/gm, '')
    .replace(/—\s*\d+\s*—/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Split text into semantic chunks respecting paragraph boundaries.
 * Includes overlap tokens for continuity between chunks.
 */
function semanticChunk(
  text: string,
  options: ChunkingOptions = {},
): Array<{ text: string; tokenCount: number }> {
  const opts = { ...DEFAULT_CHUNKING, ...options };
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (paragraphs.length === 0) {
    return [{ text, tokenCount: estimateTokenCount(text) }];
  }

  const chunks: Array<{ text: string; tokenCount: number }> = [];
  let currentParts: string[] = [];
  let currentTokens = 0;

  for (const para of paragraphs) {
    const paraTokens = estimateTokenCount(para);

    if (paraTokens > opts.maxTokens) {
      if (currentParts.length > 0) {
        const chunkText = currentParts.join('\n\n');
        chunks.push({ text: chunkText, tokenCount: estimateTokenCount(chunkText) });
        currentParts = [];
        currentTokens = 0;
      }
      const sentences = para.split(/(?<=[.!?])\s+/);
      let sentBuf = '';
      let sentTokens = 0;
      for (const sent of sentences) {
        const st = estimateTokenCount(sent);
        if (sentTokens + st > opts.maxTokens && sentBuf) {
          chunks.push({ text: sentBuf.trim(), tokenCount: sentTokens });
          sentBuf = sent;
          sentTokens = st;
        } else {
          sentBuf = sentBuf ? `${sentBuf} ${sent}` : sent;
          sentTokens += st;
        }
      }
      if (sentBuf.trim()) {
        currentParts.push(sentBuf.trim());
        currentTokens = sentTokens;
      }
      continue;
    }

    if (currentTokens + paraTokens > opts.targetTokens && currentParts.length > 0) {
      const chunkText = currentParts.join('\n\n');
      chunks.push({ text: chunkText, tokenCount: estimateTokenCount(chunkText) });

      if (opts.overlap > 0 && currentParts.length > 0) {
        const lastPart = currentParts[currentParts.length - 1] ?? '';
        const overlapTokens = estimateTokenCount(lastPart);
        if (overlapTokens <= opts.overlap) {
          currentParts = [lastPart];
          currentTokens = overlapTokens;
        } else {
          currentParts = [];
          currentTokens = 0;
        }
      } else {
        currentParts = [];
        currentTokens = 0;
      }
    }

    currentParts.push(para);
    currentTokens += paraTokens;
  }

  if (currentParts.length > 0) {
    const chunkText = currentParts.join('\n\n');
    chunks.push({ text: chunkText, tokenCount: estimateTokenCount(chunkText) });
  }

  return chunks;
}

/**
 * Compute a content hash for deduplication.
 */
function contentHash(text: string): string {
  return createHash('sha256').update(text).digest('hex').slice(0, 16);
}

/**
 * Batch embed an array of texts using the configured LLM provider.
 */
async function batchEmbed(texts: string[], batchSize = 50): Promise<number[][]> {
  const provider = getLLMProvider();
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    for (const text of batch) {
      const embedding = await provider.getEmbeddings(text);
      results.push(embedding);
    }
  }

  return results;
}

/**
 * Ingest a single document into the RAG vector store.
 *
 * @param content - Raw text content of the document (already extracted from PDF/DOCX).
 * @param meta - Rich metadata for filtering and reranking.
 * @param chunkingOptions - Optional chunking configuration overrides.
 * @returns Number of chunks indexed.
 */
export async function ingestDocument(
  content: string,
  meta: DocumentMetadata,
  chunkingOptions?: ChunkingOptions,
): Promise<{ chunksIndexed: number; skipped: boolean }> {
  if (!(await isDatabaseAvailable())) {
    logger.warn({ titre: meta.titre }, 'rag.ingest.db_unavailable');
    return { chunksIndexed: 0, skipped: true };
  }

  const cleaned = cleanText(content);
  if (cleaned.length < 50) {
    logger.warn({ titre: meta.titre, length: cleaned.length }, 'rag.ingest.content_too_short');
    return { chunksIndexed: 0, skipped: true };
  }

  const chunks = semanticChunk(cleaned, chunkingOptions);
  const texts = chunks.map((c) => c.text);
  const embeddings = await batchEmbed(texts);

  let indexed = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (!chunk) continue;

    const hash = contentHash(chunk.text);
    const vector = toVectorLiteral(embeddings[i] ?? []);

    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "Chunk" ("id", "docId", "sourceTitle", "sourceUrl", "sourceType", "content", "embedding", "chunkIndex", "title", "authorityLevel", "docType", "legalBasis", "hash", "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7::vector, $8, $9, $10, $11, $12, $13, NOW())
         ON CONFLICT ("hash") DO NOTHING`,
        randomUUID(),
        meta.workId ?? `${meta.sourceType}_${meta.annee}`,
        meta.titre,
        meta.sourceRef,
        meta.sourceType,
        chunk.text,
        vector,
        i,
        meta.titre,
        meta.authorityLevel,
        meta.sourceType,
        meta.legalBasis ?? null,
        hash,
      );
      indexed += 1;
    } catch (error) {
      logger.error({ titre: meta.titre, chunkIndex: i, error }, 'rag.ingest.chunk_insert_error');
    }
  }

  logger.info(
    { titre: meta.titre, sourceType: meta.sourceType, chunks: indexed, total: chunks.length },
    'rag.ingest.document_complete',
  );

  return { chunksIndexed: indexed, skipped: false };
}

/**
 * Ingest a document from a file path (reads the file, extracts text, then ingests).
 * Currently supports .txt and .md files directly; PDF extraction requires pre-processing.
 */
export async function ingestDocumentFromFile(
  filePath: string,
  meta: DocumentMetadata,
  chunkingOptions?: ChunkingOptions,
): Promise<{ chunksIndexed: number; skipped: boolean }> {
  const ext = filePath.split('.').pop()?.toLowerCase();

  if (ext === 'txt' || ext === 'md') {
    const content = await fs.readFile(filePath, 'utf-8');
    return ingestDocument(content, meta, chunkingOptions);
  }

  logger.warn({ filePath, ext }, 'rag.ingest.unsupported_file_type — use pre-extracted text');
  return { chunksIndexed: 0, skipped: true };
}

/**
 * Bulk ingest multiple documents with progress logging.
 */
export async function bulkIngest(
  documents: Array<{ content: string; meta: DocumentMetadata }>,
  chunkingOptions?: ChunkingOptions,
): Promise<{ totalChunks: number; documentsProcessed: number; errors: number }> {
  let totalChunks = 0;
  let processed = 0;
  let errors = 0;

  for (const doc of documents) {
    try {
      const result = await ingestDocument(doc.content, doc.meta, chunkingOptions);
      totalChunks += result.chunksIndexed;
      processed += 1;

      if (processed % 10 === 0) {
        logger.info(
          { processed, total: documents.length, totalChunks },
          'rag.bulk_ingest.progress',
        );
      }
    } catch (error) {
      errors += 1;
      logger.error({ titre: doc.meta.titre, error }, 'rag.bulk_ingest.document_error');
    }
  }

  logger.info(
    { documentsProcessed: processed, totalChunks, errors },
    'rag.bulk_ingest.complete',
  );

  return { totalChunks, documentsProcessed: processed, errors };
}
