/**
 * RAG Chunker V2 — Per cahier des charges V2 P0-4.
 *
 * Splits text into chunks of 400-600 tokens with 80-token overlap.
 * Token estimation: ~4 chars per token (conservative for French).
 */

const DEFAULT_CHUNK_SIZE = parseInt(process.env.RAG_CHUNK_SIZE ?? '500', 10);
const DEFAULT_OVERLAP = parseInt(process.env.RAG_CHUNK_OVERLAP ?? '80', 10);
const CHARS_PER_TOKEN = 4;

export interface ChunkMetadata {
  source: string;
  url_officielle: string;
  annee?: string;
  oeuvre?: string;
  parcours?: string;
  objet_etude?: string;
  voie?: string;
  niveau?: string;
  type_doc?: string;
}

export interface TextChunk {
  content: string;
  index: number;
  metadata: ChunkMetadata;
  estimatedTokens: number;
}

/**
 * Estimate token count from text (conservative ~4 chars/token for French).
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Split text into overlapping chunks of approximately `chunkSizeTokens` tokens.
 */
export function chunkText(
  text: string,
  metadata: ChunkMetadata,
  chunkSizeTokens: number = DEFAULT_CHUNK_SIZE,
  overlapTokens: number = DEFAULT_OVERLAP,
): TextChunk[] {
  if (!text || text.trim().length === 0) return [];

  const chunkSizeChars = chunkSizeTokens * CHARS_PER_TOKEN;
  const overlapChars = overlapTokens * CHARS_PER_TOKEN;
  const stepChars = Math.max(chunkSizeChars - overlapChars, 100);

  const chunks: TextChunk[] = [];
  let offset = 0;
  let index = 0;

  while (offset < text.length) {
    let end = Math.min(offset + chunkSizeChars, text.length);

    // Try to break at sentence boundary
    if (end < text.length) {
      const candidate = text.lastIndexOf('. ', end);
      if (candidate > offset + stepChars * 0.5) {
        end = candidate + 1;
      }
    }

    const content = text.slice(offset, end).trim();
    if (content.length > 0) {
      chunks.push({
        content,
        index,
        metadata,
        estimatedTokens: estimateTokens(content),
      });
      index++;
    }

    offset += stepChars;
  }

  return chunks;
}
