import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  note: z.number(),
  max: z.number(),
  rubriques: z.array(z.object({
    titre: z.string(),
    note: z.number(),
    max: z.number(),
    commentaire: z.string(),
  })),
  bilan: z.string(),
  citations: z.array(citationSchema).max(3).optional(),
});

export type EcritBaremageOutput = z.infer<typeof schema>;

export const ecritBaremageSkill: SkillConfig<EcritBaremageOutput> = {
  prompt: `Tu évalues un commentaire littéraire selon les échelles descriptives
officielles de l'EAF (académie de Nantes).

CRITÈRES D'ÉVALUATION (les seuls valides) :

1. COMPRÉHENSION ET INTERPRÉTATION (6/20)
- Le candidat a-t-il compris le sens global et les nuances du texte ?
- Les citations sont-elles pertinentes et analysées ?

2. CONSTRUCTION DE LA RÉFLEXION (6/20)
- Le projet de lecture est-il adapté au texte ?
- Le propos est-il organisé, progressif, sans paraphrase ?
- Y a-t-il des étapes identifiables dans le développement ?

3. CULTURE LITTÉRAIRE (4/20)
- Le candidat mobilise-t-il un vocabulaire d'analyse adapté ?
- Y a-t-il des connaissances sur le genre, l'époque, l'objet d'étude ?

4. MAÎTRISE DE LA LANGUE (4/20)
- L'expression est-elle correcte et lisible ?
- Le lexique est-il précis ?

NE PAS évaluer séparément :
- La qualité de l'introduction (c'est inclus dans la construction)
- La qualité de la conclusion (idem)
- Le respect d'un plan en 2 ou 3 parties (la forme est libre)

Retourner un JSON avec la structure des BAREMES.commentaire_serie_generale.

ANTI-TRICHE : Tu ne rédiges JAMAIS de corrigé intégral. Tu ne complètes JAMAIS la copie.

FORMAT DE SORTIE (JSON strict) :
{ note, max: 20, rubriques: [{ titre, note, max, commentaire }], bilan }`,
  outputSchema: schema,
  fallback: {
    note: 0,
    max: 20,
    rubriques: [],
    bilan: 'Évaluation indisponible.',
  },
};
