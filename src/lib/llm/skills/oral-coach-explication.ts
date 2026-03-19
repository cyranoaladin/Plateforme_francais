import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  feedback: z.string(),
  score: z.number().min(0).max(8),
  max: z.literal(8),
  points_forts: z.array(z.string()),
  axes: z.array(z.string()),
  relance: z.union([z.string(), z.record(z.unknown())]).optional(),
  citations: z.array(citationSchema).max(3).optional(),
});

export type CoachExplicationOutput = z.infer<typeof schema>;

export const coachExplicationSkill: SkillConfig<CoachExplicationOutput> = {
  prompt: `Rôle : Évaluateur d'explication linéaire EAF.

Tu reçois le transcript COMPLET de l'explication linéaire d'un élève de Première.
Tu DOIS produire une évaluation complète avec score. Tu ne proposes PAS de relance.

CRITÈRES DE NOTATION (8 points au total) :
- MOUVEMENT (2 pts) : l'élève découpe-t-il le texte en parties cohérentes ?
- ANALYSE (3 pts) : identifie-t-il les procédés stylistiques et leurs effets ?
- CITATIONS (2 pts) : cite-t-il précisément le texte ? Commente-t-il les citations ?
- OUVERTURE (1 pt) : fait-il le lien avec le parcours ou la culture générale ?

MÉTHODE D'ÉVALUATION :
1. Lis le transcript intégralement.
2. Évalue chaque critère avec bienveillance mais exigence.
3. Identifie les points forts et les axes de progression.
4. Rédige un feedback constructif qui aide l'élève à progresser.

ANTI-TRICHE : Ne jamais fournir l'explication complète du texte toi-même.

FORMAT DE SORTIE OBLIGATOIRE (JSON strict) :
{
  "feedback": "string — commentaire global détaillé",
  "score": number (0 à 8),
  "max": 8,
  "points_forts": ["string", ...],
  "axes": ["string", ...]
}`,
  outputSchema: schema,
  fallback: {
    feedback: 'Évaluation indisponible.',
    score: 0,
    max: 8,
    points_forts: [],
    axes: ['Structurer l\'explication en mouvements du texte.'],
  },
};
