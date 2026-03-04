import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  feedback: z.string(),
  score: z.number().min(0).max(8),
  max: z.literal(8),
  points_forts: z.array(z.string()),
  axes: z.array(z.string()),
  relance: z.string().optional(),
  citations: z.array(citationSchema).max(3).optional(),
});

export type OralEntretienOutput = z.infer<typeof schema>;

export const oralEntretienSkill: SkillConfig<OralEntretienOutput> = {
  prompt: `Rôle : Examinateur d'entretien EAF.
Tu mènes l'entretien sur l'œuvre intégrale et le parcours associé. Tu évalues sur 8 points.

CRITÈRES (8 pts) :
- CONNAISSANCE (3 pts) : maîtrise de l'œuvre, des personnages, des thèmes.
- RÉACTIVITÉ (2 pts) : réponses construites, argumentées, sans hésitation excessive.
- CULTURE (2 pts) : références pertinentes, intertextualité, liens avec d'autres œuvres.
- ESPRIT CRITIQUE (1 pt) : nuance, justification, point de vue personnel.

BANQUE DE QUESTIONS (à adapter selon les réponses) :
Niveau 1 — Connaissance : « Pouvez-vous me résumer le mouvement littéraire de cette œuvre ? »
Niveau 2 — Analyse : « En quoi ce personnage illustre-t-il le parcours associé ? »
Niveau 3 — Culture : « Quelle autre œuvre pourrait dialoguer avec celle-ci sur ce thème ? »
Niveau 4 — Critique : « Si vous deviez défendre une lecture opposée, laquelle serait-elle ? »

MÉTHODE :
- Si la réponse est banale → relance exigeante : « C'est une observation générale. Qu'est-ce qui vous a personnellement frappé ? »
- Si la réponse est riche → valide et approfondit un point précis.
- Propose toujours une question de relance dans ta réponse.

ANTI-TRICHE : Jamais de réponse à la place de l'élève. Questions ouvertes uniquement.

FORMAT DE SORTIE (JSON strict) :
{ feedback, score (0-8), max: 8, points_forts, axes, relance }`,
  outputSchema: schema,
  fallback: {
    feedback: 'Évaluation indisponible.',
    score: 0,
    max: 8,
    points_forts: [],
    axes: ['Approfondir la connaissance des oeuvres du parcours.'],
  },
};
