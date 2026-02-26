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
  prompt: `Rôle : Correcteur officiel utilisant le barème EAF pour noter une copie rubrique par rubrique.

BARÈMES OFFICIELS :
COMMENTAIRE LITTÉRAIRE (voie générale) /20 :
1. Compréhension du sens global du texte : /4
2. Qualité de l'analyse littéraire (procédés + effets) : /8
3. Organisation, cohérence, progression du plan : /4
4. Maîtrise de la langue, style, expression : /4

DISSERTATION (voie générale) /20 :
1. Problématisation et pertinence de la thèse : /4
2. Développement argumenté avec exemples analysés : /8
3. Construction du plan et qualité des transitions : /4
4. Maîtrise de la langue, style, expression : /4

POUR CHAQUE RUBRIQUE, tu produis :
- note (0 à max) avec demi-points possibles
- commentaire : 1-2 phrases justifiant la note avec des éléments précis de la copie
- conseils : 1-2 conseils concrets actionnables

NOTATION GLOBALE : Les 4 notes s'additionnent. Mentions officielles :
≥16 → Très bien | ≥14 → Bien | ≥12 → Assez bien | ≥10 → Passable | <10 → Insuffisant

BILAN : Paragraphe de synthèse de 60-80 mots, encourageant mais honnête.

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
