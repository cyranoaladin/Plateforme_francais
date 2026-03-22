import { OFFICIAL_REFERENCES, type ReferenceDoc } from '@/data/references';
import { levelFromDocId, scoreFromDistance, vectorSearch } from '@/lib/rag/vector-search';
import { reciprocalRankFusion, metadataRerank } from '@/lib/rag/rerank';
import { externalRAG, type ExternalRAGChunk } from '@/lib/rag/external-client';
import { logger } from '@/lib/logger';
import { LRUCache } from '@/lib/cache/lru';

/** 10-minute LRU cache for RAG search results (shared-safe: corpus data, not user data). */
const ragCache = new LRUCache<RagSearchResult[]>({ maxSize: 500, defaultTtlMs: 600_000 });

export type RagSearchResult = {
  id: string;
  title: string;
  type: ReferenceDoc['type'];
  level: string;
  sourceRef: string;
  excerpt: string;
  score: number;
  url?: string;
};

export type RagSearchOptions = {
  query: string;
  maxResults?: number;
  context?: { oeuvre?: string; parcours?: string };
  sourceTypes?: string[];
  workId?: string;
};

const STOP_WORDS = new Set([
  // Articles & contractions
  'de', 'la', 'le', 'les', 'du', 'des', 'un', 'une', 'au', 'aux',
  // Conjonctions & prépositions
  'et', 'ou', 'a', 'pour', 'sur', 'dans', 'par', 'avec', 'sans',
  'vers', 'entre', 'chez', 'contre', 'sous', 'depuis', 'avant', 'apres',
  // Pronoms
  'que', 'qui', 'en', 'ce', 'se', 'ne', 'pas', 'y',
  'son', 'sa', 'ses', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes',
  'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles', 'je', 'tu',
  'leur', 'leurs', 'lui', 'eux', 'moi', 'toi', 'soi',
  // Démonstratifs & relatifs
  'cette', 'ces', 'dont', 'cet', 'celle', 'ceux', 'celles',
  'lequel', 'laquelle', 'lesquels', 'lesquelles',
  // Conjonctions logiques
  'mais', 'donc', 'car', 'ni', 'si', 'puis', 'or',
  // Verbes auxiliaires courants
  'est', 'sont', 'ete', 'etait', 'etaient', 'sera', 'seront',
  'avoir', 'etre', 'fait', 'faire',
  // Adverbes fréquents
  'plus', 'tres', 'bien', 'aussi', 'encore', 'toujours', 'tout', 'tous',
  'peut', 'comme', 'meme',
]);

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}

function scoreDocument(doc: ReferenceDoc, tokens: string[]): number {
  if (tokens.length === 0) {
    return 0;
  }

  const title = doc.title.toLowerCase();
  const excerpt = doc.excerpt.toLowerCase();
  const content = doc.content.toLowerCase();
  const tags = doc.tags.join(' ').toLowerCase();

  let score = 0;
  for (const token of tokens) {
    if (title.includes(token)) {
      score += 4;
    }
    if (tags.includes(token)) {
      score += 3;
    }
    if (excerpt.includes(token)) {
      score += 2;
    }
    if (content.includes(token)) {
      score += 1;
    }
  }

  return score;
}

function lexicalSearch(query: string, maxResults = 5): RagSearchResult[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return OFFICIAL_REFERENCES.slice(0, maxResults).map((doc) => ({
      id: doc.id,
      title: doc.title,
      type: doc.type,
      level: doc.level,
      sourceRef: doc.sourceRef,
      excerpt: doc.excerpt,
      score: 0,
    }));
  }

  const tokens = tokenize(trimmed);

  return OFFICIAL_REFERENCES.map((doc) => ({
    id: doc.id,
    title: doc.title,
    type: doc.type,
    level: doc.level,
    sourceRef: doc.sourceRef,
    excerpt: doc.excerpt,
    score: scoreDocument(doc, tokens),
  }))
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

/**
 * Convert external RAG chunks to RagSearchResult format.
 */
function externalChunkToResult(chunk: ExternalRAGChunk, index: number): RagSearchResult {
  const metadata = chunk.metadata ?? {};
  const title = metadata.title ?? metadata.source ?? `Source ${index + 1}`;
  const sourceUrl = typeof metadata.source === 'string' ? metadata.source : '';

  return {
    id: metadata.chunk_id ?? `ext-${index}`,
    title,
    type: 'texte_officiel' as ReferenceDoc['type'],
    level: (metadata.niveau as ReferenceDoc['level']) ?? 'Niveau B',
    sourceRef: sourceUrl || title,
    excerpt: chunk.content.slice(0, 400),
    score: chunk.score,
  };
}

/**
 * Search using external RAG API (collection rag_francais_premiere).
 */
