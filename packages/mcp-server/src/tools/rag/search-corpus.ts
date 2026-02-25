import { z } from 'zod'
import { getDb } from '../../lib/db.js'
import type { CorpusChunk, AuthorityLevel, DocType } from '../../types/index.js'

// ============================================================
// eaf_search_corpus — Recherche hybride (vectorielle + BM25)
// ============================================================

export const SearchCorpusSchema = z.object({
  query: z.string().min(3, 'La requête doit faire au moins 3 caractères'),
  filters: z.object({
    authorityLevel: z.enum(['A', 'B', 'C', 'D']).optional(),
    docType: z
      .enum(['bareme', 'programme', 'annale', 'methodologie', 'oeuvre', 'autre'])
      .optional(),
    objetEtude: z.string().optional(),
    sessionYear: z.number().int().optional(),
  }).optional(),
  topK: z.number().int().min(1).max(20).default(8),
  rerank: z.boolean().default(true),
  requireAuthorityA: z.boolean().default(false),
})

export type SearchCorpusInput = z.infer<typeof SearchCorpusSchema>

export interface SearchCorpusResult {
  hits: CorpusChunk[]
  totalFound: number
  searchMode: 'hybrid' | 'vector_only' | 'lexical_fallback'
  hasAuthorityASource: boolean
  queryEmbeddingMs: number
  searchMs: number
  authorityAMissing?: boolean
}

export async function searchCorpus(input: SearchCorpusInput): Promise<SearchCorpusResult> {
  const db = getDb()
  const searchStart = Date.now()

  let hits: CorpusChunk[] = []
  let searchMode: SearchCorpusResult['searchMode'] = 'lexical_fallback'
  let queryEmbeddingMs = 0

  try {
    // 1. Tenter la recherche vectorielle via pgvector
    const embedStart = Date.now()
    const embedding = await generateEmbedding(input.query)
    queryEmbeddingMs = Date.now() - embedStart

    if (embedding) {
      // Recherche vectorielle pgvector
      const vectorHits = await db.$queryRaw<RawChunk[]>`
        SELECT
          c.id,
          c.title,
          c."sourceUrl",
          c."authorityLevel",
          c."docType",
          c."publishedAt",
          c."legalBasis",
          LEFT(c.content, 500) as excerpt,
          1 - (c.embedding <=> ${`[${embedding.join(',')}]`}::vector) as score
        FROM "Chunk" c
        WHERE
          1 - (c.embedding <=> ${`[${embedding.join(',')}]`}::vector) > 0.3
        ORDER BY c.embedding <=> ${`[${embedding.join(',')}]`}::vector
        LIMIT ${input.topK * 2}
      `

      hits = vectorHits
        .map(formatRawChunk)
        .filter((hit) => {
          if (input.filters?.authorityLevel && hit.authorityLevel !== input.filters.authorityLevel) return false
          if (input.filters?.docType && hit.docType !== input.filters.docType) return false
          return true
        })
      searchMode = 'vector_only'

      // 2. Enrichir avec la recherche lexicale BM25 (fusion des résultats)
      const lexicalHits = await lexicalSearch(db, input.query, input.filters, input.topK)

      // Fusion et déduplication
      const merged = mergeAndDeduplicate(hits, lexicalHits)
      hits = merged
      searchMode = 'hybrid'
    }
  } catch {
    // Fallback lexical si pgvector indisponible
    hits = await lexicalSearch(db, input.query, input.filters, input.topK)
    searchMode = 'lexical_fallback'
  }

  // Reranking par score de pertinence si activé
  if (input.rerank && hits.length > 1) {
    hits = rerankByRelevance(hits, input.query)
  }

  // Limiter aux top K
  hits = hits.slice(0, input.topK)

  const hasAuthorityASource = hits.some((h) => h.authorityLevel === 'A')

  // Vérification requireAuthorityA
  if (input.requireAuthorityA && !hasAuthorityASource) {
    return {
      hits: [],
      totalFound: 0,
      searchMode,
      hasAuthorityASource: false,
      queryEmbeddingMs,
      searchMs: Date.now() - searchStart,
      authorityAMissing: true,
    }
  }

  return {
    hits,
    totalFound: hits.length,
    searchMode,
    hasAuthorityASource,
    queryEmbeddingMs,
    searchMs: Date.now() - searchStart,
  }
}

