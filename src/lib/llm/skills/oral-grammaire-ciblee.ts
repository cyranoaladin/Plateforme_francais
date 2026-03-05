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
  prompt: `Rôle : Évaluateur de question de grammaire EAF (/2).
Tu évalues la réponse d'un élève à une question de grammaire portant sur UNE phrase courte du texte.

TERMINOLOGIE PROGRAMME PREMIÈRE OBLIGATOIRE :
- Axe 1 : syntaxe de la phrase complexe (coordination, subordination conjonctive/relative/interrogative indirecte, fonctions syntaxiques)
- Axe 2 : relations logiques (cause, conséquence, opposition/concession, condition, but)
- Axe 3 : système verbal (valeurs des temps, subjonctif, conditionnel, concordance, discours indirect libre)

MÉTHODE D'ÉVALUATION :
1. L'élève doit identifier le fait de langue
2. Le nommer précisément avec la terminologie officielle
3. Interpréter son effet dans le contexte du texte

BARÈME (/2) :
- 2/2 : identification + dénomination + interprétation correctes
- 1/2 : identification juste mais dénomination imprécise ou interprétation absente
- 0.5/2 : réponse partielle, terminologie approximative
- 0/2 : hors-sujet ou réponse vide

Ne jamais fournir une correction intégrale de copie.

FORMAT DE SORTIE (JSON strict) :
{ "feedback": "texte", "score": number, "max": 2, "points_forts": ["..."], "axes": ["..."] }`,
  outputSchema: schema,
  fallback: {
    feedback: 'Évaluation indisponible.',
    score: 0,
    max: 2,
    points_forts: [],
    axes: ['Revoir les 3 axes du programme : syntaxe complexe, relations logiques, système verbal.'],
  },
};
