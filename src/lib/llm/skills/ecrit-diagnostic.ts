import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  niveau: z.string(),
  points_forts: z.array(z.string()),
  lacunes: z.array(z.string()),
  recommandations: z.array(z.string()),
  priorites: z.array(z.string()).max(3),
  citations: z.array(citationSchema).max(3).optional(),
});

export type EcritDiagnosticOutput = z.infer<typeof schema>;

export const ecritDiagnosticSkill: SkillConfig<EcritDiagnosticOutput> = {
  prompt: 'Skill ecrit_diagnostic: analyser le niveau écrit d\'un élève à partir d\'un échantillon et identifier forces/faiblesses. Ne jamais rédiger à sa place.',
  outputSchema: schema,
  fallback: {
    niveau: 'Non évalué',
    points_forts: [],
    lacunes: ['Impossible d\'évaluer sans échantillon.'],
    recommandations: ['Soumettez un extrait de votre travail pour un diagnostic.'],
    priorites: ['Structuration', 'Argumentation', 'Langue'],
  },
};
