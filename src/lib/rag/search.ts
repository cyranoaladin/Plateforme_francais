import { OFFICIAL_REFERENCES, type ReferenceDoc } from '@/data/references';
import { levelFromDocId, scoreFromDistance, vectorSearch } from '@/lib/rag/vector-search';
import { reciprocalRankFusion, metadataRerank } from '@/lib/rag/rerank';
import { externalRAG, type ExternalRAGChunk } from '@/lib/rag/external-client';
import { logger } from '@/lib/logger';

export type RagSearchResult = {
  id: string;
  title: string;
  type: ReferenceDoc['type'];
  level: ReferenceDoc['level'];
  sourceRef: string;
  excerpt: string;
  url: string;
  score: number;
};

const STOP_WORDS = new Set([
  'de',
  'la',
  'le',
  'les',
  'du',
  'des',
  'un',
  'une',
  'et',
  'ou',
  'a',
  'au',
  'aux',
  'pour',
  'sur',
  'dans',
  'que',
  'qui',
  'en',
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
      url: doc.url,
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
    url: doc.url,
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
    excerpt: chunk.content.slice(0, 300),
    url: sourceUrl,
    score: chunk.score,
  };
}

/**
 * Search using external RAG API (rag-api.nexusreussite.academy).
 * Returns results from the rag_education collection.
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
        matiere: 'Français',
        oeuvre: context?.oeuvre,
        parcours: context?.parcours,
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
 *   1. Try external RAG API (rag-api.nexusreussite.academy) as primary source
 *   2. Fallback to local hybrid search (vector + lexical + RRF)
 *   3. Metadata rerank with context boost
 *   4. Return top-N (default 5)
 */
export async function searchOfficialReferences(
  query: string,
  maxResults = 5,
  context?: { oeuvre?: string; parcours?: string },
): Promise<RagSearchResult[]> {
  const PREFETCH = 20;

  if (!query.trim()) {
    return lexicalSearch(query, maxResults);
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
        level: levelFromDocId(chunk.docId),
        sourceRef: chunk.sourceUrl || chunk.docId,
        excerpt: chunk.content.slice(0, 220),
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

  const final = reranked.slice(0, maxResults);
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
