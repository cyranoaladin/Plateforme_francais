import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  weeks: z.array(z.object({
    weekNumber: z.number().int(),
    startDate: z.string(),
    tasks: z.array(z.object({
      oeuvre: z.string(),
      competence: z.string(),
      dureeMinutes: z.number().int(),
      priorite: z.enum(['haute', 'moyenne', 'basse']),
    })),
  })),
  citations: z.array(citationSchema).max(3).optional(),
});

export type SRPlannerOutput = z.infer<typeof schema>;

export const srPlannerSkill: SkillConfig<SRPlannerOutput> = {
  prompt: 'Skill sr_planner: générer un planning de révision semaine par semaine jusqu\'à la date EAF, par oeuvre et compétence, basé sur l\'algorithme de répétition espacée.',
  outputSchema: schema,
  fallback: {
    weeks: [],
  },
};
