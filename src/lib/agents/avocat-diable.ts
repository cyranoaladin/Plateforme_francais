import { z } from 'zod';
import { getRouterProvider } from '@/lib/llm/factory';
import { logger } from '@/lib/logger';
import { searchOfficialReferences } from '@/lib/rag/search';
import { estimateTokens } from '@/lib/llm/token-estimate';
import type { ProviderChatMessage } from '@/lib/llm/provider';
import { mcpClient } from '@/lib/mcp';

const AvocatDiableSchema = z.object({
  objections: z
    .array(
      z.object({
        point: z.string().min(1),
        contreArgument: z.string().min(1),
        source: z.string().optional(),
      }),
    )
    .max(3),
  suggestions: z
    .array(
      z.object({
        axe: z.string().min(1),
        renforcement: z.string().min(1),
      }),
    )
    .max(3),
  verdict: z.enum(['solide', 'à_renforcer', 'fragile']),
  score: z.number().min(0).max(100),
});

export type AvocatDiableResult = z.infer<typeof AvocatDiableSchema> & {
  citations: Array<{ title: string; source: string }>;
};

type AnalyzeInput = {
  userId: string;
  these: string;
  plan: string;
  mode?: 'entrainement' | 'examen';
};

function extractJson(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith('{')) {
    return trimmed;
  }
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }
  return '{}';
}

const SYSTEM_PROMPT = `Tu es l'agent "Avocat du Diable" EAF.
Mode strict: entraînement uniquement.
Tu analyses la solidité argumentative d'une thèse d'élève.
Contraintes:
1) Jamais de copie complète.
2) Tu donnes maximum 3 objections et 3 suggestions.
3) Tu cites les sources fournies quand utile (R-CITE-01).
4) Aucune inférence émotionnelle (R-AIACT-01).
Sortie JSON stricte:
{
  "objections": [{"point":"...","contreArgument":"...","source":"..."}],
  "suggestions": [{"axe":"...","renforcement":"..."}],
  "verdict": "solide|à_renforcer|fragile",
  "score": 0
}`;

export async function analyzeAvocatDiable(input: AnalyzeInput): Promise<AvocatDiableResult> {
  if (input.mode === 'examen') {
    return {
      objections: [
        {
          point: 'Mode examen détecté',
          contreArgument: "L'agent avocat du diable est disponible uniquement en entraînement.",
        },
      ],
      suggestions: [
        {
          axe: 'Basculer en entraînement',
          renforcement: 'Reviens en mode entraînement pour obtenir une critique argumentative.',
        },
      ],
      verdict: 'à_renforcer',
      score: 0,
      citations: [],
    };
  }

  const fallbackRefs = await searchOfficialReferences(`${input.these}\n${input.plan}`, 3);
  let refs = fallbackRefs;
  try {
    const mcpResult = await mcpClient.rag.search(
      `${input.these}\n${input.plan}`,
      { topK: 8, rerank: true, filters: { authorityLevel: 'A' } },
      'avocat-diable',
    ) as { hits?: Array<{ title?: string; sourceUrl?: string; excerpt?: string; docType?: string }> };
    if (Array.isArray(mcpResult.hits) && mcpResult.hits.length > 0) {
      refs = mcpResult.hits.slice(0, 3).map((hit, index) => ({
        id: `mcp-${index + 1}`,
        title: hit.title ?? `Source ${index + 1}`,
        sourceRef: hit.sourceUrl ?? '',
        excerpt: hit.excerpt ?? '',
        type: (hit.docType as (typeof refs)[number]['type']) ?? 'texte_officiel',
        level: 'Niveau A',
        score: 1,
      }));
    }
  } catch {
    // fallback refs already loaded from local RAG
  }
  const ragContext = refs
    .map((ref, index) => `[${index + 1}] ${ref.title} (${ref.sourceRef})\n${ref.excerpt}`)
    .join('\n\n');

  const prompt = [
    SYSTEM_PROMPT,
    `Thèse élève: ${input.these}`,
    `Plan élève:\n${input.plan}`,
    `Sources:\n${ragContext || 'Aucune source retrouvée.'}`,
  ].join('\n\n');
  const messages: ProviderChatMessage[] = [{ role: 'user', content: prompt }];

  try {
    const provider = getRouterProvider('avocat_diable', estimateTokens(messages));
    const completion = await provider.generateContent(messages, {
      temperature: 0.2,
      responseMimeType: 'application/json',
      maxTokens: 1000,
    });

    const parsed = AvocatDiableSchema.parse(JSON.parse(extractJson(completion.text)));
    return {
      ...parsed,
      citations: refs.map((ref) => ({ title: ref.title, source: ref.type })),
    };
  } catch (error) {
    logger.warn({ error, userId: input.userId, route: 'avocat_diable' }, 'avocat_diable.fallback');
    return {
      objections: [
        {
          point: 'Problématisation encore fragile',
          contreArgument: 'La thèse doit être davantage nuancée et explicitement reliée au texte.',
          source: refs[0]?.title,
        },
      ],
      suggestions: [
        {
          axe: 'Renforcer les exemples',
          renforcement: 'Ajoute un exemple littéraire précis par partie pour solidifier la démonstration.',
        },
      ],
      verdict: 'à_renforcer',
      score: 58,
      citations: refs.map((ref) => ({ title: ref.title, source: ref.type })),
    };
  }
}
