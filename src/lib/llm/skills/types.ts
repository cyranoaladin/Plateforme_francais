import { z } from 'zod';

export const skillSchema = z.enum([
  'bibliothecaire',
  'coach_ecrit',
  'coach_oral',
  'correcteur',
  'quiz_maitre',
  'tuteur_libre',
  'oral_tirage',
  'coach_lecture',
  'coach_explication',
  'grammaire_ciblee',
  'oral_entretien',
  'oral_bilan_officiel',
  'ecrit_diagnostic',
  'ecrit_plans',
  'ecrit_contraction',
  'ecrit_essai',
  'ecrit_langue',
  'ecrit_baremage',
  'revision_fiches',
  'quiz_adaptatif',
  'spaced_repetition',
  'oral_prep30',
  'citations_procedes',
  'carnet_lecture',
  'sr_planner',
  'support_produit',
  'examinateur_virtuel',
]);

export type Skill = z.infer<typeof skillSchema>;

export type SkillConfig<T> = {
  prompt: string;
  outputSchema: z.ZodType<T>;
  fallback: T;
};
