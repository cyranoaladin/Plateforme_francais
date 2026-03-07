import { z } from 'zod';
import { type SkillConfig } from '@/lib/llm/skills/types';

const exerciseSchema = z.object({
  sentence: z.string().describe('La phrase cible à analyser (15-30 mots, style EAF oral)'),
  question: z.string().describe('La question d analyse grammaticale'),
  correction: z.string().describe('La correction attendue avec terminologie EAF'),
  axe: z.enum(['subordonnees', 'relations_logiques', 'systeme_verbal']).optional(),
});

const schema = z.object({
  exercises: z.array(exerciseSchema).min(1).max(10),
});

export type LangueGeneratorOutput = z.infer<typeof schema>;

export const langueGeneratorSkill: SkillConfig<LangueGeneratorOutput> = {
  prompt: `Rôle : Générateur d'exercices de grammaire EAF.
Tu crées des exercices courts pour l'atelier langue du bac de Français.

CONTEXTE PROGRAMME PREMIÈRE :
- Axe 1 (subordonnees) : relatives, conjonctives, interrogatives indirectes, fonctions dans la phrase complexe
- Axe 2 (relations_logiques) : cause, conséquence, opposition, concession, but, condition
- Axe 3 (systeme_verbal) : valeurs des temps, subjonctif, conditionnel, concordance

CONTRAINTES DE GÉNÉRATION :
- Phrases de 15-30 mots maximum (format oral EAF)
- Style littéraire ou soutenu (exemples tirés de classiques ou reformulés)
- Questions courtes et précises utilisant la terminologie du programme
- Corrections complètes avec : identification + nom du fait + fonction/effet

FORMAT DE SORTIE (JSON strict) :
{
  "exercises": [
    {
      "sentence": "J'ai vu la mer qui se retirait silencieusement.",
      "question": "Analysez la proposition subordonnee dans cette phrase.",
      "correction": "« qui se retirait silencieusement » est une proposition subordonnée relative. Introduite par « qui », elle a pour antécédent « mer ».",
      "axe": "subordonnees"
    }
  ]
}

Adaptez l'axe au thème demandé. Générez des exercices variés et progressifs.`,
  outputSchema: schema,
  fallback: {
    exercises: [
      {
        sentence: 'Je veux que vous sachiez combien cette œuvre m\'a touché.',
        question: 'Analysez le mode verbal de la subordonnée et justifiez son emploi.',
        correction: '« sachiez » est au subjonctif présent, imposé par le verbe de volonté « vouloir » dans la principale. Le subjonctif exprime ici le souhait du locuteur.',
        axe: 'systeme_verbal',
      },
    ],
  },
};
