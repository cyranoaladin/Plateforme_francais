import { MistralProvider } from '@/lib/llm/adapters/mistral';
import { OllamaProvider } from '@/lib/llm/adapters/ollama';
import { type LLMProvider } from '@/lib/llm/provider';
import { logger } from '@/lib/logger';

// IMPORTANT: getLLMProvider() retourne le provider d'embeddings.
// Embeddings = Mistral (mistral-embed) en priorité, Ollama fallback.
// NE PAS utiliser Gemini/OpenAI pour les embeddings — incompatible avec le vector store pgvector.

let embeddingProviderCache: LLMProvider | null = null;

export function getLLMProvider(): LLMProvider {
  if (embeddingProviderCache) return embeddingProviderCache;

  const hasMistralKey = Boolean(process.env.MISTRAL_API_KEY?.trim());

  if (hasMistralKey) {
    embeddingProviderCache = MistralProvider.createForTier('small');
    logger.info({}, '[factory] embedding provider: mistral-embed');
  } else {
    embeddingProviderCache = new OllamaProvider();
    logger.info({}, '[factory] embedding provider: ollama (fallback)');
  }

  return embeddingProviderCache;
}

export function resetLLMProviderCache() {
  embeddingProviderCache = null;
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
