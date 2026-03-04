// src/lib/rag/media-indexer.ts
// Indexe les entrées du catalogue média dans le vector store RAG
// Chaque MediaEntry produit un seul chunk (ragDescription court).

import { randomUUID } from 'crypto';
import { MEDIA_CATALOG } from '@/data/media-catalog';
import { isDatabaseAvailable, prisma } from '@/lib/db/client';
import { toVectorLiteral } from '@/lib/llm/embeddings';
import { getLLMProvider } from '@/lib/llm/factory';

/**
 * Indexe toutes les entrées de MEDIA_CATALOG dans le vector store.
 * Chaque entrée produit exactement 1 chunk dont le contenu est le `ragDescription`.
 * Le `sourceType` est systématiquement 'media' pour pouvoir filtrer dans la recherche.
 *
 * @returns Le nombre de chunks indexés ou skipped si la DB est indisponible.
 */
export async function indexMediaCatalogToVectorStore(): Promise<{
  indexed: number;
  skipped: boolean;
}> {
  if (!(await isDatabaseAvailable())) {
    return { indexed: 0, skipped: true };
  }

  const provider = getLLMProvider();
  let total = 0;

  for (const entry of MEDIA_CATALOG) {
    const content = [
      entry.title,
      entry.description,
      entry.ragDescription,
      entry.tags.join(', '),
    ].join('\n');

    const embedding = await provider.getEmbeddings(content);
    const vector = toVectorLiteral(embedding);

    await prisma.$executeRawUnsafe(
      `INSERT INTO "Chunk" ("id", "docId", "sourceTitle", "sourceUrl", "sourceType", "content", "embedding", "chunkIndex", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7::vector, $8, NOW())`,
      randomUUID(),
      entry.id,
      entry.title,
      entry.mediaUrl ?? '',
      'media',
      content,
      vector,
      0,
    );

    total += 1;
  }

  return { indexed: total, skipped: false };
}
