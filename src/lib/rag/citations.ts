import { z } from 'zod';
import type { RagSearchResult } from '@/lib/rag/search';

/**
 * Standard citation format used by all agents.
 * RÈGLE : jamais d'URL exposée au LLM — source_interne uniquement.
 * snippet ≤ 240 characters.
 */
export const citationSchema = z.object({
  title: z.string(),
  source_interne: z.string(), // ex: "Rapport jury EAF 2023 p.14", "BO 2025 annexe 3"
  snippet: z.string().max(240),
});

export type Citation = z.infer<typeof citationSchema>;

/**
 * Convert RAG search results into standard citations.
 * sourceRef → source_interne (never expose URL to LLM).
 */
export function toCitations(results: RagSearchResult[], maxCitations = 3): Citation[] {
  return results.slice(0, maxCitations).map((r) => ({
    title: r.title,
    source_interne: r.sourceRef ?? `${r.type} — ${r.title}`,
    snippet: r.excerpt.length > 240 ? r.excerpt.slice(0, 237) + '...' : r.excerpt,
  }));
}
