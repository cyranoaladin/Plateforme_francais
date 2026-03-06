import { describe, it, expect } from 'vitest';

const URL_PATTERN = /https?:\/\/[^\s]+/g;

function stripUrls(text: string): string {
  return text.replace(URL_PATTERN, '[lien supprimé]');
}

function containsUrl(text: string): boolean {
  URL_PATTERN.lastIndex = 0;
  return URL_PATTERN.test(text);
}

function normalizeText(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

describe('Guardrail zéro URL dans les réponses LLM', () => {
  it('détecte une URL http', () => {
    expect(containsUrl("Voir http://example.com pour plus d'infos")).toBe(true);
  });

  it('détecte une URL https', () => {
    expect(containsUrl('Source : https://eduscol.education.fr/ressources')).toBe(true);
  });

  it("n'est pas déclenché par un texte sans URL", () => {
    expect(containsUrl('Rimbaud, poète symboliste, né en 1854.')).toBe(false);
  });

  it("n'est pas déclenché par un texte littéraire normal", () => {
    expect(containsUrl('La proposition subordonnée relative est introduite par le pronom "qui".')).toBe(false);
  });

  it('supprime les URLs d\'un texte', () => {
    const input = 'Voir https://example.com et http://autre.fr pour les détails.';
    const output = stripUrls(input);
    URL_PATTERN.lastIndex = 0;
    expect(output).not.toMatch(/https?:\/\//);
    expect(output).toContain('[lien supprimé]');
  });

  it('les prompts des skills ne contiennent aucune URL', async () => {
    const { grammaireCibleeSkill } = await import('@/lib/llm/skills/oral-grammaire-ciblee');
    const { ecritLangueSkill } = await import('@/lib/llm/skills/ecrit-langue');

    URL_PATTERN.lastIndex = 0;
    expect(grammaireCibleeSkill.prompt).not.toMatch(/https?:\/\//);
    URL_PATTERN.lastIndex = 0;
    expect(ecritLangueSkill.prompt).not.toMatch(/https?:\/\//);
  });

  it('le skill grammaire contient bien les 3 axes du programme', async () => {
    const { grammaireCibleeSkill } = await import('@/lib/llm/skills/oral-grammaire-ciblee');
    const prompt = normalizeText(grammaireCibleeSkill.prompt);
    expect(grammaireCibleeSkill.prompt).toContain('Axe 1');
    expect(grammaireCibleeSkill.prompt).toContain('Axe 2');
    expect(grammaireCibleeSkill.prompt).toContain('Axe 3');
    expect(prompt).toContain('syntaxe');
    expect(prompt).toContain('relations logiques');
    expect(prompt).toContain('systeme verbal');
  });

  it('le skill grammaire mentionne explicitement une contrainte anti-triche', async () => {
    const { grammaireCibleeSkill } = await import('@/lib/llm/skills/oral-grammaire-ciblee');
    const prompt = normalizeText(grammaireCibleeSkill.prompt);
    expect(prompt).toContain('ne jamais fournir');
    expect(prompt).toContain('correction integrale');
  });

  it('le skill ecrit-langue contient les 3 axes programme', async () => {
    const { ecritLangueSkill } = await import('@/lib/llm/skills/ecrit-langue');
    const prompt = normalizeText(ecritLangueSkill.prompt);
    expect(prompt).toContain('syntaxe');
    expect(prompt).toContain('relations logiques');
    expect(prompt).toContain('systeme verbal');
  });

  it('le fallback du skill grammaire ne contient pas d\'URL', async () => {
    const { grammaireCibleeSkill } = await import('@/lib/llm/skills/oral-grammaire-ciblee');
    const fallbackStr = JSON.stringify(grammaireCibleeSkill.fallback);
    URL_PATTERN.lastIndex = 0;
    expect(fallbackStr).not.toMatch(/https?:\/\//);
  });
});
