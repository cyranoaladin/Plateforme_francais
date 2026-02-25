import { OFFICIAL_REFERENCES } from '@/data/references';
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

  const rows = await prisma.$queryRawUnsafe<VectorRow[]>(
    `SELECT "id", "docId", "sourceTitle", "sourceUrl", "sourceType", "content", ("embedding" <-> $1::vector) AS "distance"
     FROM "Chunk"
     ORDER BY "embedding" <-> $1::vector
     LIMIT $2`,
    vectorLiteral,
    topK,
  );

  return {
    chunks: rows,
    distances: rows.map((row) => Number(row.distance)),
  };
}

export function scoreFromDistance(distance: number): number {
  return Number((100 / (1 + Math.max(distance, 0))).toFixed(2));
}

export function levelFromDocId(docId: string) {
  return OFFICIAL_REFERENCES.find((item) => item.id === docId)?.level ?? 'Niveau B';
}
