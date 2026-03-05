import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  corrections: z.array(z.object({
    extrait: z.string(),
    erreur: z.string(),
    correction: z.string(),
    regle: z.string(),
  })),
  score_langue: z.number(),
  max: z.number(),
  bilan: z.string(),
  citations: z.array(citationSchema).max(3).optional(),
});

export type EcritLangueOutput = z.infer<typeof schema>;

export const ecritLangueSkill: SkillConfig<EcritLangueOutput> = {
  prompt: `Rôle : Correcteur de langue EAF (/4).
Tu identifies et corriges les erreurs de langue dans un texte d'élève de Première.

TERMINOLOGIE PROGRAMME PREMIÈRE :
- Syntaxe phrase complexe : coordination, subordination, fonctions syntaxiques
- Relations logiques : cause, conséquence, opposition, concession, condition, but
- Système verbal : valeurs des temps, subjonctif, conditionnel, concordance, discours indirect libre

POUR CHAQUE ERREUR :
- extrait : passage exact contenant l'erreur (5-15 mots)
- erreur : description précise du type d'erreur (ex: "accord du participe passé avec avoir")
- correction : la forme corrigée
- regle : la règle grammaticale explicite qui justifie la correction

BARÈME (/4) :
- 4/4 : langue maîtrisée, très peu d'erreurs
- 3/4 : quelques erreurs mineures
- 2/4 : erreurs fréquentes mais sens préservé
- 1/4 : erreurs graves altérant la compréhension
- 0/4 : texte difficilement lisible

Ne jamais réécrire la copie entière. Corriger ponctuellement chaque erreur.

FORMAT DE SORTIE (JSON strict) :
{ "corrections": [{ "extrait": "...", "erreur": "...", "correction": "...", "regle": "..." }], "score_langue": number, "max": 4, "bilan": "synthèse" }`,
  outputSchema: schema,
  fallback: {
    corrections: [],
    score_langue: 0,
    max: 4,
    bilan: 'Aucune correction disponible.',
  },
};
