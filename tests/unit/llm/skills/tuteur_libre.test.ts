import { describe, expect, it } from 'vitest';
import { skillConfigs } from '@/lib/llm/skills';

describe('skill tuteur_libre', () => {
  it('fallback est conforme au schéma', () => {
    const parsed = skillConfigs.tuteur_libre.outputSchema.safeParse(skillConfigs.tuteur_libre.fallback);
    expect(parsed.success).toBe(true);
  });

  it('prompt force citations internes et refus de copie complète', () => {
    const prompt = skillConfigs.tuteur_libre.prompt.toLowerCase();
    expect(prompt).toContain('citation');
    expect(prompt).toContain('liens externes');
    expect(prompt).toContain('ne peux pas rédiger');
  });
});
