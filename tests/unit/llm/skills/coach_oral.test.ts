import { describe, expect, it } from 'vitest';
import { skillConfigs } from '@/lib/llm/skills';

describe('skill coach_oral', () => {
  it('impose un output strict avec score borne', () => {
    const parsed = skillConfigs.coach_oral.outputSchema.safeParse({
      feedback: 'Retour détaillé',
      score: 7,
      max: 8,
      points_forts: ['Structure'],
      axes: ['Nuancer'],
      relance: 'Peux-tu citer le texte ?',
    });
    expect(parsed.success).toBe(true);
  });

  it('accepte un score brut (le bornage est géré plus loin dans le service oral)', () => {
    const parsed = skillConfigs.coach_oral.outputSchema.safeParse({
      feedback: 'Retour',
      score: 11,
      max: 8,
      points_forts: [],
      axes: [],
    });
    expect(parsed.success).toBe(true);
  });

  it('prompt cadre une évaluation officielle avec relance', () => {
    const prompt = skillConfigs.coach_oral.prompt.toLowerCase();
    expect(prompt).toContain('critères officiels');
    expect(prompt).toContain('relance');
  });
});
