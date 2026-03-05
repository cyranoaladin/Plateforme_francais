import { describe, expect, it } from 'vitest';
import { skillConfigs } from '@/lib/llm/skills';

describe('skill correcteur', () => {
  it('expose un fallback valide', () => {
    const parsed = skillConfigs.correcteur.outputSchema.safeParse(skillConfigs.correcteur.fallback);
    expect(parsed.success).toBe(true);
  });
});
