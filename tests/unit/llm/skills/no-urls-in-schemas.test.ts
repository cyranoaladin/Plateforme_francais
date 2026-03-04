import { describe, it, expect } from 'vitest';
import { skillConfigs } from '@/lib/llm/skills';

describe('Skill schemas must NOT require URL fields', () => {
  const SUSPICIOUS_SKILLS = ['tuteur_libre', 'bibliothecaire', 'coach_oral', 'coach_ecrit'] as const;

  for (const skillName of SUSPICIOUS_SKILLS) {
    it(`${skillName} fallback must NOT contain any URL values`, () => {
      const config = skillConfigs[skillName];
      expect(config).toBeDefined();
      const fallback = config.fallback;
      const json = JSON.stringify(fallback);
      expect(json).not.toMatch(/https?:\/\//);
      expect(json).not.toContain('"url"');
    });

    it(`${skillName} prompt must NOT instruct LLM to generate URLs`, () => {
      const config = skillConfigs[skillName];
      expect(config).toBeDefined();
      const prompt = config.prompt;
      expect(prompt.toLowerCase()).not.toContain('https://');
      expect(prompt.toLowerCase()).not.toMatch(/\burl:/);
      expect(prompt.toLowerCase()).not.toMatch(/\blien:/);
    });
  }

  it('tuteur_libre schema accepts source_interne instead of url', () => {
    const config = skillConfigs['tuteur_libre'];
    const parsed = config.outputSchema.safeParse({
      answer: 'Voici une explication sur la métaphore.',
      citations: [{ title: 'Rapport jury EAF', source_interne: 'Rapport jury EAF 2023 p.14', extrait: 'La métaphore est...' }],
      suggestions: ['Souhaites-tu un exercice sur les figures de style ?'],
    });
    expect(parsed.success).toBe(true);
  });

  it('tuteur_libre schema rejects citation with url field', () => {
    const config = skillConfigs['tuteur_libre'];
    const parsed = config.outputSchema.safeParse({
      answer: 'test',
      citations: [{ title: 'test', url: 'https://example.com', source: 'test' }],
      suggestions: [],
    });
    expect(parsed.success).toBe(false);
  });

  it('bibliothecaire schema accepts source_interne instead of url', () => {
    const config = skillConfigs['bibliothecaire'];
    const parsed = config.outputSchema.safeParse({
      answer: 'Voici les ressources trouvées.',
      citations: [{ title: 'Programme BO 2025', source_interne: 'BO spécial n°1 2025', excerpt: 'Les objets d\'étude...' }],
      nextSteps: ['Consulter la fiche sur Baudelaire'],
    });
    expect(parsed.success).toBe(true);
  });

  it('bibliothecaire schema rejects citation with url field', () => {
    const config = skillConfigs['bibliothecaire'];
    const parsed = config.outputSchema.safeParse({
      answer: 'test',
      citations: [{ title: 'test', url: 'https://example.com', excerpt: 'test' }],
      nextSteps: [],
    });
    expect(parsed.success).toBe(false);
  });
});
