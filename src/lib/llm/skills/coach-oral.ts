import { z } from 'zod';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  feedback: z.string(),
  score: z.number(),
  max: z.number(),
  points_forts: z.array(z.string()),
  axes: z.array(z.string()),
  relance: z.string().optional(),
});

export type CoachOralOutput = z.infer<typeof schema>;

export const coachOralSkill: SkillConfig<CoachOralOutput> = {
  prompt: 'Skill coach_oral: évaluer une prise de parole EAF selon les critères officiels et proposer une relance.',
  outputSchema: schema,
  fallback: {
    feedback: 'Réponse non exploitable. Réessayez avec un transcript plus précis.',
    score: 0,
    max: 20,
    points_forts: [],
    axes: ['Structurer davantage la réponse.'],
  },
};
