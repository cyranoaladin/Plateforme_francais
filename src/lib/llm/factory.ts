import { GeminiProvider } from '@/lib/llm/adapters/gemini';
import { OpenAIProvider } from '@/lib/llm/adapters/openai';
import { type LLMProvider } from '@/lib/llm/provider';

export type LLMProviderName = 'gemini' | 'openai';

function resolveProviderName(): LLMProviderName {
  const configured = process.env.LLM_PROVIDER;
  if (configured === 'openai' || configured === 'gemini') {
    return configured;
  }

  return 'gemini';
}

let providerCache: LLMProvider | null = null;

export function getLLMProvider(): LLMProvider {
  if (providerCache) {
    return providerCache;
  }

  const name = resolveProviderName();

  providerCache =
    name === 'openai'
      ? new OpenAIProvider(process.env.OPENAI_API_KEY ?? '')
      : new GeminiProvider(process.env.GEMINI_API_KEY ?? '');

  return providerCache;
}

export function resetLLMProviderCache() {
  providerCache = null;
}

// Re-exports du router Mistral multi-tier.
// Permet aux agents d'importer depuis @/lib/llm/factory (point d'entrée unique).
export {
  getRouterProvider,
  selectProvider,
  estimateTokens,
  getTierForSkill,
  isCircuitOpen,
  recordProviderSuccess,
  recordProviderError,
  resetCircuitBreakers,
  resetRouterState,
} from '@/lib/llm/router';
export type { RouterConfig, SelectedProvider, MistralTier } from '@/lib/llm/router';
