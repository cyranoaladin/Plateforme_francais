import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  corrections: z.array(z.object({
    extrait: z.string(),
    erreur: z.string(),
    correction: z.string(),
    regle: z.string(),
  })),
  score_langue: z.number(),
  max: z.number(),
  bilan: z.string(),
  citations: z.array(citationSchema).max(3).optional(),
});

export type EcritLangueOutput = z.infer<typeof schema>;

export const ecritLangueSkill: SkillConfig<EcritLangueOutput> = {
  prompt: 'Skill ecrit_langue: corriger les erreurs de langue dans un texte d\'élève EAF. Identifier chaque erreur avec sa règle. Ne jamais réécrire le texte entier.',
  outputSchema: schema,
  fallback: {
    corrections: [],
    score_langue: 0,
    max: 4,
    bilan: 'Aucune correction disponible.',
  },
};
