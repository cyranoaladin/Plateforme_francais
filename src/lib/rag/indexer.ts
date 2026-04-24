import { Prisma } from '@prisma/client';
import { OFFICIAL_REFERENCES } from '@/data/references';
import { randomUUID } from 'crypto';
import { isDatabaseAvailable, prisma } from '@/lib/db/client';
import { EMBEDDING_DIMENSION, toVectorLiteral } from '@/lib/llm/embeddings';
import { getLLMProvider } from '@/lib/llm/factory';
import { logger } from '@/lib/logger';

type ChunkInsert = {
  docId: string;
  sourceTitle: string;
  sourceUrl: string;
  sourceType: string;
  content: string;
  embedding: number[];
  chunkIndex: number;
  batchId: string;
};

function splitIntoChunksByParagraphs(content: string, maxTokens: number): string[] {
  const paragraphs = content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);

  const chunks: string[] = [];
  let current = '';
  let currentTokens = 0;

  for (const paragraph of paragraphs.length > 0 ? paragraphs : [content]) {
    const tokens = paragraph.split(/\s+/).length;

    if (currentTokens + tokens > maxTokens && current) {
      chunks.push(current.trim());
      current = paragraph;
      currentTokens = tokens;
      continue;
    }

    current = current ? `${current}\n\n${paragraph}` : paragraph;
    currentTokens += tokens;
  }

  if (current.trim().length > 0) {
    chunks.push(current.trim());
  }

  return chunks;
}

/**
 * Validates embedding dimension before insertion.
 * @throws Error if dimension does not match expected EMBEDDING_DIMENSION.
 */
function validateEmbeddingDimension(embedding: number[], context: string): void {
  if (embedding.length !== EMBEDDING_DIMENSION) {
    throw new Error(
      `Embedding dimension mismatch for ${context}: got ${embedding.length}, expected ${EMBEDDING_DIMENSION}`,
    );
  }
}

async function insertChunkSafe(input: ChunkInsert): Promise<void> {
  validateEmbeddingDimension(input.embedding, `${input.docId}#${input.chunkIndex}`);
  const vector = toVectorLiteral(input.embedding);
  await prisma.$executeRaw(
    Prisma.sql`INSERT INTO "Chunk" ("id", "docId", "sourceTitle", "sourceUrl", "sourceType", "content", "embedding", "chunkIndex", "hash", "createdAt")
     VALUES (${randomUUID()}, ${input.docId}, ${input.sourceTitle}, ${input.sourceUrl}, ${input.sourceType}, ${input.content}, ${vector}::vector, ${input.chunkIndex}, ${input.batchId}, NOW())`
  );
}

/**
 * Non-destructive indexation: inserts all chunks with a unique batchId,
 * then atomically deletes old chunks only after all inserts succeed.
 * If the process crashes mid-indexation, old chunks remain available.
 */
export async function indexReferencesToVectorStore(): Promise<{ indexed: number; skipped: boolean }> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Local indexer disabled in production. Use external RAG ingestion pipeline.');
  }

  if (!(await isDatabaseAvailable())) {
    return { indexed: 0, skipped: true };
  }

  const provider = getLLMProvider();
  const chunkSize = Number.parseInt(process.env.RAG_CHUNK_SIZE ?? '500', 10);
  const safeChunkSize = Number.isFinite(chunkSize) ? Math.max(100, chunkSize) : 500;

  // Unique batch ID for this indexation run — used to distinguish new vs old chunks
  const batchId = `batch_${Date.now()}_${randomUUID().slice(0, 8)}`;
  logger.info({ batchId, chunkSize: safeChunkSize }, 'rag.indexer.start');

  let total = 0;

  // Phase 1: Insert new chunks with batchId (old chunks remain available)
  for (const doc of OFFICIAL_REFERENCES) {
    const chunks = splitIntoChunksByParagraphs(doc.content, safeChunkSize);

    for (let index = 0; index < chunks.length; index += 1) {
      const chunk = chunks[index] ?? '';
      const embedding = await provider.getEmbeddings(chunk);

      await insertChunkSafe({
        docId: doc.id,
        sourceTitle: doc.title,
        sourceUrl: doc.sourceRef,
        sourceType: doc.type,
        content: chunk,
        embedding,
        chunkIndex: index,
        batchId,
      });

      total += 1;
    }
  }

  // Phase 2: Atomically delete old chunks (those NOT from this batch)
  // Only runs if Phase 1 completed fully — crash-safe
  const deleted = await prisma.$executeRaw(
    Prisma.sql`DELETE FROM "Chunk" WHERE "hash" IS NULL OR "hash" != ${batchId}`
  );

  logger.info({ batchId, indexed: total, deletedOld: deleted }, 'rag.indexer.complete');
  return { indexed: total, skipped: false };
}

