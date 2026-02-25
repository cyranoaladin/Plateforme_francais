import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  oeuvre: z.string(),
  extrait: z.string(),
  questionGrammaire: z.string(),
  parcours: z.string(),
  consignes: z.string(),
  citations: z.array(citationSchema).max(3).optional(),
});

export type OralTirageOutput = z.infer<typeof schema>;

export const oralTirageSkill: SkillConfig<OralTirageOutput> = {
  prompt: 'Skill oral_tirage: tirer un extrait officiel avec question de grammaire pour simulation orale EAF. Ne jamais fournir d\'explication complète.',
  outputSchema: schema,
  fallback: {
    oeuvre: 'Programme EAF',
    extrait: 'Aucun extrait disponible.',
    questionGrammaire: 'Analysez la syntaxe de la phrase principale.',
    parcours: 'Parcours transversal',
    consignes: 'Préparez une explication linéaire en 30 minutes.',
  },
};
