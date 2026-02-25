import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  isCircuitOpen,
  recordProviderError,
  recordProviderSuccess,
  resetCircuitBreakers,
  selectProvider,
} from '@/lib/llm/router';

describe('Router V2 — 5 tiers Mistral', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.LLM_ROUTER_ENABLED = 'true';
    process.env.MISTRAL_API_KEY = 'test-key';
    resetCircuitBreakers();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    resetCircuitBreakers();
  });

  describe('Routing de base', () => {
    it('correcteur -> tier reasoning (magistral-medium)', () => {
      const result = selectProvider({ skill: 'correcteur' });
      expect(result.tier).toBe('reasoning');
      expect(result.model).toContain('magistral');
    });

    it('tuteur_libre -> tier standard (mistral-small)', () => {
      const result = selectProvider({ skill: 'tuteur_libre' });
      expect(result.tier).toBe('standard');
      expect(result.model).toContain('mistral-small');
    });

    it('quiz_simple -> tier micro (ministral-8b)', () => {
      const result = selectProvider({ skill: 'quiz_simple' });
      expect(result.tier).toBe('micro');
      expect(result.model).toContain('ministral-8b');
    });

    it('skill inconnu -> tier standard', () => {
      const result = selectProvider({ skill: 'skill_inexistant' });
      expect(result.tier).toBe('standard');
    });
  });

  describe('Dégradation par taille de contexte', () => {
    it('correcteur + 110k -> large', () => {
      const result = selectProvider({ skill: 'correcteur', contextTokens: 110_000 });
      expect(result.tier).toBe('large');
    });

    it('correcteur + 80k -> reste reasoning', () => {
      const result = selectProvider({ skill: 'correcteur', contextTokens: 80_000 });
      expect(result.tier).toBe('reasoning');
    });

    it('quiz_simple + 10k -> standard', () => {
      const result = selectProvider({ skill: 'quiz_simple', contextTokens: 10_000 });
      expect(result.tier).toBe('standard');
    });
  });

  describe('Circuit breaker', () => {
    it('3 erreurs reasoning -> bascule large', () => {
      recordProviderError('reasoning');
      recordProviderError('reasoning');
      recordProviderError('reasoning');
      expect(isCircuitOpen('reasoning')).toBe(true);
      const result = selectProvider({ skill: 'correcteur' });
      expect(result.tier).toBe('large');
    });

    it('success reset circuit', () => {
      recordProviderError('reasoning');
      recordProviderSuccess('reasoning');
      expect(isCircuitOpen('reasoning')).toBe(false);
    });
  });
});
