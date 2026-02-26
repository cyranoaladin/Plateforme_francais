import { describe, it, expect } from 'vitest';
import { validateAgentOutput, sanitizeAgentOutput } from '@/lib/llm/agent-base';
import { skillConfigs } from '@/lib/llm/skills';

describe('Orchestrator guardrail integration', () => {
  it('rejects output containing eduscol URL', () => {
    const output = 'Consulte https://eduscol.education.fr/french pour en savoir plus.';
    const result = validateAgentOutput(output);
    expect(result.valid).toBe(false);
    expect(result.urls).toBeDefined();
    expect(result.urls!.some((u: string) => u.includes('eduscol'))).toBe(true);
  });

  it('rejects output containing wikipedia URL', () => {
    const output = 'Tu peux voir la définition sur https://fr.wikipedia.org/wiki/Métaphore.';
    const result = validateAgentOutput(output);
    expect(result.valid).toBe(false);
  });

  it('sanitizeAgentOutput makes output valid after sanitization', () => {
    const dirty = 'Voir sur Wikipedia pour plus de détails et consulte ce lien pour la suite.';
    const clean = sanitizeAgentOutput(dirty);
    const recheck = validateAgentOutput(clean);
    expect(recheck.valid).toBe(true);
  });

  it('sanitizeAgentOutput handles URL + forbidden phrase combo', () => {
    const dirty = 'Consulte ce lien https://example.com/page pour comprendre la méthode.';
    const clean = sanitizeAgentOutput(dirty);
    expect(clean).not.toContain('https://');
    expect(clean).not.toContain('consulte ce lien');
    const recheck = validateAgentOutput(clean);
    expect(recheck.valid).toBe(true);
  });

  it('rejects output where LLM identifies as AI', () => {
    const output = 'Je suis une IA spécialisée dans l\'EAF et je peux t\'aider.';
    const result = validateAgentOutput(output);
    expect(result.valid).toBe(false);
    expect(result.forbiddenPhrases).toBeDefined();
  });

  it('accepts output where LLM identifies as coach', () => {
    const output = 'Je suis ton coach EAF, là pour t\'aider à préparer ton oral et ton écrit.';
    const result = validateAgentOutput(output);
    expect(result.valid).toBe(true);
  });

  it('schema with url field causes systematic fallback (regression test for BUG-01)', () => {
    const config = skillConfigs['tuteur_libre'];
    const parsed = config.outputSchema.safeParse({
      answer: 'test',
      citations: [{ title: 'test', source_interne: 'RAG', extrait: 'extrait' }],
      suggestions: ['suite'],
    });
    expect(parsed.success).toBe(true);
  });

  it('tuteur_libre schema rejects old url-based citation format', () => {
    const config = skillConfigs['tuteur_libre'];
    const parsed = config.outputSchema.safeParse({
      answer: 'test',
      citations: [{ title: 'test', source: 'test', url: 'https://example.com' }],
      suggestions: [],
    });
    expect(parsed.success).toBe(false);
  });

  it('bibliothecaire schema accepts new source_interne format', () => {
    const config = skillConfigs['bibliothecaire'];
    const parsed = config.outputSchema.safeParse({
      answer: 'Réponse documentaire.',
      citations: [{ title: 'BO 2025', source_interne: 'BO spécial n°1', excerpt: 'Les objets d\'étude...' }],
      nextSteps: ['Lire la fiche Baudelaire'],
    });
    expect(parsed.success).toBe(true);
  });

  it('oral_tirage schema requires auteur and objEtude', () => {
    const config = skillConfigs['oral_tirage'];
    const withoutAuteur = config.outputSchema.safeParse({
      oeuvre: 'Les Fleurs du Mal',
      extrait: 'Hypocrite lecteur...',
      questionGrammaire: { question: 'Nature de "mon"', type: 'nature', phraseCible: 'mon semblable' },
      parcours: 'Alchimie poétique',
      consignes: 'Préparez une explication linéaire.',
    });
    expect(withoutAuteur.success).toBe(false);

    const withAuteur = config.outputSchema.safeParse({
      oeuvre: 'Les Fleurs du Mal',
      auteur: 'Charles Baudelaire',
      objEtude: 'La poésie du XIXe siècle au XXIe siècle',
      extrait: 'Hypocrite lecteur...',
      questionGrammaire: { question: 'Nature de "mon"', type: 'nature', phraseCible: 'mon semblable' },
      parcours: 'Alchimie poétique',
      consignes: 'Préparez une explication linéaire.',
    });
    expect(withAuteur.success).toBe(true);
  });
});
