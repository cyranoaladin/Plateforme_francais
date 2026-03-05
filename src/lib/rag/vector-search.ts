import { Prisma } from '@prisma/client';
import { isDatabaseAvailable, prisma } from '@/lib/db/client';
import { getLLMProvider } from '@/lib/llm/factory';
import { toVectorLiteral } from '@/lib/llm/embeddings';

type VectorRow = {
  id: string;
  docId: string;
  sourceTitle: string;
  sourceUrl: string;
  sourceType: string;
  content: string;
  distance: number;
  level?: string;
  oeuvre?: string;
  parcours?: string;
};

export type VectorSearchResult = {
  chunks: VectorRow[];
  distances: number[];
};

export async function vectorSearch(query: string, topK: number): Promise<VectorSearchResult> {
  if (!(await isDatabaseAvailable())) {
    throw new Error('Database unavailable for vector search.');
  }

  const provider = getLLMProvider();
  const embedding = await provider.getEmbeddings(query);
  const vectorLiteral = toVectorLiteral(embedding);

  const rows = await prisma.$queryRaw<VectorRow[]>(
    Prisma.sql`
      SELECT "id", "docId", "sourceTitle", "sourceUrl", "sourceType", "content", 
             ("embedding" <-> ${vectorLiteral}::vector) AS "distance"
      FROM "Chunk"
      ORDER BY "embedding" <-> ${vectorLiteral}::vector
      LIMIT ${topK}
    `
  );

  return {
    chunks: rows,
    distances: rows.map((row: VectorRow) => Number(row.distance)),
  };
}

export function scoreFromDistance(distance: number): number {
  return Number((100 / (1 + Math.max(distance, 0))).toFixed(2));
}

/**
 * @deprecated Use metadata directly from the database Chunk entry.
 */
export function levelFromDocId() {
  return 'Première'; // Default for EAF
}
