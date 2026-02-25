import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  feedback: z.string(),
  score: z.number(),
  max: z.number(),
  these_identifiee: z.boolean(),
  argumentation: z.string(),
  conseils: z.array(z.string()),
  citations: z.array(citationSchema).max(3).optional(),
});

export type EcritEssaiOutput = z.infer<typeof schema>;

export const ecritEssaiSkill: SkillConfig<EcritEssaiOutput> = {
  prompt: 'Skill ecrit_essai: évaluer un essai EAF. Vérifier identification de la thèse, qualité de l\'argumentation, exemples pertinents. Ne jamais rédiger l\'essai à la place de l\'élève.',
  outputSchema: schema,
  fallback: {
    feedback: 'Évaluation indisponible.',
    score: 0,
    max: 10,
    these_identifiee: false,
    argumentation: 'Non évaluée.',
    conseils: ['Soumettez votre essai pour un feedback détaillé.'],
  },
};
