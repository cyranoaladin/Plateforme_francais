import { OFFICIAL_REFERENCES } from '@/data/references';
import { randomUUID } from 'crypto';
import { isDatabaseAvailable, prisma } from '@/lib/db/client';
import { toVectorLiteral } from '@/lib/llm/embeddings';
import { getLLMProvider } from '@/lib/llm/factory';

type ChunkInsert = {
  docId: string;
  sourceTitle: string;
  sourceUrl: string;
  sourceType: string;
  content: string;
  embedding: number[];
  chunkIndex: number;
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

async function insertChunk(input: ChunkInsert): Promise<void> {
  const vector = toVectorLiteral(input.embedding);
  await prisma.$executeRawUnsafe(
    `INSERT INTO "Chunk" ("id", "docId", "sourceTitle", "sourceUrl", "sourceType", "content", "embedding", "chunkIndex", "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7::vector, $8, NOW())`,
    randomUUID(),
    input.docId,
    input.sourceTitle,
    input.sourceUrl,
    input.sourceType,
    input.content,
    vector,
    input.chunkIndex,
  );
}

export async function indexReferencesToVectorStore(): Promise<{ indexed: number; skipped: boolean }> {
  if (!(await isDatabaseAvailable())) {
    return { indexed: 0, skipped: true };
  }

  const provider = getLLMProvider();
  const chunkSize = Number.parseInt(process.env.RAG_CHUNK_SIZE ?? '500', 10);
  const safeChunkSize = Number.isFinite(chunkSize) ? Math.max(100, chunkSize) : 500;

  await prisma.chunk.deleteMany();

  let total = 0;

  for (const doc of OFFICIAL_REFERENCES) {
    const chunks = splitIntoChunksByParagraphs(doc.content, safeChunkSize);

    for (let index = 0; index < chunks.length; index += 1) {
      const chunk = chunks[index] ?? '';
      const embedding = await provider.getEmbeddings(chunk);

      await insertChunk({
        docId: doc.id,
        sourceTitle: doc.title,
        sourceUrl: doc.url,
        sourceType: doc.type,
        content: chunk,
        embedding,
        chunkIndex: index,
      });

      total += 1;
    }
  }

  return { indexed: total, skipped: false };
}
