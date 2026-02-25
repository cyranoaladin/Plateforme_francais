import { z } from 'zod';
import type { RagSearchResult } from '@/lib/rag/search';

/**
 * Standard citation format used by all agents.
 * snippet ≤ 240 characters.
 */
export const citationSchema = z.object({
  title: z.string(),
  url: z.string(),
  snippet: z.string().max(240),
});

export type Citation = z.infer<typeof citationSchema>;

/**
 * Convert RAG search results into standard citations.
 * Limits to maxCitations entries.
 */
export function toCitations(results: RagSearchResult[], maxCitations = 3): Citation[] {
  return results.slice(0, maxCitations).map((r) => ({
    title: r.title,
    url: r.url,
    snippet: r.excerpt.length > 240 ? r.excerpt.slice(0, 237) + '...' : r.excerpt,
  }));
}
