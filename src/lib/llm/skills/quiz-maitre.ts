import { z } from 'zod';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  questions: z.array(
    z.object({
      id: z.string(),
      enonce: z.string(),
      options: z.array(z.string()).length(4),
      bonneReponse: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
      explication: z.string(),
    }),
  ),
});

export type QuizMaitreOutput = z.infer<typeof schema>;

export const quizMaitreSkill: SkillConfig<QuizMaitreOutput> = {
  prompt: 'Skill quiz_maitre: générer des questions fiables de révision EAF en format QCM/TF.',
  outputSchema: schema,
  fallback: {
    questions: [],
  },
};
