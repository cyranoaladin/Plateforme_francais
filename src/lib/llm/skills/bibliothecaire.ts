import { z } from 'zod';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  answer: z.string(),
  citations: z.array(
    z.object({
      title: z.string(),
      url: z.string(),
      excerpt: z.string(),
    }),
  ),
  nextSteps: z.array(z.string()),
});

export type BibliothecaireOutput = z.infer<typeof schema>;

export const bibliothecaireSkill: SkillConfig<BibliothecaireOutput> = {
  prompt:
    'Skill bibliothecaire: répondre à une question documentaire EAF, synthétiser les ressources utiles et proposer des prochaines lectures.',
  outputSchema: schema,
  fallback: {
    answer: 'Je n\'ai pas assez de sources fiables pour répondre précisément.',
    citations: [],
    nextSteps: ['Reformulez la question avec une oeuvre ou une notion précise.'],
  },
};
