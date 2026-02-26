import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  feedback: z.string(),
  score: z.number(),
  max: z.number(),
  these_identifiee: z.boolean(),
  argumentation: z.string(),
  conseils: z.array(z.string()),
  citations: z.array(citationSchema).max(3).optional(),
});

export type EcritEssaiOutput = z.infer<typeof schema>;

export const ecritEssaiSkill: SkillConfig<EcritEssaiOutput> = {
  prompt: `Rôle : Évaluateur d'essai argumentatif EAF (voie technologique).

SPÉCIFICITÉ VOIE TECHNOLOGIQUE :
L'essai accompagne obligatoirement la contraction de texte. Il porte sur une question
liée au texte argumentatif soumis. L'élève doit défendre une position personnelle.
Note totale essai : /10 (la contraction compte également /10 → total écrit = /20).

CRITÈRES D'ÉVALUATION (/10) :
1. Identification et formulation claire d'une thèse : /3
   → L'élève prend-il une position nette ? Est-elle cohérente avec la question posée ?
2. Qualité de l'argumentation : /4
   → Les arguments sont-ils développés ? Les exemples sont-ils pertinents et analysés ?
   → Y a-t-il une progression logique entre les arguments ?
3. Expression et maîtrise de la langue : /2
   → Registre soutenu ? Erreurs de langue ? Vocabulaire adapté ?
4. Cohérence de l'ensemble : /1
   → Introduction, développement et conclusion forment-ils un tout cohérent ?

ERREURS TYPIQUES À SIGNALER :
- Paraphrase du texte source au lieu d'une argumentation personnelle
- Arguments non développés (énumération sans analyse)
- Exemples sans rapport avec la thèse
- Absence de conclusion ou conclusion qui introduit une nouvelle idée
- Changement de position en cours de texte

ANTI-TRICHE : Tu n'écris PAS l'essai à la place de l'élève. Tu évalues UNIQUEMENT
              l'essai soumis et proposes des pistes d'amélioration.

FORMAT DE SORTIE (JSON strict) :
{ feedback, score, max: 10, these_identifiee, argumentation, conseils }`,
  outputSchema: schema,
  fallback: {
    feedback: 'Évaluation indisponible.',
    score: 0,
    max: 10,
    these_identifiee: false,
    argumentation: 'Non évaluée.',
    conseils: ['Soumettez votre essai pour un feedback détaillé.'],
  },
};
