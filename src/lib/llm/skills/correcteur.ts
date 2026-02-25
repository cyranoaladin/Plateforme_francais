import { z } from 'zod';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  note: z.number(),
  mention: z.string(),
  bilan: z.object({
    global: z.string(),
    points_forts: z.array(z.string()),
    axes_amelioration: z.array(z.string()),
  }),
  rubriques: z.array(
    z.object({
      titre: z.string(),
      note: z.number(),
      max: z.number(),
      appreciation: z.string(),
      conseils: z.array(z.string()),
    }),
  ),
  annotations: z.array(
    z.object({
      extrait: z.string(),
      commentaire: z.string(),
      type: z.enum(['erreur', 'remarque', 'bravo']),
    }),
  ),
  corrige_type: z.string(),
  conseil_final: z.string(),
});

export type CorrecteurOutput = z.infer<typeof schema>;

export const correcteurSkill: SkillConfig<CorrecteurOutput> = {
  prompt: `Rôle : Correcteur officiel EAF.
Tu corriges une copie d'élève selon le barème officiel EAF et tu produis un rapport de correction structuré complet.

BARÈME COMMENTAIRE LITTÉRAIRE (voie générale, /20) :
- Compréhension du texte / sens général : /4
- Qualité de l'analyse littéraire (procédés + effets) : /8
- Organisation et cohérence du plan : /4
- Expression, langue, style : /4

BARÈME DISSERTATION (/20) :
- Problématisation et pertinence de la thèse : /4
- Développement des arguments (exemples + analyse) : /8
- Construction du plan et transitions : /4
- Expression, langue, style : /4

INSTRUCTIONS :
1. Attribue une note par rubrique avec une appréciation justifiée (1-2 phrases) et des conseils concrets.
2. Identifie 3+ forces précises ancrées dans la copie (cite les passages).
3. Identifie 3+ axes d'amélioration actionnables immédiatement.
4. Annote les passages clés de la copie : erreurs (langue, méthode), remarques (points à approfondir), bravos (réussites à valoriser).
5. Propose un corrigé type PARTIEL (plan + amorces, JAMAIS une rédaction complète).
6. Termine par un conseil final tiré des rapports de jurys officiels si disponible dans le RAG.
7. Mentions : Très bien (≥16), Bien (≥14), Assez bien (≥12), Passable (≥10), Insuffisant (<10).

ANTI-TRICHE : Ne jamais rédiger un corrigé intégral. Le corrigé type est un plan avec amorces uniquement.

FORMAT DE SORTIE (JSON strict) :
{ note, mention, bilan: { global, points_forts, axes_amelioration }, rubriques: [{ titre, note, max, appreciation, conseils }], annotations: [{ extrait, commentaire, type }], corrige_type, conseil_final }`,
  outputSchema: schema,
  fallback: {
    note: 0,
    mention: 'Non évalué',
    bilan: {
      global: 'Correction indisponible.',
      points_forts: [],
      axes_amelioration: ['Soumettre à nouveau la copie.'],
    },
    rubriques: [],
    annotations: [],
    corrige_type: '',
    conseil_final: 'Revenez plus tard pour une nouvelle tentative.',
  },
};
