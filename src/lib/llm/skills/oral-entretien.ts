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

export type OralEntretienOutput = z.infer<typeof schema>;

export const oralEntretienSkill: SkillConfig<OralEntretienOutput> = {
  prompt: 'Skill oral_entretien: évaluer l\'entretien EAF (/8). Critères: pertinence des réponses, culture littéraire, capacité à développer, liens entre oeuvres. Proposer une relance. Ne jamais répondre à la place de l\'élève.',
  outputSchema: schema,
  fallback: {
    feedback: 'Évaluation indisponible.',
    score: 0,
    max: 8,
    points_forts: [],
    axes: ['Approfondir la connaissance des oeuvres du parcours.'],
  },
};
