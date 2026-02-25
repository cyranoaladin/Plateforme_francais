import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  selectProvider,
  getTierForSkill,
  resetCircuitBreakers,
  resetRouterState,
  recordProviderError,
  recordProviderSuccess,
  isCircuitOpen,
} from '@/lib/llm/router';

// Mock the adapters to avoid real API calls
vi.mock('@/lib/llm/adapters/mistral', () => ({
  MistralProvider: {
    MODELS: {
      REASONING: 'mistral-reasoning-latest',
      LARGE: 'mistral-large-latest',
      SMALL: 'mistral-small-latest',
      MICRO: 'mistral-micro-latest',
      OCR: 'mistral-ocr-latest',
    },
    createForTier: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({ text: 'test' }),
      complete: vi.fn().mockResolvedValue({ content: 'test' }),
    }),
  },
}));

vi.mock('@/lib/llm/adapters/ollama', () => {
  class MockOllamaProvider {
    generateContent = vi.fn().mockResolvedValue({ text: 'test' });
    complete = vi.fn().mockResolvedValue({ content: 'test' });
  }
  return { OllamaProvider: MockOllamaProvider };
});

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe('Routage par tier — getTierForSkill', () => {
  beforeEach(() => {
    resetRouterState();
  });

  describe('Tier reasoning/large — tâches complexes', () => {
    it.each([
      'diagnosticien',
      'correcteur',
      'avocat_diable',
      'self_reflection',
    ])('skill "%s" → reasoning', (skill) => {
      expect(getTierForSkill(skill)).toBe('reasoning');
    });
  });

  describe('Tier standard — tâches interactives', () => {
    it.each([
      'coach_ecrit',
      'coach_oral',
      'quiz_maitre',
      'tuteur_libre',
      'bibliothecaire',
      'rapport_auto',
      'langue',
    ])('skill "%s" → standard', (skill) => {
      expect(getTierForSkill(skill)).toBe('standard');
    });
  });

  describe('Tier micro — tâches légères', () => {
    it.each([
      'rappel_agent',
      'planner',
      'student_modeler',
    ])('skill "%s" → micro', (skill) => {
      expect(getTierForSkill(skill)).toBe('micro');
    });
  });

  it('retourne standard par défaut pour un skill inconnu', () => {
    expect(getTierForSkill('skill_inconnu')).toBe('standard');
  });
});

describe('selectProvider', () => {
  beforeEach(() => {
    resetRouterState();
    vi.stubEnv('LLM_ROUTER_ENABLED', 'true');
    vi.stubEnv('MISTRAL_API_KEY', 'test-key-xxx');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('retourne un SelectedProvider avec provider et tier pour diagnosticien', () => {
    const result = selectProvider({ skill: 'diagnosticien', contextTokens: 500 });
    expect(result).toHaveProperty('provider');
    expect(result).toHaveProperty('tier');
    expect(result).toHaveProperty('model');
    expect(result.tier).toBe('reasoning');
  });

  it('le tier du provider rappel_agent est micro', () => {
    const result = selectProvider({ skill: 'rappel_agent', contextTokens: 100 });
    expect(result.tier).toBe('micro');
  });

  it('fallback vers local si MISTRAL_API_KEY absente', () => {
    vi.stubEnv('MISTRAL_API_KEY', '');
    const result = selectProvider({ skill: 'diagnosticien', contextTokens: 500 });
    expect(result.tier).toBe('local');
  });

  it('fallback vers local si router désactivé', () => {
    vi.stubEnv('LLM_ROUTER_ENABLED', 'false');
    const result = selectProvider({ skill: 'diagnosticien', contextTokens: 500 });
    expect(result.tier).toBe('local');
  });
});

describe('Circuit breaker', () => {
  beforeEach(() => {
    resetRouterState();
  });

  it('circuit fermé par défaut', () => {
    expect(isCircuitOpen('reasoning')).toBe(false);
  });

  it('circuit ouvert après 3 erreurs consécutives', () => {
    for (let i = 0; i < 3; i++) {
      recordProviderError('reasoning');
    }
    expect(isCircuitOpen('reasoning')).toBe(true);
  });

  it('réinitialisation via recordProviderSuccess', () => {
    for (let i = 0; i < 3; i++) recordProviderError('reasoning');
    expect(isCircuitOpen('reasoning')).toBe(true);
    recordProviderSuccess('reasoning');
    expect(isCircuitOpen('reasoning')).toBe(false);
  });

  it('tier ouvert → fallback au tier suivant via selectProvider', () => {
    vi.stubEnv('LLM_ROUTER_ENABLED', 'true');
    vi.stubEnv('MISTRAL_API_KEY', 'test-key-xxx');
    for (let i = 0; i < 3; i++) recordProviderError('reasoning');
    const result = selectProvider({ skill: 'diagnosticien', contextTokens: 500 });
    // reasoning open → fallback to large
    expect(result.tier).toBe('large');
    vi.unstubAllEnvs();
  });

  it('resetCircuitBreakers remet tout à zéro', () => {
    for (let i = 0; i < 3; i++) recordProviderError('reasoning');
    expect(isCircuitOpen('reasoning')).toBe(true);
    resetCircuitBreakers();
    expect(isCircuitOpen('reasoning')).toBe(false);
  });
});
