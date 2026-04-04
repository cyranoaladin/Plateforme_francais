import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';
import { BAREMES, type ExerciceEcrit } from '@/data/baremes-officiels';

const schema = z.object({
  exercice: z.enum(['commentaire', 'dissertation']),
  evaluation: z.array(z.object({
    critereId: z.string(),
    niveau: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
    note: z.number(),
    justification: z.string(),
    points_forts: z.array(z.string()),
    axes_amelioration: z.array(z.string()),
  })),
  total: z.number(),
  bilan: z.string(),
  priorites: z.array(z.string()),
  citations: z.array(citationSchema).max(3).optional(),
});

export type EcritBaremageOutput = z.infer<typeof schema>;

export function buildCorrecteurPrompt(exercice: ExerciceEcrit): string {
  const bareme = BAREMES[exercice];

  const criteresTexte = bareme.criteres
    .map((critere) => {
      const niveaux = critere.niveaux
        .map((niveau) => `  N${niveau.level} (${niveau.points} pt${niveau.points > 1 ? 's' : ''}) : ${niveau.description}`)
        .join('\n');
      return `CRITÈRE : ${critere.label} (${critere.points} points)\n${niveaux}`;
    })
    .join('\n\n');

  return `
Tu es un correcteur officiel de l'EAF.
Tu corriges un devoir de type : ${exercice === 'commentaire' ? 'COMMENTAIRE LITTÉRAIRE (série générale)' : 'DISSERTATION LITTÉRAIRE'}.

BARÈME OFFICIEL :
Total : ${bareme.total} points
${criteresTexte}

RÈGLE ABSOLUE :
Ne jamais évaluer séparément l'introduction et la conclusion.
Ce qui est évalué dans la construction de la réflexion inclut l'introduction et la conclusion comme parties intégrées à l'organisation du propos.

Pour chaque critère :
1. Attribue un niveau (N1 à N4)
2. Justifie avec un passage précis du devoir
3. Donne la note correspondante

ANTI-TRICHE :
Tu ne rédiges jamais de corrigé intégral. Tu ne complètes jamais la copie.

Format JSON uniquement :
{
  "exercice": "${exercice}",
  "evaluation": [
    {
      "critereId": "...",
      "niveau": 1,
      "note": 0,
      "justification": "Citation du devoir + explication",
      "points_forts": ["..."],
      "axes_amelioration": ["..."]
    }
  ],
  "total": 0,
  "bilan": "Appréciation globale",
  "priorites": ["..."]
}`;
}

export const ecritBaremageSkill: SkillConfig<EcritBaremageOutput> = {
  prompt: buildCorrecteurPrompt('commentaire'),
  outputSchema: schema,
  fallback: {
    exercice: 'commentaire',
    evaluation: [],
    total: 0,
    bilan: 'Évaluation indisponible.',
    priorites: [],
  },
};
