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
2. Le texte support dépend du type d'exercice (voir ci-dessous).
3. Le sujet (consigne) doit être précis et exploitable par un élève de Première.
4. Le barème doit totaliser 20 points, réparti en rubriques pertinentes selon le type d'exercice.
5. Varier les époques, mouvements littéraires, genres et registres.
6. Ne JAMAIS rédiger la copie ni fournir de corrigé.

INTERDICTIONS STRICTES :
- Ne JAMAIS inclure de mentions type [Ressource: ...], [Source ...] ou toute référence à des ressources internes.
- Ne JAMAIS inclure de consignes de durée ("4 heures", "3 heures") dans le champ consignes.
- Le champ "consignes" contient UNIQUEMENT le rappel méthodologique court pour l'élève (ex: "Structurez votre argumentation en introduction, développement et conclusion.").
- Ne JAMAIS inclure de texte qui ressemble à une instruction de prompt ou un commentaire interne.
- Ne JAMAIS générer d'exemple de réponse, d'amorce rhétorique, de début de dissertation, de modèle d'introduction ou de texte ressemblant à une copie d'élève.
- Le champ "texte" ne doit JAMAIS contenir de texte argumentatif, de discours, d'essai ou de rédaction. Il contient UNIQUEMENT un extrait littéraire d'auteur (roman, théâtre, poésie, essai publié).

TYPES D'EXERCICE ET CONTENU DES CHAMPS :
- commentaire :
  "sujet" = la consigne d'analyse (ex: "Vous commenterez le texte ci-dessous en montrant comment...")
  "texte" = un extrait littéraire d'auteur (150-300 mots), avec titre de l'œuvre, nom de l'auteur et date.
- dissertation :
  "sujet" = la question complète INCLUANT la citation d'appui si pertinente (ex: "Kundera affirme que « la fiction est le mensonge qui dit vrai ». Dans quelle mesure...")
  "texte" = TOUJOURS une chaîne vide ""  ← OBLIGATOIRE, ne JAMAIS mettre de texte ici pour une dissertation.
- contraction_essai :
  "sujet" = la consigne de contraction puis d'essai.
  "texte" = le texte argumentatif à contracter (300-500 mots), issu d'un essai ou article réel.

FORMAT DE SORTIE (JSON strict) :
{
  "sujet": "La consigne complète — pour une dissertation, inclure la citation d'appui directement ici",
  "texte": "L'extrait littéraire (commentaire) ou texte à contracter (contraction_essai) — VIDE pour dissertation",
  "consignes": "Rappel méthodologique court pour l'élève",
  "bareme": { "rubrique1": points, "rubrique2": points, ... }
}`,
  outputSchema: schema,
  fallback: {
    sujet: "Expliquez comment le texte met en scène la tension entre l'individu et la société.",
    texte:
      "Dans la ville encore assoupie, Paul avançait d'un pas régulier, comme s'il voulait persuader les pavés qu'il avait choisi sa route.",
    consignes:
      "Appuyez votre analyse sur le texte proposé et sur vos connaissances littéraires. Structurez votre argumentation en introduction, développement et conclusion.",
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
