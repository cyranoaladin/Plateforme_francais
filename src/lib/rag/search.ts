import { OFFICIAL_REFERENCES, type ReferenceDoc } from '@/data/references';
import { levelFromDocId, scoreFromDistance, vectorSearch } from '@/lib/rag/vector-search';
import { reciprocalRankFusion, metadataRerank } from '@/lib/rag/rerank';

export type RagSearchResult = {
  id: string;
  title: string;
  type: ReferenceDoc['type'];
  level: ReferenceDoc['level'];
  excerpt: string;
  sourceRef: string;
  score: number;
};

export type RagSearchOptions = {
  query: string;
  maxResults?: number;
  context?: { oeuvre?: string; parcours?: string };
  sourceTypes?: string[];
  workId?: string;
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
      excerpt: doc.excerpt,
      sourceRef: doc.sourceRef,
      score: 0,
    }));
  }

  const tokens = tokenize(trimmed);

  return OFFICIAL_REFERENCES.map((doc) => ({
    id: doc.id,
    title: doc.title,
    type: doc.type,
    level: doc.level,
    excerpt: doc.excerpt,
    sourceRef: doc.sourceRef,
    score: scoreDocument(doc, tokens),
  }))
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

/**
 * Search official references using hybrid RAG V2:
 *   1. Fetch top-20 from vector search
 *   2. Fetch top-20 from lexical search
 *   3. RRF fusion → top-20 merged
 *   4. Metadata rerank (boost same oeuvre/parcours)
 *   5. Return top-N (default 5)
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

  const lexicalResults = lexicalSearch(query, PREFETCH);

  let vectorResults: RagSearchResult[] = [];
  try {
    const result = await vectorSearch(query, PREFETCH);
    if (result.chunks.length > 0) {
      vectorResults = result.chunks.map((chunk) => ({
        id: chunk.docId,
        title: chunk.sourceTitle,
        type: (chunk.sourceType as ReferenceDoc['type']) ?? 'texte_officiel',
        level: levelFromDocId(chunk.docId),
        excerpt: chunk.content.slice(0, 220),
        sourceRef: chunk.sourceUrl,
        score: scoreFromDistance(Number(chunk.distance)),
      }));
    }
  } catch {
    console.info('[rag] vector_unavailable, lexical-only fallback');
  }

  // RRF fusion of both lists
  const fused = vectorResults.length > 0
    ? reciprocalRankFusion(vectorResults, lexicalResults)
    : lexicalResults;

  // Metadata rerank with context boost
  const reranked = metadataRerank(fused, context);

  const final = reranked.slice(0, maxResults);
  console.info('[rag] mode=%s results=%d', vectorResults.length > 0 ? 'hybrid_rrf' : 'lexical', final.length);
  return final;
}

/**
 * Search with structured options (production API).
 * Delegates to searchOfficialReferences with extracted parameters.
 */
export async function searchWithOptions(opts: RagSearchOptions): Promise<RagSearchResult[]> {
  let results = await searchOfficialReferences(
    opts.query,
    (opts.maxResults ?? 5) * 2,
    opts.context,
  );

  if (opts.sourceTypes && opts.sourceTypes.length > 0) {
    const allowed = new Set(opts.sourceTypes.map((t) => t.toLowerCase()));
    results = results.filter((r) => allowed.has(r.type.toLowerCase()));
  }

  if (opts.workId) {
    const wid = opts.workId.toLowerCase();
    results = results.map((r) => ({
      ...r,
      score: r.id.toLowerCase().includes(wid) || r.title.toLowerCase().includes(wid)
        ? r.score + 0.15
        : r.score,
    })).sort((a, b) => b.score - a.score);
  }

  return results.slice(0, opts.maxResults ?? 5);
}

/**
 * Format RAG search results into a structured text block for prompt injection.
 * Each result includes title, source reference, and excerpt.
 */
export function formatRagContextForPrompt(results: RagSearchResult[]): string {
  if (results.length === 0) {
    return '';
  }

  return results
    .map((r, i) => {
      const ref = r.sourceRef ? ` (${r.sourceRef})` : '';
      return `[Document ${i + 1}] ${r.title}${ref}\n${r.excerpt}`;
    })
    .join('\n\n');
}
