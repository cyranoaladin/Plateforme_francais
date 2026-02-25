import { describe, it, expect } from 'vitest';
import { skillConfigs, parseSkillOutput, fallbackSkillOutput } from '@/lib/llm/skills';
import { type Skill, skillSchema } from '@/lib/llm/skills/types';

const ALL_SKILLS = skillSchema.options as readonly Skill[];

describe('Agent skill registry', () => {
  it('has 27 registered skills', () => {
    expect(ALL_SKILLS.length).toBe(27);
    expect(Object.keys(skillConfigs).length).toBe(27);
  });

  it('every skill enum value has a matching config', () => {
    for (const skill of ALL_SKILLS) {
      expect(skillConfigs[skill]).toBeDefined();
      expect(skillConfigs[skill].prompt).toBeTruthy();
      expect(skillConfigs[skill].outputSchema).toBeDefined();
      expect(skillConfigs[skill].fallback).toBeDefined();
    }
  });
});

describe('Agent fallback outputs parse against their own schemas', () => {
  it.each(ALL_SKILLS.map((s: Skill) => [s]))('skill "%s" fallback validates', (skill: string) => {
    const fallback = fallbackSkillOutput(skill as Skill);
    expect(() => parseSkillOutput(skill as Skill, fallback)).not.toThrow();
  });
});

describe('Oral agents have correct max scores', () => {
  it('coach_lecture fallback has max=2', () => {
    const fb = fallbackSkillOutput('coach_lecture') as { max: number };
    expect(fb.max).toBe(2);
  });

  it('coach_explication fallback has max=8', () => {
    const fb = fallbackSkillOutput('coach_explication') as { max: number };
    expect(fb.max).toBe(8);
  });

  it('grammaire_ciblee fallback has max=2', () => {
    const fb = fallbackSkillOutput('grammaire_ciblee') as { max: number };
    expect(fb.max).toBe(2);
  });

  it('oral_entretien fallback has max=8', () => {
    const fb = fallbackSkillOutput('oral_entretien') as { max: number };
    expect(fb.max).toBe(8);
  });
});

describe('All agent prompts include anti-triche language', () => {
  const GENERATIVE_SKILLS: Skill[] = [
    'coach_lecture', 'coach_explication', 'grammaire_ciblee', 'oral_entretien',
    'ecrit_diagnostic', 'ecrit_plans', 'ecrit_contraction', 'ecrit_essai',
    'ecrit_langue', 'ecrit_baremage', 'revision_fiches', 'oral_tirage',
  ];

  it.each(GENERATIVE_SKILLS.map((s: Skill) => [s]))('skill "%s" prompt contains anti-triche wording', (skill: string) => {
    const config = skillConfigs[skill as Skill];
    const prompt = config.prompt.toLowerCase();
    const hasAntiTriche = prompt.includes('jamais') || prompt.includes('pas de rédaction') || prompt.includes('ne jamais');
    expect(hasAntiTriche).toBe(true);
  });
});

describe('Citation schema is used in new agents', () => {
  const AGENTS_WITH_CITATIONS: Skill[] = [
    'oral_tirage', 'coach_lecture', 'coach_explication', 'grammaire_ciblee',
    'oral_entretien', 'oral_bilan_officiel', 'ecrit_diagnostic', 'ecrit_plans',
    'ecrit_contraction', 'ecrit_essai', 'ecrit_langue', 'ecrit_baremage',
    'revision_fiches', 'quiz_adaptatif', 'spaced_repetition',
  ];

  it.each(AGENTS_WITH_CITATIONS.map((s: Skill) => [s]))('skill "%s" schema accepts citations field', (skill: string) => {
    const config = skillConfigs[skill as Skill];
    const fallback = { ...config.fallback as Record<string, unknown>, citations: [{ title: 'Test', url: 'https://example.com', snippet: 'Test snippet' }] };
    expect(() => config.outputSchema.parse(fallback)).not.toThrow();
  });
});