/**
 * Indexe un texte du descriptif de lecture d'un élève dans le RAG.
 * Appelée après la saisie ou le dépôt d'un texte avec contenu par l'élève.
 * Non-bloquante : à appeler sans await depuis les routes d'upload.
 */
export async function indexerTexteDescriptif(params: {
  texteDescriptifId: string;
  studentId: string;
  contenu: string;
  metadata: {
    titre: string;
    auteur: string;
    typeTexte: string;
    oeuvreNom?: string | null;
  };
}): Promise<{ indexed: number; chunks: number }> {
  const { texteDescriptifId, studentId, contenu, metadata } = params;

  if (!contenu || contenu.trim().length < 50) {
    return { indexed: 0, chunks: 0 };
  }

  if (!(await isDatabaseAvailable())) {
    return { indexed: 0, chunks: 0 };
  }

  const provider = getLLMProvider();
  const chunkSize = Number.parseInt(process.env.RAG_CHUNK_SIZE ?? '500', 10);
  const safeChunkSize = Number.isFinite(chunkSize) ? Math.max(100, chunkSize) : 500;

  // Supprimer les anciens chunks de ce texte avant de réindexer
  await prisma.$executeRaw(
    Prisma.sql`DELETE FROM "Chunk" WHERE "docId" = ${texteDescriptifId} AND "sourceType" = 'descriptif_eleve'`
  );

  const chunks = splitIntoChunksByParagraphs(contenu, safeChunkSize);
  if (chunks.length === 0) return { indexed: 0, chunks: 0 };

  let indexed = 0;
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i] ?? '';
    try {
      const embedding = await provider.getEmbeddings(chunk);
      validateEmbeddingDimension(embedding, `${texteDescriptifId}#${i}`);
      const vector = toVectorLiteral(embedding);
      // sourceUrl encode le studentId pour permettre le filtrage par élève
      const sourceUrl = `descriptif-eleve:${studentId}:${texteDescriptifId}`;
      // hash unique par chunk pour éviter les doublons
      const chunkHash = `descriptif_${texteDescriptifId}_c${i}`;
      await prisma.$executeRaw(
        Prisma.sql`INSERT INTO "Chunk" ("id", "docId", "sourceTitle", "sourceUrl", "sourceType", "content", "embedding", "chunkIndex", "hash", "createdAt")
         VALUES (${randomUUID()}, ${texteDescriptifId}, ${metadata.titre}, ${sourceUrl}, ${'descriptif_eleve'}, ${chunk}, ${vector}::vector, ${i}, ${chunkHash}, NOW())
         ON CONFLICT ("hash") DO UPDATE SET "content" = EXCLUDED."content", "embedding" = EXCLUDED."embedding"`
      );
      indexed++;
    } catch (err) {
      logger.warn({ texteDescriptifId, chunkIndex: i, err }, 'rag.indexer.descriptif.chunk_error');
    }
  }

  logger.info({ texteDescriptifId, studentId, indexed, total: chunks.length }, 'rag.indexer.descriptif.complete');
  return { indexed, chunks: chunks.length };
}

/**
 * Supprime les chunks d'un texte du descriptif du RAG.
 * Appelée quand l'élève supprime un texte de son descriptif.
 */
export async function supprimerTexteDescriptifRAG(texteDescriptifId: string): Promise<void> {
  if (!(await isDatabaseAvailable())) return;
  try {
    await prisma.$executeRaw(
      Prisma.sql`DELETE FROM "Chunk" WHERE "docId" = ${texteDescriptifId} AND "sourceType" = 'descriptif_eleve'`
    );
    logger.info({ texteDescriptifId }, 'rag.indexer.descriptif.deleted');
  } catch (err) {
    logger.warn({ texteDescriptifId, err }, 'rag.indexer.descriptif.delete_error');
  }
}
