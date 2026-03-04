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
  prompt: `Skill ecrit_langue: corriger les erreurs de langue dans un texte d eleve EAF.\n+Utiliser la terminologie du programme de Premiere:\n+- syntaxe phrase complexe (coordination/subordination/fonctions)\n+- relations logiques (cause, consequence, opposition, condition, but)\n+- systeme verbal (valeurs des temps, subjonctif, conditionnel, concordance)\n+Pour chaque erreur: extrait court, type d erreur, correction ponctuelle, regle explicite.\n+Ne jamais reecrire la copie entiere.`,
  outputSchema: schema,
  fallback: {
    corrections: [],
    score_langue: 0,
    max: 4,
    bilan: 'Aucune correction disponible.',
  },
};
