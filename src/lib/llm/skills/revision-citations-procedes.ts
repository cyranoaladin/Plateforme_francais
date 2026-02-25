import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  citations_annotees: z.array(z.object({
    citation: z.string(),
    procede: z.string(),
    effet: z.string(),
    contexte: z.string(),
  })).min(1).max(10),
  citations: z.array(citationSchema).max(3).optional(),
});

export type CitationsProcedesOutput = z.infer<typeof schema>;

export const citationsProcedesSkill: SkillConfig<CitationsProcedesOutput> = {
  prompt: 'Skill citations_procedes: générer une banque de 5-10 citations annotées pour une oeuvre EAF, avec procédé stylistique, effet produit et contexte. Ne jamais fournir d\'analyse complète.',
  outputSchema: schema,
  fallback: {
    citations_annotees: [{ citation: 'Citation non disponible.', procede: '-', effet: '-', contexte: '-' }],
  },
};