// ============================================================
// eaf_get_chunk
// ============================================================

export const GetChunkSchema = z.object({
  chunkId: z.string().min(1),
  includeNeighbors: z.boolean().default(false),
  neighborWindow: z.number().int().min(1).max(3).default(1),
})

export type GetChunkInput = z.infer<typeof GetChunkSchema>

interface GetChunkResult {
  id: string
  content: string
  metadata: {
    docId: string
    title: string
    page: number | null
    sectionPath: string | null
    sourceUrl: string | null
    authorityLevel: string
    legalBasis: string | null
  }
  neighbors?: {
    before: { id: string; content: string }[]
    after: { id: string; content: string }[]
  }
}

export async function getChunk(input: GetChunkInput): Promise<GetChunkResult> {
  const db = getDb()

  const chunk = await db.chunk.findUnique({
    where: { id: input.chunkId },
  })

  if (!chunk) {
    throw new Error(`Chunk introuvable : ${input.chunkId}`)
  }

  let neighbors: GetChunkResult['neighbors']

  if (input.includeNeighbors) {
    // Trouver les chunks du même document avec des index adjacents
    const neighborChunks = await db.$queryRaw<{ id: string; content: string; chunkIndex: number }[]>`
      SELECT id, content, "chunkIndex"
      FROM "Chunk"
      WHERE "docId" = ${(chunk as Record<string, unknown>).docId as string}
        AND "chunkIndex" BETWEEN ${((chunk as Record<string, unknown>).chunkIndex as number) - input.neighborWindow}
          AND ${((chunk as Record<string, unknown>).chunkIndex as number) + input.neighborWindow}
        AND id != ${chunk.id}
      ORDER BY "chunkIndex"
    `

    const chunkIndex = (chunk as Record<string, unknown>).chunkIndex as number
    neighbors = {
      before: neighborChunks
        .filter((c) => c.chunkIndex < chunkIndex)
        .map((c) => ({ id: c.id, content: c.content })),
      after: neighborChunks
        .filter((c) => c.chunkIndex > chunkIndex)
        .map((c) => ({ id: c.id, content: c.content })),
    }
  }

  return {
    id: chunk.id,
    content: chunk.content,
    metadata: {
      docId: (chunk as Record<string, unknown>).docId as string,
      title: chunk.sourceTitle ?? 'Document sans titre',
      page: (chunk as Record<string, unknown>).page as number | null ?? null,
      sectionPath: (chunk as Record<string, unknown>).sectionPath as string | null ?? null,
      sourceUrl: (chunk as Record<string, unknown>).sourceUrl as string | null ?? null,
      authorityLevel: (chunk as Record<string, unknown>).authorityLevel as string ?? 'D',
      legalBasis: (chunk as Record<string, unknown>).legalBasis as string | null ?? null,
    },
    neighbors,
  }
}

// ============================================================
// eaf_index_document — Indexation RAG (admin seulement)
// ============================================================

export const IndexDocumentSchema = z.object({
  sourceUrl: z.string().url('URL valide requise'),
  sourceOrg: z.string().min(1),
  authorityLevel: z.enum(['A', 'B', 'C', 'D']),
  docType: z.enum(['bareme', 'programme', 'annale', 'methodologie', 'oeuvre', 'autre']),
  license: z.enum(['domaine_public', 'licence_expresse', 'citation_pedagogique']),
  legalBasis: z.string().min(10, 'Justification juridique requise (min 10 chars)'),
  sessionYear: z.number().int().min(2024).max(2030),
  forceReindex: z.boolean().default(false),
})

export type IndexDocumentInput = z.infer<typeof IndexDocumentSchema>

interface IndexDocumentResult {
  indexed: boolean
  docId: string
  chunksCreated: number
  embeddingsGenerated: number
  dedupSkipped: number
  durationMs: number
  warnings: string[]
}

