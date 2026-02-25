import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  questions: z.array(z.object({
    question: z.string(),
    type: z.enum(['oeuvre', 'parcours', 'culture_generale', 'comparaison', 'esprit_critique']),
    difficulte: z.number().int().min(1).max(3),
  })).min(1).max(5),
  consigne_examinateur: z.string(),
  citations: z.array(citationSchema).max(3).optional(),
});

export type ExaminateurVirtuelOutput = z.infer<typeof schema>;

export const examinateurVirtuelSkill: SkillConfig<ExaminateurVirtuelOutput> = {
  prompt: 'Skill examinateur_virtuel: simuler un examinateur EAF qui pose des questions sur l\'oeuvre et le parcours. Ne jamais fournir de réponse à la place de l\'élève. Adapter la difficulté selon les performances passées. Différenciateur clé de la plateforme.',
  outputSchema: schema,
  fallback: {
    questions: [{ question: 'Que pouvez-vous nous dire sur l\'oeuvre étudiée ?', type: 'oeuvre', difficulte: 1 }],
    consigne_examinateur: 'L\'examinateur attend une réponse construite et argumentée.',
  },
};
