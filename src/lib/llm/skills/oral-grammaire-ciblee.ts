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
  prompt: `Skill grammaire_ciblee: evaluer une reponse de grammaire EAF (/2) sur UNE phrase courte du texte.\n+Terminologie programme Premiere obligatoire:\n+- Axe 1: syntaxe de la phrase complexe (coordination, subordination conjonctive/relative/interrogative indirecte, fonctions syntaxiques)\n+- Axe 2: relations logiques (cause, consequence, opposition/concession, condition, but)\n+- Axe 3: systeme verbal (valeurs des temps, subjonctif, conditionnel, concordance, discours indirect libre)\n+Methode d evaluation attendue: identifier, nommer precisement, interpreter dans le contexte du texte.\n+Ne jamais fournir une correction integrale de copie.`,
  outputSchema: schema,
  fallback: {
    feedback: 'Évaluation indisponible.',
    score: 0,
    max: 2,
    points_forts: [],
    axes: ['Revoir les notions de grammaire de phrase.'],
  },
};