export async function indexDocument(input: IndexDocumentInput): Promise<IndexDocumentResult> {
  // Règle R-COPY-01 : vérification licence avant toute ingestion
  if (input.license === 'citation_pedagogique') {
    // Limité à des extraits courts uniquement
    return {
      indexed: false,
      docId: '',
      chunksCreated: 0,
      embeddingsGenerated: 0,
      dedupSkipped: 0,
      durationMs: 0,
      warnings: [
        'R-COPY-01: Ingestion refusée pour licence "citation_pedagogique". Seules les licences "domaine_public" et "licence_expresse" sont autorisées pour indexation complète.',
      ],
    }
  }

  const start = Date.now()
  const db = getDb()
  const warnings: string[] = []

  // Vérifier si déjà indexé
  const existingDoc = await db.$queryRaw<{ id: string }[]>`
    SELECT id FROM "Chunk" WHERE "sourceUrl" = ${input.sourceUrl} LIMIT 1
  `

  if (existingDoc.length > 0 && !input.forceReindex) {
    return {
      indexed: false,
      docId: existingDoc[0].id,
      chunksCreated: 0,
      embeddingsGenerated: 0,
      dedupSkipped: 1,
      durationMs: Date.now() - start,
      warnings: ['Document déjà indexé. Utiliser forceReindex: true pour ré-indexer.'],
    }
  }

  // Télécharger et chunker le document
  let content = ''
  try {
    const response = await fetch(input.sourceUrl, {
      headers: { 'User-Agent': 'Nexus-EAF-Bot/1.0 (education; +https://eaf.nexusreussite.academy)' },
      signal: AbortSignal.timeout(30000),
    })
    content = await response.text()
  } catch (err) {
    throw new Error(`Impossible de télécharger le document : ${err instanceof Error ? err.message : 'Erreur réseau'}`)
  }

  // Chunking simple (splitting par paragraphes, max 1000 chars)
  const chunks = chunkText(content, 1000)

  let chunksCreated = 0
  let embeddingsGenerated = 0
  let dedupSkipped = 0

  const docId = crypto.randomUUID()

  for (let i = 0; i < chunks.length; i++) {
    const chunkContent = chunks[i]
    const chunkHash = await computeHash(chunkContent)

    // Vérifier déduplication
    const existing = await db.$queryRaw<{ id: string }[]>`
      SELECT id FROM "Chunk" WHERE hash = ${chunkHash} LIMIT 1
    `

    if (existing.length > 0) {
      dedupSkipped++
      continue
    }

    // Générer l'embedding
    const embedding = await generateEmbedding(chunkContent)

    await db.$executeRaw`
      INSERT INTO "Chunk" (
        id, "docId", content, title, "sourceUrl", "authorityLevel",
        "docType", "legalBasis", "chunkIndex", hash, embedding, "createdAt"
      ) VALUES (
        ${crypto.randomUUID()}, ${docId}, ${chunkContent},
        ${`${input.sourceOrg} — ${input.sessionYear}`},
        ${input.sourceUrl}, ${input.authorityLevel},
        ${input.docType}, ${input.legalBasis},
        ${i}, ${chunkHash},
        ${embedding ? `[${embedding.join(',')}]::vector` : null},
        NOW()
      )
    `

    chunksCreated++
    if (embedding) embeddingsGenerated++
  }

  if (chunks.length > 500) {
    warnings.push(`Document très long (${chunks.length} chunks) — vérifier la qualité du contenu`)
  }

  return {
    indexed: true,
    docId,
    chunksCreated,
    embeddingsGenerated,
    dedupSkipped,
    durationMs: Date.now() - start,
    warnings,
  }
}

// ============================================================
// Helpers internes
// ============================================================

interface RawChunk {
  id: string
  title: string | null
  sourceUrl: string | null
  authorityLevel: string
  docType: string | null
  publishedAt: Date | null
  legalBasis: string | null
  excerpt: string
  score: number
}

