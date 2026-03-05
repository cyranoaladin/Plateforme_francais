import { describe, expect, it } from 'vitest';
import { skillConfigs } from '@/lib/llm/skills';

describe('skill quiz_maitre', () => {
  it('fallback est conforme au schéma', () => {
    const parsed = skillConfigs.quiz_maitre.outputSchema.safeParse(skillConfigs.quiz_maitre.fallback);
    expect(parsed.success).toBe(true);
  });

  it('prompt impose un format QCM exploitable', () => {
    const prompt = skillConfigs.quiz_maitre.prompt.toLowerCase();
    expect(prompt).toContain('qcm');
    expect(prompt).toContain('explication');
  });
});
