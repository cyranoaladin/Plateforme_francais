import { z } from 'zod';
import { bibliothecaireSkill } from '@/lib/llm/skills/bibliothecaire';
import { coachEcritSkill } from '@/lib/llm/skills/coach-ecrit';
import { coachOralSkill } from '@/lib/llm/skills/coach-oral';
import { correcteurSkill } from '@/lib/llm/skills/correcteur';
import { quizMaitreSkill } from '@/lib/llm/skills/quiz-maitre';
import { tuteurLibreSkill } from '@/lib/llm/skills/tuteur-libre';
import { type Skill, type SkillConfig } from '@/lib/llm/skills/types';

export const skillConfigs: Record<Skill, SkillConfig<unknown>> = {
  bibliothecaire: bibliothecaireSkill,
  coach_ecrit: coachEcritSkill,
  coach_oral: coachOralSkill,
  correcteur: correcteurSkill,
  quiz_maitre: quizMaitreSkill,
  tuteur_libre: tuteurLibreSkill,
};

export function parseSkillOutput(skill: Skill, payload: unknown): unknown {
  const config = skillConfigs[skill];
  return config.outputSchema.parse(payload);
}

export function fallbackSkillOutput(skill: Skill): unknown {
  return skillConfigs[skill].fallback;
}

export function skillSchemaFor(skill: Skill): z.ZodType<unknown> {
  return skillConfigs[skill].outputSchema;
}

export function skillPromptFor(skill: Skill): string {
  return skillConfigs[skill].prompt;
}