function formatRawChunk(raw: RawChunk): CorpusChunk {
  return {
    id: raw.id,
    title: raw.title ?? 'Sans titre',
    excerpt: raw.excerpt,
    sourceUrl: raw.sourceUrl ?? '',
    authorityLevel: raw.authorityLevel as AuthorityLevel,
    score: raw.score,
    docType: (raw.docType ?? 'autre') as DocType,
    publishedAt: raw.publishedAt?.toISOString() ?? null,
    legalBasis: raw.legalBasis,
  }
}

async function lexicalSearch(
  db: ReturnType<typeof getDb>,
  query: string,
  filters: SearchCorpusInput['filters'],
  limit: number
): Promise<CorpusChunk[]> {
  // Recherche full-text PostgreSQL
  const results = await db.$queryRaw<RawChunk[]>`
    SELECT
      c.id, c.title, c."sourceUrl", c."authorityLevel",
      c."docType", c."publishedAt", c."legalBasis",
      LEFT(c.content, 500) as excerpt,
      ts_rank(
        to_tsvector('french', c.content),
        plainto_tsquery('french', ${query})
      ) as score
    FROM "Chunk" c
    WHERE to_tsvector('french', c.content) @@ plainto_tsquery('french', ${query})
    ORDER BY score DESC
    LIMIT ${limit}
  `
  return results
    .map(formatRawChunk)
    .filter((hit) => {
      if (filters?.authorityLevel && hit.authorityLevel !== filters.authorityLevel) return false
      if (filters?.docType && hit.docType !== filters.docType) return false
      return true
    })
}

function mergeAndDeduplicate(vectorHits: CorpusChunk[], lexicalHits: CorpusChunk[]): CorpusChunk[] {
  const seen = new Set<string>()
  const merged: CorpusChunk[] = []

  for (const hit of [...vectorHits, ...lexicalHits]) {
    if (!seen.has(hit.id)) {
      seen.add(hit.id)
      merged.push(hit)
    }
  }

  return merged.sort((a, b) => b.score - a.score)
}

function rerankByRelevance(hits: CorpusChunk[], query: string): CorpusChunk[] {
  const queryTerms = query.toLowerCase().split(/\s+/)

  return hits.sort((a, b) => {
    let scoreA = a.score
    let scoreB = b.score

    // Bonus autorité A
    if (a.authorityLevel === 'A') scoreA += 0.2
    if (b.authorityLevel === 'A') scoreB += 0.2

    // Bonus pertinence termes dans l'extrait
    const excerptA = a.excerpt.toLowerCase()
    const excerptB = b.excerpt.toLowerCase()
    const termsInA = queryTerms.filter((t) => excerptA.includes(t)).length
    const termsInB = queryTerms.filter((t) => excerptB.includes(t)).length
    scoreA += termsInA * 0.05
    scoreB += termsInB * 0.05

    return scoreB - scoreA
  })
}

async function generateEmbedding(text: string): Promise<number[] | null> {
  const ollamaUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'
  const model = process.env.OLLAMA_EMBEDDING_MODEL ?? 'nomic-embed-text'

  try {
    const response = await fetch(`${ollamaUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, prompt: text }),
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) return null
    const data = await response.json() as { embedding: number[] }
    return data.embedding
  } catch {
    return null
  }
}

function chunkText(text: string, maxChunkSize: number): string[] {
  const paragraphs = text
    .replace(/<[^>]+>/g, ' ')           // Supprimer HTML
    .replace(/\s+/g, ' ')               // Normaliser espaces
    .split(/\n{2,}/)                     // Splitter par paragraphes
    .filter((p) => p.trim().length > 50) // Ignorer les paragraphes trop courts

  const chunks: string[] = []
  let current = ''

  for (const paragraph of paragraphs) {
    if ((current + paragraph).length > maxChunkSize && current.length > 0) {
      chunks.push(current.trim())
      current = paragraph
    } else {
      current += (current ? '\n\n' : '') + paragraph
    }
  }

  if (current.trim().length > 50) {
    chunks.push(current.trim())
  }

  return chunks
}

async function computeHash(content: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(content)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}
