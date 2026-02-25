import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  questions: z.array(z.object({
    id: z.string(),
    enonce: z.string(),
    options: z.array(z.string()).min(2).max(4),
    bonneReponse: z.number().int().min(0).max(3),
    explication: z.string(),
    difficulte: z.number().int().min(1).max(3),
  })),
  citations: z.array(citationSchema).max(3).optional(),
});

export type QuizAdaptatifOutput = z.infer<typeof schema>;

export const quizAdaptatifSkill: SkillConfig<QuizAdaptatifOutput> = {
  prompt: 'Skill quiz_adaptatif: générer des questions de révision EAF adaptées au niveau de l\'élève. Varier les difficultés selon les résultats précédents.',
  outputSchema: schema,
  fallback: {
    questions: [],
  },
};
