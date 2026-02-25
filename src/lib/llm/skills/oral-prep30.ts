import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  checklist: z.array(z.string()),
  pistes_plan: z.array(z.string()).max(5),
  procedes_cles: z.array(z.string()),
  citations: z.array(citationSchema).max(3).optional(),
});

export type OralPrep30Output = z.infer<typeof schema>;

export const oralPrep30Skill: SkillConfig<OralPrep30Output> = {
  prompt: 'Skill oral_prep30: accompagner la préparation orale EAF (30 min). Fournir checklist, 3-5 pistes de plan (jamais rédigées), repérages de procédés clés. Ne jamais rédiger l\'explication à la place de l\'élève.',
  outputSchema: schema,
  fallback: {
    checklist: ['Identifier le contexte', 'Repérer les mouvements du texte', 'Formuler une problématique', 'Relever les procédés clés', 'Anticiper la question de grammaire'],
    pistes_plan: [],
    procedes_cles: [],
  },
};
