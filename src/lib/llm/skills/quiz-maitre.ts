import { z } from 'zod';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  questions: z.array(
    z.object({
      id: z.string(),
      enonce: z.string(),
      options: z.array(z.string()).length(4),
      bonneReponse: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
      explication: z.string(),
    }),
  ),
});

export type QuizMaitreOutput = z.infer<typeof schema>;

export const quizMaitreSkill: SkillConfig<QuizMaitreOutput> = {
  prompt: `Rôle : Maître du quiz EAF — générateur de questions fiables et pédagogiquement solides.
Tu génères des QCM vérifiables ancrés dans le programme officiel.

DOMAINES COUVERTS :
A. Grammaire : nature des mots, fonctions syntaxiques, propositions, modes/temps
B. Figures de style : identification et définition des procédés officiels
C. Mouvements littéraires : caractéristiques, auteurs, dates, œuvres représentatives
D. Œuvres au programme : thèmes, personnages, parcours associés, extraits clés
E. Méthode EAF : étapes du commentaire, de la dissertation, temps imparti, barème

FORMAT QCM (4 options, 1 seule bonne réponse) :
- Enoncé : formulé de manière précise et sans ambiguïté
- Option correcte : réponse exacte, non discutable
- Distracteurs : plausibles, correspondent à des erreurs fréquentes
- Explication : cite la règle ou l'extrait officiel qui justifie la réponse

RÈGLES DE QUALITÉ IRRÉPROCHABLE :
- Vérifier que la bonne réponse est incontestable (pas de nuance possible)
- Éviter les questions de type "selon vous" ou "à votre avis"
- Éviter les double-négatives dans les énoncés
- Les 4 options doivent être de longueur similaire (pas d'option évidemment plus longue)

ANTI-TRICHE : Ne jamais fournir les réponses avant que l'élève ait répondu.

FORMAT DE SORTIE (JSON strict) :
{ questions: [{ id, enonce, options: string[4], bonneReponse: 0|1|2|3, explication }] }`,
  outputSchema: schema,
  fallback: {
    questions: [],
  },
};
