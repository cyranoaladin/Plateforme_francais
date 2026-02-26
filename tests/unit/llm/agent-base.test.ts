import { describe, it, expect } from 'vitest';
import {
  validateAgentOutput,
  sanitizeAgentOutput,
  clampScore,
  isResponseSufficient,
} from '@/lib/llm/agent-base';

describe('validateAgentOutput', () => {
  it('blocks output with http:// URL', () => {
    const result = validateAgentOutput('Voir http://example.com pour plus de détails.');
    expect(result.valid).toBe(false);
    expect(result.urls).toBeDefined();
    expect(result.urls!.length).toBeGreaterThan(0);
  });

  it('blocks output with https:// URL', () => {
    const result = validateAgentOutput('Consulte https://eduscol.education.fr/page');
    expect(result.valid).toBe(false);
    expect(result.urls).toBeDefined();
  });

  it('blocks output with URL in JSON value', () => {
    const result = validateAgentOutput('{"source": "https://wikipedia.org/wiki/EAF"}');
    expect(result.valid).toBe(false);
    expect(result.urls).toBeDefined();
  });

  it('blocks multiple URLs in one output', () => {
    const result = validateAgentOutput(
      'Voir http://a.com et aussi https://b.com pour compléter.',
    );
    expect(result.valid).toBe(false);
    expect(result.urls!.length).toBe(2);
  });

  it('blocks "consulte ce lien"', () => {
    const result = validateAgentOutput('Tu peux consulte ce lien pour en savoir plus.');
    expect(result.valid).toBe(false);
    expect(result.forbiddenPhrases).toBeDefined();
  });

  it('blocks "voir sur eduscol"', () => {
    const result = validateAgentOutput('Tu devrais voir sur eduscol la page méthode.');
    expect(result.valid).toBe(false);
    expect(result.forbiddenPhrases).toBeDefined();
  });

  it('blocks "cherche sur google"', () => {
    const result = validateAgentOutput('Cherche sur google les figures de style.');
    expect(result.valid).toBe(false);
    expect(result.forbiddenPhrases).toBeDefined();
  });

  it('blocks case-insensitive variations', () => {
    const result = validateAgentOutput('CONSULTE CE LIEN pour la méthode.');
    expect(result.valid).toBe(false);
  });

  it('blocks phrase within longer sentence', () => {
    const result = validateAgentOutput(
      'Pour approfondir, je te conseille de consulte ce lien qui explique la méthode du commentaire composé en détail.',
    );
    expect(result.valid).toBe(false);
  });

  it('blocks "je suis une ia"', () => {
    const result = validateAgentOutput('Je suis une IA et je peux t\'aider.');
    expect(result.valid).toBe(false);
    expect(result.forbiddenPhrases).toContain('je suis une ia');
  });

  it('blocks "en tant qu\'intelligence artificielle"', () => {
    const result = validateAgentOutput('En tant qu\'intelligence artificielle, je ne peux pas...');
    expect(result.valid).toBe(false);
  });

  it('allows output with no URLs or forbidden phrases', () => {
    const result = validateAgentOutput(
      'La métaphore est un procédé stylistique qui consiste à établir une comparaison sans outil de comparaison.',
    );
    expect(result.valid).toBe(true);
  });

  it('allows mention of internal sources [Source: ...]', () => {
    const result = validateAgentOutput(
      '[Source: Rapport jury EAF 2023] La lecture expressive est un critère majeur.',
    );
    expect(result.valid).toBe(true);
  });

  it('allows undefined/empty input', () => {
    expect(validateAgentOutput('')).toEqual({ valid: true });
    expect(validateAgentOutput(undefined as unknown as string)).toEqual({ valid: true });
  });

  it('allows null input', () => {
    expect(validateAgentOutput(null as unknown as string)).toEqual({ valid: true });
  });

  it('returns urls array when URLs found', () => {
    const result = validateAgentOutput('Voir https://example.com/page pour info.');
    expect(result.valid).toBe(false);
    expect(result.urls).toEqual(expect.arrayContaining([expect.stringContaining('example.com')]));
  });

  it('returns forbiddenPhrases array when found', () => {
    const result = validateAgentOutput('Tu peux voir sur wikipedia la définition.');
    expect(result.valid).toBe(false);
    expect(result.forbiddenPhrases).toEqual(expect.arrayContaining(['voir sur wikipedia']));
  });
});

describe('sanitizeAgentOutput', () => {
  it('replaces URL with [référence interne]', () => {
    const clean = sanitizeAgentOutput('Voir https://eduscol.education.fr/page pour info.');
    expect(clean).toContain('[référence interne]');
    expect(clean).not.toContain('https://');
  });

  it('replaces forbidden phrase with safe alternative', () => {
    const clean = sanitizeAgentOutput('Tu peux consulte ce lien pour en savoir plus.');
    expect(clean).not.toContain('consulte ce lien');
    expect(clean).toContain('dans les documents de ta base');
  });

  it('handles multiple violations in same output', () => {
    const dirty = 'Consulte ce lien https://example.com et cherche sur google aussi.';
    const clean = sanitizeAgentOutput(dirty);
    expect(clean).not.toContain('https://');
    expect(clean).not.toContain('consulte ce lien');
    expect(clean).not.toContain('cherche sur google');
  });

  it('does not alter clean output', () => {
    const original = 'La métaphore filée est un procédé récurrent chez Baudelaire.';
    expect(sanitizeAgentOutput(original)).toBe(original);
  });
});

describe('clampScore', () => {
  it('clamps negative score to 0', () => {
    expect(clampScore(-5, 20)).toBe(0);
  });

  it('clamps score > max to max', () => {
    expect(clampScore(25, 20)).toBe(20);
  });

  it('preserves valid score', () => {
    expect(clampScore(14, 20)).toBe(14);
  });

  it('rounds to 1 decimal', () => {
    expect(clampScore(7.456, 20)).toBe(7.5);
  });
});

describe('isResponseSufficient', () => {
  it('returns false for output < 50 chars', () => {
    expect(isResponseSufficient('Court.')).toBe(false);
  });

  it('returns true for output >= 50 chars', () => {
    const long = 'La métaphore est une figure de style très utilisée dans la poésie française.';
    expect(isResponseSufficient(long)).toBe(true);
  });

  it('returns false for empty string', () => {
    expect(isResponseSufficient('')).toBe(false);
  });
});
