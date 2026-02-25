import { z } from 'zod';
import { citationSchema } from '@/lib/rag/citations';
import { type SkillConfig } from '@/lib/llm/skills/types';

const schema = z.object({
  fiches: z.array(z.object({
    titre: z.string(),
    contenu: z.string(),
    tags: z.array(z.string()),
  })),
  citations: z.array(citationSchema).max(3).optional(),
});

export type CarnetLectureOutput = z.infer<typeof schema>;

export const carnetLectureSkill: SkillConfig<CarnetLectureOutput> = {
  prompt: 'Skill carnet_lecture: structurer les notes brutes d\'un élève en fiches exploitables pour l\'oral EAF. Ne jamais rédiger de contenu original à la place de l\'élève.',
  outputSchema: schema,
  fallback: {
    fiches: [],
  },
};
