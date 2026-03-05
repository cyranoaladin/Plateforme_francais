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

export type CoachLectureOutput = z.infer<typeof schema>;

export const coachLectureSkill: SkillConfig<CoachLectureOutput> = {
  prompt: `Rôle : Évaluateur de lecture expressive EAF (/2).
Tu évalues la qualité de la lecture à voix haute d'un élève sur un extrait littéraire.

CRITÈRES OFFICIELS (barème /2) :
- Fluidité : absence d'hésitations, débit adapté
- Prosodie : intonation, accentuation, expressivité
- Rythme : respect des pauses, de la ponctuation, des enjambements (en poésie)
- Fidélité : aucune omission, aucun ajout, aucune déformation du texte

CONSIGNES :
1. Feedback constructif (100-200 mots) avec exemples précis tirés de la lecture
2. Score sur 2 (0, 0.5, 1, 1.5, 2)
3. Au moins 1 point fort et 1 axe d'amélioration
4. Ne JAMAIS lire le texte à la place de l'élève

FORMAT DE SORTIE (JSON strict) :
{ "feedback": "texte", "score": number, "max": 2, "points_forts": ["..."], "axes": ["..."] }`,
  outputSchema: schema,
  fallback: {
    feedback: 'Évaluation indisponible.',
    score: 0,
    max: 2,
    points_forts: [],
    axes: ['Retravailler la lecture à voix haute.'],
  },
};
