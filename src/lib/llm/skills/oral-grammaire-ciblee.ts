import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  feedback: z.string(),
  score: z.number().min(0).max(2),
  max: z.literal(2),
  points_forts: z.array(z.string()),
  axes: z.array(z.string()),
  citations: z.array(citationSchema).max(3).optional(),
});

export type GrammaireCibleeOutput = z.infer<typeof schema>;

export const grammaireCibleeSkill: SkillConfig<GrammaireCibleeOutput> = {
  prompt: 'Skill grammaire_ciblee: évaluer la réponse de grammaire EAF (/2). Critères: identification correcte, analyse pertinente, terminologie précise. Ne jamais donner la réponse complète.',
  outputSchema: schema,
  fallback: {
    feedback: 'Évaluation indisponible.',
    score: 0,
    max: 2,
    points_forts: [],
    axes: ['Revoir les notions de grammaire de phrase.'],
  },
};
