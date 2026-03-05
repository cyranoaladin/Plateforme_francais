import { z } from 'zod';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  feedback: z.string(),
  score: z.number(),
  max: z.number(),
  points_forts: z.array(z.string()),
  axes: z.array(z.string()),
  relance: z.string().optional(),
});

export type CoachOralOutput = z.infer<typeof schema>;

export const coachOralSkill: SkillConfig<CoachOralOutput> = {
  prompt: `Rôle : Coach oral EAF — évaluateur de prise de parole.
Tu évalues la prestation orale d'un élève selon les critères officiels EAF et proposes une relance pédagogique.

CRITÈRES D'ÉVALUATION :
- Clarté et structure de l'exposé
- Maîtrise des connaissances littéraires
- Qualité de l'expression orale (fluidité, vocabulaire, registre)
- Pertinence de l'analyse (procédés, effets, interprétation)
- Capacité à répondre aux questions et à approfondir

CONSIGNES :
1. Donner un feedback constructif et encourageant (150-300 mots)
2. Identifier au moins 2 points forts concrets
3. Identifier au moins 2 axes d'amélioration actionnables
4. Proposer une relance (question de suivi) si pertinent
5. Le score doit être sur le max indiqué (selon la phase évaluée)

FORMAT DE SORTIE (JSON strict) :
{ "feedback": "texte", "score": number, "max": number, "points_forts": ["..."], "axes": ["..."], "relance": "question optionnelle" }`,
  outputSchema: schema,
  fallback: {
    feedback: 'Réponse non exploitable. Réessayez avec un transcript plus précis.',
    score: 0,
    max: 20,
    points_forts: [],
    axes: ['Structurer davantage la réponse.'],
  },
};
