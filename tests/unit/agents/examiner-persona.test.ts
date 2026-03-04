import { describe, it, expect } from 'vitest';
import {
  resolvePersona,
  injectPersonaIntoPrompt,
  EXAMINER_PERSONAS,
  PERSONA_LABELS,
  ExamPersonaValues,
} from '@/lib/agents/prompts/examiner-persona';

describe('P0-SaaS-1: Examiner Personas', () => {
  describe('resolvePersona', () => {
    it('returns BIENVEILLANT unchanged', () => {
      expect(resolvePersona('BIENVEILLANT')).toBe('BIENVEILLANT');
    });

    it('returns NEUTRE unchanged', () => {
      expect(resolvePersona('NEUTRE')).toBe('NEUTRE');
    });

    it('returns HOSTILE unchanged', () => {
      expect(resolvePersona('HOSTILE')).toBe('HOSTILE');
    });

    it('RANDOM resolves to one of the 3 deterministic personas', () => {
      const valid = ['BIENVEILLANT', 'NEUTRE', 'HOSTILE'];
      for (let i = 0; i < 30; i++) {
        const result = resolvePersona('RANDOM');
        expect(valid).toContain(result);
      }
    });

    it('RANDOM with seed 0 always returns same persona', () => {
      const first = resolvePersona('RANDOM', 0);
      for (let i = 0; i < 10; i++) {
        expect(resolvePersona('RANDOM', 0)).toBe(first);
      }
    });

    it('RANDOM with seed 1 always returns same persona', () => {
      const first = resolvePersona('RANDOM', 1);
      for (let i = 0; i < 10; i++) {
        expect(resolvePersona('RANDOM', 1)).toBe(first);
      }
    });

    it('resolvePersona never returns RANDOM', () => {
      for (let seed = 0; seed < 20; seed++) {
        const result = resolvePersona('RANDOM', seed);
        expect(result).not.toBe('RANDOM');
      }
    });

    it('seed parameter is ignored for non-RANDOM personas', () => {
      expect(resolvePersona('HOSTILE', 42)).toBe('HOSTILE');
      expect(resolvePersona('NEUTRE', 99)).toBe('NEUTRE');
      expect(resolvePersona('BIENVEILLANT', 0)).toBe('BIENVEILLANT');
    });
  });

  describe('injectPersonaIntoPrompt', () => {
    const base = 'Tu es un examinateur EAF.';

    it('appends persona block to base prompt', () => {
      const { prompt, resolvedPersona } = injectPersonaIntoPrompt(base, 'HOSTILE');
      expect(prompt).toContain(base);
      expect(prompt).toContain('--- PERSONA ACTIF ---');
      expect(prompt).toContain('exigeant');
      expect(resolvedPersona).toBe('HOSTILE');
    });

    it('RANDOM resolves and injects correctly', () => {
      const { prompt, resolvedPersona } = injectPersonaIntoPrompt(base, 'RANDOM');
      expect(prompt).toContain('--- PERSONA ACTIF ---');
      expect(['BIENVEILLANT', 'NEUTRE', 'HOSTILE']).toContain(resolvedPersona);
      expect(prompt).toContain(EXAMINER_PERSONAS[resolvedPersona]);
    });

    it('BIENVEILLANT includes encouragement language', () => {
      const { prompt } = injectPersonaIntoPrompt(base, 'BIENVEILLANT');
      expect(prompt).toContain('encourages');
    });
  });

  describe('PERSONA_LABELS', () => {
    it('has labels for all 4 persona types', () => {
      for (const p of ExamPersonaValues) {
        expect(PERSONA_LABELS[p]).toBeDefined();
        expect(PERSONA_LABELS[p].emoji).toBeTruthy();
        expect(PERSONA_LABELS[p].label).toBeTruthy();
        expect(PERSONA_LABELS[p].description).toBeTruthy();
      }
    });
  });

  describe('EXAMINER_PERSONAS', () => {
    it('has prompts for BIENVEILLANT, NEUTRE, HOSTILE', () => {
      expect(Object.keys(EXAMINER_PERSONAS)).toHaveLength(3);
      expect(EXAMINER_PERSONAS.BIENVEILLANT.length).toBeGreaterThan(50);
      expect(EXAMINER_PERSONAS.NEUTRE.length).toBeGreaterThan(50);
      expect(EXAMINER_PERSONAS.HOSTILE.length).toBeGreaterThan(50);
    });
  });
});
