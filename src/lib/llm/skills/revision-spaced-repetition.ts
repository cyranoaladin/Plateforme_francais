import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  cards: z.array(z.object({
    front: z.string(),
    back: z.string(),
    tag: z.string(),
    nextReviewDays: z.number().int().min(1),
  })),
  citations: z.array(citationSchema).max(3).optional(),
});

export type SpacedRepetitionOutput = z.infer<typeof schema>;

export const spacedRepetitionSkill: SkillConfig<SpacedRepetitionOutput> = {
  prompt: 'Skill spaced_repetition: générer des flashcards de révision EAF avec intervalles de répétition espacée. Chaque carte a un recto (question) et un verso (réponse concise).',
  outputSchema: schema,
  fallback: {
    cards: [],
  },
};
