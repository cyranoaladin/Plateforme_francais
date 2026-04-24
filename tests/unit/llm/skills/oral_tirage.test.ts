import { describe, it, expect } from 'vitest';
import { oralTirageSkill } from '@/lib/llm/skills/oral-tirage';

describe('oralTirageSkill — hiérarchie des sources', () => {
  it('contient la hiérarchie des sources dans le prompt', () => {
    expect(oralTirageSkill.prompt).toContain('HIÉRARCHIE DES SOURCES');
  });

  it('place le descriptif personnel AVANT le programme officiel', () => {
    const promptText = oralTirageSkill.prompt;
    const idxDescriptif = promptText.indexOf('DESCRIPTIF PERSONNEL');
    const idxProgramme = promptText.indexOf('PROGRAMME OFFICIEL');
    expect(idxDescriptif).toBeGreaterThan(-1);
    expect(idxProgramme).toBeGreaterThan(-1);
    expect(idxDescriptif).toBeLessThan(idxProgramme);
  });

  it('ne contient plus l\'instruction obsolète imposant le programme officiel uniquement', () => {
    expect(oralTirageSkill.prompt).not.toContain(
      'Tu ne tires que des œuvres appartenant au programme officiel',
    );
    expect(oralTirageSkill.prompt).not.toContain('programme officiel UNIQUEMENT');
  });

  it('prévoit un fallback vers le programme officiel quand le descriptif est vide', () => {
    expect(oralTirageSkill.prompt).toMatch(/fallback|avertissement|signale/i);
  });

  it('le prompt demande de signaler l\'absence de textes personnels dans consignes', () => {
    expect(oralTirageSkill.prompt).toContain('consignes');
    expect(oralTirageSkill.prompt).toMatch(/signal|génér|avertisse/i);
  });

  it('le schema de sortie inclut un champ consignes pour signaler la source', () => {
    const schema = oralTirageSkill.outputSchema as { shape?: Record<string, unknown> };
    expect(schema?.shape).toBeDefined();
    expect('consignes' in (schema.shape ?? {})).toBe(true);
  });

  it('le fallback est défini avec les champs requis', () => {
    const fallback = oralTirageSkill.fallback;
    expect(fallback).toBeDefined();
    expect(typeof fallback?.oeuvre).toBe('string');
    expect(typeof fallback?.consignes).toBe('string');
  });
});
