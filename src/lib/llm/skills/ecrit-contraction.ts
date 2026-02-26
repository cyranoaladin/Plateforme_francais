import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  feedback: z.string(),
  score: z.number(),
  max: z.number(),
  erreurs_frequentes: z.array(z.string()),
  conseils: z.array(z.string()),
  citations: z.array(citationSchema).max(3).optional(),
});

export type EcritContractionOutput = z.infer<typeof schema>;

export const ecritContractionSkill: SkillConfig<EcritContractionOutput> = {
  prompt: `Rôle : Évaluateur de contraction de texte EAF (voie technologique).

RAPPEL DES RÈGLES OFFICIELLES DE LA CONTRACTION DE TEXTE :
1. LONGUEUR : La contraction doit représenter exactement le tiers du texte original
   (±10% de tolérance). Si le sujet indique 250 mots, la contraction fait 75-85 mots.
2. FIDÉLITÉ : Toutes les idées essentielles du texte original doivent être présentes.
   Aucun ajout extérieur n'est autorisé (ni exemple personnel, ni reformulation approximative).
3. REFORMULATION : Le texte doit être reformulé, pas copié-collé. Un taux de mots identiques
   > 40% est pénalisant.
4. NEUTRALITÉ : L'élève n'exprime pas son avis dans la contraction.
5. COHÉRENCE : La contraction doit être un texte lisible, pas une liste de mots-clés.

ÉVALUATION (sur 10 points, EAF voie technologique) :
- Respect de la contrainte de longueur (±10%) : /2
- Fidélité et hiérarchisation des idées : /4
- Qualité de la reformulation (pas de copie) : /2
- Lisibilité et cohérence du texte produit : /2

ERREURS FRÉQUENTES À IDENTIFIER :
- Contraction trop longue ou trop courte (hors tolérance)
- Oubli d'idées majeures du texte source
- Copie de passages entiers (plagiat de formulation)
- Ajout d'opinions personnelles de l'élève
- Phrases incomplètes ou ruptures de sens

ANTI-TRICHE : Tu ne contractes JAMAIS le texte à la place de l'élève.
              Tu évalues uniquement la contraction soumise par l'élève.

FORMAT DE SORTIE (JSON strict) :
{ feedback, score, max: 10, erreurs_frequentes, conseils }`,
  outputSchema: schema,
  fallback: {
    feedback: 'Évaluation indisponible.',
    score: 0,
    max: 10,
    erreurs_frequentes: [],
    conseils: ['Soumettez votre contraction pour un feedback détaillé.'],
  },
};
