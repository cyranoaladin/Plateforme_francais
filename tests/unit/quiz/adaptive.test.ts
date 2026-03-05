import { describe, expect, it } from 'vitest';
import { skillConfigs } from '@/lib/llm/skills';

describe('quiz adaptive', () => {
  it('a un fallback compatible avec son schema', () => {
    const parsed = skillConfigs.quiz_adaptatif.outputSchema.safeParse(skillConfigs.quiz_adaptatif.fallback);
    expect(parsed.success).toBe(true);
  });
});
