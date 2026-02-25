import { OFFICIAL_REFERENCES, type ReferenceDoc } from '@/data/references';
import { levelFromDocId, scoreFromDistance, vectorSearch } from '@/lib/rag/vector-search';

export type RagSearchResult = {
  id: string;
  title: string;
  type: ReferenceDoc['type'];
  level: ReferenceDoc['level'];
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
    excerpt: doc.excerpt,
    url: doc.url,
    score: scoreDocument(doc, tokens),
  }))
    .filter((doc) => doc.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

export async function searchOfficialReferences(
  query: string,
  maxResults = 5,
): Promise<RagSearchResult[]> {
  const topK = Number.parseInt(process.env.RAG_TOP_K ?? `${maxResults}`, 10);
  const safeTopK = Number.isFinite(topK) ? Math.max(1, Math.min(topK, 20)) : maxResults;

  if (!query.trim()) {
    return lexicalSearch(query, maxResults);
  }

  try {
    const result = await vectorSearch(query, Math.max(maxResults, safeTopK));

    if (result.chunks.length === 0) {
      console.info('[rag] mode=lexical reason=empty_vector_result');
      return lexicalSearch(query, maxResults);
    }

    const mapped = result.chunks.slice(0, maxResults).map((chunk) => ({
      id: chunk.docId,
      title: chunk.sourceTitle,
      type: (chunk.sourceType as ReferenceDoc['type']) ?? 'texte_officiel',
      level: levelFromDocId(chunk.docId),
      excerpt: chunk.content.slice(0, 220),
      url: chunk.sourceUrl,
      score: scoreFromDistance(Number(chunk.distance)),
    }));

    console.info('[rag] mode=vector results=%d', mapped.length);
    return mapped;
  } catch (error) {
    console.info('[rag] mode=lexical reason=vector_unavailable', error);
    return lexicalSearch(query, maxResults);
  }
}
