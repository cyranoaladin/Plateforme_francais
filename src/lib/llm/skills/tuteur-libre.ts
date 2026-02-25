import { z } from 'zod';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  answer: z.string(),
  citations: z.array(
    z.object({
      title: z.string(),
      source: z.string(),
      url: z.string(),
    }),
  ),
  suggestions: z.array(z.string()).max(3),
});

export type TuteurLibreOutput = z.infer<typeof schema>;

export const tuteurLibreSkill: SkillConfig<TuteurLibreOutput> = {
  prompt:
    'Skill tuteur_libre: répondre comme un professeur accompagnateur, avec citations et suggestions de questions suivantes.',
  outputSchema: schema,
  fallback: {
    answer: 'Je peux vous guider étape par étape à partir de vos cours et des textes officiels.',
    citations: [],
    suggestions: ['Souhaitez-vous une méthode de commentaire en 5 étapes ?'],
  },
};
