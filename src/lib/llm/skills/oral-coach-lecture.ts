import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  feedback: z.string(),
  score: z.number().min(0).max(2),
  max: z.literal(2),
  points_forts: z.array(z.string()),
  axes: z.array(z.string()),
  citations: z.array(citationSchema).max(3).optional(),
});

export type CoachLectureOutput = z.infer<typeof schema>;

export const coachLectureSkill: SkillConfig<CoachLectureOutput> = {
  prompt: 'Skill coach_lecture: évaluer la lecture expressive EAF (/2). Critères: fluidité, prosodie, rythme, respect de la ponctuation. Ne jamais lire le texte à la place de l\'élève.',
  outputSchema: schema,
  fallback: {
    feedback: 'Évaluation indisponible.',
    score: 0,
    max: 2,
    points_forts: [],
    axes: ['Retravailler la lecture à voix haute.'],
  },
};
