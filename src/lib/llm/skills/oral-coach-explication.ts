import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  feedback: z.string(),
  score: z.number().min(0).max(8),
  max: z.literal(8),
  points_forts: z.array(z.string()),
  axes: z.array(z.string()),
  relance: z.string().optional(),
  citations: z.array(citationSchema).max(3).optional(),
});

export type CoachExplicationOutput = z.infer<typeof schema>;

export const coachExplicationSkill: SkillConfig<CoachExplicationOutput> = {
  prompt: 'Skill coach_explication: évaluer l\'explication linéaire EAF (/8). Critères: compréhension du texte, analyse des procédés, structuration, argumentation. Ne jamais fournir d\'explication complète.',
  outputSchema: schema,
  fallback: {
    feedback: 'Évaluation indisponible.',
    score: 0,
    max: 8,
    points_forts: [],
    axes: ['Structurer l\'explication en mouvements du texte.'],
  },
};
