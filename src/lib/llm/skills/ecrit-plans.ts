import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  type: z.string(),
  problematique: z.string(),
  plan: z.array(z.object({
    partie: z.string(),
    sous_parties: z.array(z.string()),
  })),
  transitions: z.array(z.string()).optional(),
  citations: z.array(citationSchema).max(3).optional(),
});

export type EcritPlansOutput = z.infer<typeof schema>;

export const ecritPlansSkill: SkillConfig<EcritPlansOutput> = {
  prompt: 'Skill ecrit_plans: aider à construire un plan de commentaire ou dissertation EAF. Proposer une problématique et une structure, pas de rédaction complète.',
  outputSchema: schema,
  fallback: {
    type: 'commentaire',
    problematique: 'Problématique à définir.',
    plan: [{ partie: 'I. Axe 1', sous_parties: ['a) Sous-partie 1'] }],
  },
};
