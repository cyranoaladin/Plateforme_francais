import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  note: z.number().min(0).max(20),
  mention: z.string(),
  bilan_global: z.string(),
  conseil_final: z.string(),
  citations: z.array(citationSchema).max(3).optional(),
});

export type OralBilanOfficielOutput = z.infer<typeof schema>;

export const oralBilanOfficielSkill: SkillConfig<OralBilanOfficielOutput> = {
  prompt: 'Skill oral_bilan_officiel: synthétiser le bilan officiel d\'une session orale EAF complète. Note /20, mention, bilan global, conseil final.',
  outputSchema: schema,
  fallback: {
    note: 0,
    mention: 'Non évalué',
    bilan_global: 'Bilan indisponible.',
    conseil_final: 'Revenez pour une nouvelle simulation.',
  },
};