async function searchExternalRAG(
  query: string,
  maxResults: number,
  context?: { oeuvre?: string; parcours?: string },
): Promise<RagSearchResult[]> {
  if (!externalRAG.isConfigured()) {
    return [];
  }

  try {
    const response = await externalRAG.search({
      query,
      topK: maxResults * 2,
      rerank: true,
      filters: {
        ...(context?.oeuvre && { oeuvre: context.oeuvre }),
        ...(context?.parcours && { parcours: context.parcours }),
      },
    });

    if (response.results.length === 0) {
      return [];
    }

    return response.results
      .slice(0, maxResults)
      .map((chunk, index) => externalChunkToResult(chunk, index));
  } catch (error) {
    logger.warn({ error, query: query.slice(0, 50) }, '[rag] external_rag_error');
    return [];
  }
}

/**
 * Search official references using hybrid RAG V3:
 *   1. Try external RAG API (rag_francais_premiere) as primary source
 *   2. Fallback to local hybrid search (vector + lexical + RRF)
 *   3. Metadata rerank with context boost
 *   4. Return top-N (default 5)
 */
/** Normalize query for cache key generation. */
function normalizeQueryForCache(query: string, context?: { oeuvre?: string; parcours?: string }): string {
  const tokens = tokenize(query).sort().join(' ');
  return `${tokens}|${context?.oeuvre ?? ''}|${context?.parcours ?? ''}`;
}

export async function searchOfficialReferences(
  query: string,
  maxResults = 5,
  context?: { oeuvre?: string; parcours?: string },
): Promise<RagSearchResult[]> {
  const PREFETCH = 12; // Reduced from 20 — top-k optimization

  if (!query.trim()) {
    return lexicalSearch(query, maxResults);
  }

  // Check RAG cache
  const cacheKey = normalizeQueryForCache(query, context);
  const cached = ragCache.get(cacheKey);
  if (cached) {
    logger.info({ query: query.slice(0, 30), cacheHit: true }, '[rag] cache_hit');
    return cached.slice(0, maxResults);
  }

  // 1. Try external RAG first (primary source - 13 661 chunks)
  let externalResults: RagSearchResult[] = [];
  try {
    externalResults = await searchExternalRAG(query, PREFETCH, context);
    if (externalResults.length > 0) {
      logger.info({
        query: query.slice(0, 50),
        resultsCount: externalResults.length,
        source: 'external_rag',
      }, '[rag] external_rag_success');
    }
  } catch (error) {
    logger.warn({ error }, '[rag] external_rag_unavailable');
  }

  // 2. Local lexical search (always available)
  const lexicalResults = lexicalSearch(query, PREFETCH);

  // 3. Local vector search (if database available)
  let vectorResults: RagSearchResult[] = [];
  try {
    const result = await vectorSearch(query, PREFETCH);
    if (result.chunks.length > 0) {
      vectorResults = result.chunks.map((chunk) => ({
        id: chunk.docId,
        title: chunk.sourceTitle,
        type: (chunk.sourceType as ReferenceDoc['type']) ?? 'texte_officiel',
        level: chunk.level || levelFromDocId(),
        sourceRef: chunk.sourceUrl || chunk.docId,
        excerpt: chunk.content.slice(0, 400),
        url: chunk.sourceUrl || chunk.docId,
        score: scoreFromDistance(Number(chunk.distance)),
      }));
    }
  } catch {
    logger.info('[rag] local_vector_unavailable');
  }

  // 4. Determine search mode and fuse results
  let fused: RagSearchResult[];
  let mode: string;

  if (externalResults.length > 0) {
    // External RAG as primary, fuse with local for diversity
    const localFused = vectorResults.length > 0
      ? reciprocalRankFusion(vectorResults, lexicalResults)
      : lexicalResults;

    // RRF fusion: external results weighted higher
    fused = reciprocalRankFusion(externalResults, localFused);
    mode = 'external_hybrid';
  } else if (vectorResults.length > 0) {
    // Fallback to local hybrid
    fused = reciprocalRankFusion(vectorResults, lexicalResults);
    mode = 'local_hybrid';
  } else {
    // Lexical only fallback
    fused = lexicalResults;
    mode = 'lexical_only';
  }

  // 5. Metadata rerank with context boost
  const reranked = metadataRerank(fused, context);

  // Filter out low-score results (noise reduction)
  const MIN_SCORE = 0.01;
  const filtered = reranked.filter((r) => r.score >= MIN_SCORE);
  const final = filtered.slice(0, maxResults);

  // Cache results for future identical queries
  ragCache.set(cacheKey, final);

  logger.info({ mode, resultsCount: final.length, query: query.slice(0, 30) }, '[rag] search_complete');
  return final;
}

/**
 * Direct search on external RAG only (for agents needing pure external data).
 */
export async function searchExternalRAGOnly(
  query: string,
  maxResults = 10,
  context?: { oeuvre?: string; parcours?: string; niveau?: string },
): Promise<RagSearchResult[]> {
  return searchExternalRAG(query, maxResults, context);
}

export function formatRagContextForPrompt(results: RagSearchResult[]): string {
  if (results.length === 0) {
    return '';
  }

  return results
    .map((result, index) => {
      const source = result.sourceRef || result.title;
      return `[Document ${index + 1}] ${result.title}\nSource: ${source}\nExtrait: ${result.excerpt}`;
    })
    .join('\n\n');
}
