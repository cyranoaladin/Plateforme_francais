import { z } from 'zod';

export const skillSchema = z.enum([
  'bibliothecaire',
  'coach_ecrit',
  'coach_oral',
  'correcteur',
  'quiz_maitre',
  'tuteur_libre',
]);

export type Skill = z.infer<typeof skillSchema>;

export type SkillConfig<T> = {
  prompt: string;
  outputSchema: z.ZodType<T>;
  fallback: T;
};
