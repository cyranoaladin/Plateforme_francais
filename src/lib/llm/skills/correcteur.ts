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
  prompt:
    'Skill correcteur: corriger une copie EAF selon barème officiel et retourner un JSON structuré complet.',
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
