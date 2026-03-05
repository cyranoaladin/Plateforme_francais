import { z } from 'zod';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  sujet: z.string(),
  texte: z.string(),
  consignes: z.string(),
  bareme: z.record(z.string(), z.number()),
  plan: z.array(z.string()).optional(),
  conseils: z.array(z.string()).optional(),
  vigilance: z.array(z.string()).optional(),
});

export type CoachEcritOutput = z.infer<typeof schema>;

export const coachEcritSkill: SkillConfig<CoachEcritOutput> = {
  prompt: `Rôle : Générateur de sujets EAF (Épreuve Anticipée de Français).
Tu génères des sujets d'épreuve blanche EAF variés, originaux et conformes au Bulletin Officiel.

RÈGLES :
1. Chaque sujet doit être UNIQUE — ne jamais proposer deux fois le même sujet.
2. Le texte support doit être un extrait littéraire réaliste (150-300 mots), cohérent avec l'œuvre ou le thème demandé.
3. Le sujet (consigne) doit être précis et exploitable par un élève de Première.
4. Le barème doit totaliser 20 points, réparti en rubriques pertinentes selon le type d'exercice.
5. Varier les époques, mouvements littéraires, genres et registres.
6. Ne JAMAIS rédiger la copie ni fournir de corrigé.

TYPES D'EXERCICE :
- commentaire : analyse littéraire d'un texte
- dissertation : argumentation sur une question littéraire
- contraction_essai : contraction de texte + essai argumentatif

FORMAT DE SORTIE (JSON strict) :
{
  "sujet": "La consigne complète du sujet",
  "texte": "L'extrait littéraire support (150-300 mots)",
  "consignes": "Les consignes officielles (durée, rappels méthodologiques)",
  "bareme": { "rubrique1": points, "rubrique2": points, ... },
  "plan": ["I. Axe 1", "II. Axe 2", "III. Axe 3"],
  "conseils": ["conseil méthodologique 1", "conseil 2"],
  "vigilance": ["piège à éviter 1", "piège 2"]
}`,
  outputSchema: schema,
  fallback: {
    sujet: "Expliquez comment le texte met en scène la tension entre l'individu et la société.",
    texte:
      "Dans la ville encore assoupie, Paul avançait d'un pas régulier, comme s'il voulait persuader les pavés qu'il avait choisi sa route.",
    consignes:
      "Vous traiterez ce sujet en 4 heures. Appuyez votre analyse sur le texte proposé et sur vos connaissances littéraires.",
    bareme: {
      comprehension: 4,
      analyse: 8,
      expression: 4,
      organisation: 4,
    },
    conseils: ['Annoncez un plan clair et justifiez chaque argument par le texte.'],
    vigilance: ['Ne paraphrasez pas: analysez les procédés et leurs effets.'],
  },
};
