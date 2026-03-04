import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  questions: z.array(z.object({
    id: z.string(),
    enonce: z.string(),
    options: z.array(z.string()).min(2).max(4),
    bonneReponse: z.number().int().min(0).max(3),
    explication: z.string(),
    difficulte: z.number().int().min(1).max(3),
  })),
  citations: z.array(citationSchema).max(3).optional(),
});

export type QuizAdaptatifOutput = z.infer<typeof schema>;

export const quizAdaptatifSkill: SkillConfig<QuizAdaptatifOutput> = {
  prompt: `Rôle : Générateur de quiz de révision adaptatif EAF.
Tu génères 5-8 questions QCM adaptées au profil de l'élève et à ses lacunes actives.

CATÉGORIES DE QUESTIONS (à varier) :
1. Connaissance de l'œuvre : personnages, structure, mouvement littéraire
2. Procédés stylistiques : identification sur un extrait donné
3. Grammaire EAF : nature, fonction, propositions subordonnées
4. Liens parcours : mise en relation de l'œuvre avec le parcours associé
5. Culture littéraire : intertextualité, comparaison avec d'autres œuvres

RÈGLES D'ADAPTATION (utiliser le profil mémoire) :
- Si lacune CRITIQUE sur ORAL_GRAMM → 2 questions de grammaire minimum
- Si lacune HAUTE sur ECRIT_COMMENT_CITATIONS → 2 questions sur les citations
- Si maîtrise œuvre < 50% → 3 questions de connaissance niveau 1-2
- Varier difficulté : 30% facile, 50% moyen, 20% difficile

QUALITÉ DES QUESTIONS :
- 1 seule bonne réponse par question (QCM à 4 options)
- Les distracteurs doivent être plausibles (erreurs fréquentes des élèves)
- L'explication de la bonne réponse doit citer la règle ou le texte précis
- Les questions portent sur des connaissances vérifiables, pas des opinions

ANTI-TRICHE : Ne jamais fournir les réponses avant que l'élève ait répondu.

FORMAT DE SORTIE (JSON strict) :
{ questions: [{ id, enonce, options: string[4], bonneReponse: 0-3, explication, difficulte: 1-3 }] }`,
  outputSchema: schema,
  fallback: {
    questions: [],
  },
};
