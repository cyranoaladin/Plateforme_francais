import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  feedback: z.string(),
  score: z.number(),
  max: z.number(),
  erreurs_frequentes: z.array(z.string()),
  conseils: z.array(z.string()),
  citations: z.array(citationSchema).max(3).optional(),
});

export type EcritContractionOutput = z.infer<typeof schema>;

export const ecritContractionSkill: SkillConfig<EcritContractionOutput> = {
  prompt: 'Skill ecrit_contraction: évaluer une contraction de texte EAF. Vérifier respect du nombre de mots, fidélité au texte source, reformulation. Ne jamais contracter à la place de l\'élève.',
  outputSchema: schema,
  fallback: {
    feedback: 'Évaluation indisponible.',
    score: 0,
    max: 10,
    erreurs_frequentes: [],
    conseils: ['Soumettez votre contraction pour un feedback détaillé.'],
  },
};
