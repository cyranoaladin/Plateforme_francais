import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  note: z.number(),
  max: z.number(),
  rubriques: z.array(z.object({
    titre: z.string(),
    note: z.number(),
    max: z.number(),
    commentaire: z.string(),
  })),
  bilan: z.string(),
  citations: z.array(citationSchema).max(3).optional(),
});

export type EcritBaremageOutput = z.infer<typeof schema>;

export const ecritBaremageSkill: SkillConfig<EcritBaremageOutput> = {
  prompt: 'Skill ecrit_baremage: évaluer une copie EAF selon le barème officiel détaillé par rubrique. Ne jamais rédiger de corrigé complet.',
  outputSchema: schema,
  fallback: {
    note: 0,
    max: 20,
    rubriques: [],
    bilan: 'Évaluation indisponible.',
  },
};
