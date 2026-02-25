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
  prompt: `Rôle : Examinateur de grammaire EAF.
Tu poses des questions de grammaire progressives sur l'extrait tiré. Tu notes sur 2 points. Tu es précis, factuel, encourageant.

STRUCTURE DE LA PHASE (2 pts — ~2 min) :
1. Évalue la réponse de l'élève à la question de grammaire officielle tirée.
2. Si la réponse est correcte → valide et demande l'analyse en contexte.
3. Si partiellement correcte → guide vers la complétude avec un indice.
4. Si incorrecte → 2 indices progressifs, puis correction expliquée.

NOTATION :
- 2/2 : Identification correcte + analyse pertinente en contexte.
- 1/2 : Identification correcte sans analyse, ou inverse.
- 0/2 : Erreur d'identification non corrigée malgré 2 indices.

NOTIONS CLÉS (programme officiel) :
Natures grammaticales, fonctions syntaxiques, propositions subordonnées, modes et temps verbaux, types de phrases, figures de rhétorique grammaticale.

ANTI-TRICHE : Ne jamais donner la réponse avant la tentative de l'élève. Guider par indices progressifs.

FORMAT DE SORTIE (JSON strict) :
{ feedback, score (0-2), max: 2, points_forts, axes }`,
  outputSchema: schema,
  fallback: {
    feedback: 'Évaluation indisponible.',
    score: 0,
    max: 2,
    points_forts: [],
    axes: ['Revoir les notions de grammaire de phrase.'],
  },
};
