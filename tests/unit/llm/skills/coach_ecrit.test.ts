import { describe, expect, it } from 'vitest';
import { skillConfigs } from '@/lib/llm/skills';

describe('skill coach_ecrit', () => {
  it('valide une réponse de coaching écrite complète', () => {
    const parsed = skillConfigs.coach_ecrit.outputSchema.safeParse({
      sujet: 'Sujet test',
      texte: 'Texte support',
      consignes: 'Consignes',
      bareme: { comprehension: 4, analyse: 8, expression: 4, organisation: 4 },
      plan: ['I. Axe 1', 'II. Axe 2'],
      conseils: ['Mieux citer', 'Nuancer la thèse'],
    });
    expect(parsed.success).toBe(true);
  });

  it('fallback respecte le schéma', () => {
    const parsed = skillConfigs.coach_ecrit.outputSchema.safeParse(skillConfigs.coach_ecrit.fallback);
    expect(parsed.success).toBe(true);
  });

  it('prompt interdit la rédaction intégrale', () => {
    const prompt = skillConfigs.coach_ecrit.prompt.toLowerCase();
    expect(prompt.includes('sans') || prompt.includes('ne jamais')).toBe(true);
    expect(prompt).toContain('rédiger');
    expect(prompt).toContain('copie');
  });
});
