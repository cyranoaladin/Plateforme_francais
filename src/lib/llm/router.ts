import { MistralProvider, type MistralTier as MistralProviderTier } from '@/lib/llm/adapters/mistral';
import { OllamaProvider } from '@/lib/llm/adapters/ollama';
import { GeminiProvider } from '@/lib/llm/adapters/gemini';
import { OpenAIProvider } from '@/lib/llm/adapters/openai';
import type { LLMProvider, ProviderChatMessage, GenerateContentOptions } from '@/lib/llm/provider';
import { logger } from '@/lib/logger';

export type MistralTier =
  | 'reasoning'
  | 'large'
  | 'standard'
  | 'micro'
  | 'ocr'
  | 'local';

export interface RouterConfig {
  skill: string;
  contextTokens?: number;
  studentId?: string;
  forceProvider?: MistralTier;
  streamingRequired?: boolean;
  hasImageInput?: boolean;
}

export interface SelectedProvider {
  provider: LLMProvider;
  tier: MistralTier;
  model: string;
  providerName: string;
}

type CircuitState = {
  errors: number;
  openUntil: number;
  lastErrorAt: number;
};

const SKILL_ROUTING: Record<string, MistralTier> = {
  // ═══════════════════════════════════════════════════════════════════════════
  // TIER-1: REASONING (magistral-medium-latest)
  // Tâches complexes nécessitant raisonnement multi-axes, analyse approfondie
  // ═══════════════════════════════════════════════════════════════════════════
  correcteur: 'reasoning',
  diagnosticien: 'reasoning',
  avocat_diable: 'reasoning',
  self_reflection: 'reasoning',
  coach_ecrit_correction: 'reasoning',
  coach_oral_final: 'reasoning',
  ecrit_diagnostic: 'reasoning',
  ecrit_baremage: 'reasoning',
  oral_bilan_officiel: 'reasoning',
  examinateur_virtuel: 'reasoning',

  // ═══════════════════════════════════════════════════════════════════════════
  // TIER-1B: LARGE (mistral-large-latest)
  // Analyse multi-textes, comparaisons complexes
  // ═══════════════════════════════════════════════════════════════════════════
  analyse_oeuvre_complete: 'large',
  comparaison_multi_textes: 'large',
  ecrit_essai: 'large',
  ecrit_contraction: 'large',

  // ═══════════════════════════════════════════════════════════════════════════
  // TIER-2: STANDARD (mistral-small-latest)
  // Skills interactifs, coaching, assistance conversationnelle
  // ═══════════════════════════════════════════════════════════════════════════
  tuteur_libre: 'standard',
  bibliothecaire: 'standard',
  coach_oral: 'standard',
  coach_ecrit: 'standard',
  quiz_maitre: 'standard',
  rapport_auto: 'standard',
  langue: 'standard',
  ecrit_langue: 'standard',
  ecrit_plans: 'standard',
  oral_tirage: 'standard',
  coach_lecture: 'standard',
  coach_explication: 'standard',
  oral_entretien: 'standard',
  grammaire_ciblee: 'standard',
  oral_prep30: 'standard',
  pastiche: 'standard',
  quiz_adaptatif: 'standard',
  revision_fiches: 'standard',
  citations_procedes: 'standard',
  carnet_lecture: 'standard',
  support_produit: 'standard',

  // ═══════════════════════════════════════════════════════════════════════════
  // TIER-3: MICRO (ministral-8b-latest)
  // Tâches légères, faible charge, réponses courtes
  // ═══════════════════════════════════════════════════════════════════════════
  planner: 'micro',
  student_modeler: 'micro',
  rappel_agent: 'micro',
  quiz_simple: 'micro',
  reformulation: 'micro',
  suggestion_parcours: 'micro',
  summary_session: 'micro',
  validation_grammaticale: 'micro',
  notification_content: 'micro',
  spaced_repetition: 'micro',
  sr_planner: 'micro',

  // ═══════════════════════════════════════════════════════════════════════════
  // TIER-OCR (mistral-ocr-latest)
  // Lecture et extraction de texte depuis images/PDF
  // ═══════════════════════════════════════════════════════════════════════════
  ocr_copie: 'ocr',
};

const providerCache = new Map<string, LLMProvider>();
const circuitBreakers = new Map<MistralTier, CircuitState>();
const CIRCUIT_WINDOW_MS = 5 * 60_000;
const CIRCUIT_THRESHOLD = 3;

const circuitFallback: Record<MistralTier, MistralTier> = {
  reasoning: 'large',
  large: 'standard',
  standard: 'micro',
  micro: 'local',
  ocr: 'local',
  local: 'local',
};

function routerEnabled() {
  const configured = process.env.LLM_ROUTER_ENABLED?.trim().toLowerCase();
  const forceLocal = process.env.LLM_FORCE_LOCAL === 'true';

  // In production, if Mistral is configured we should not silently fall back
  // to Ollama because of an accidental .env.local override.
  if (process.env.NODE_ENV === 'production' && hasMistralApiKey() && !forceLocal) {
    if (configured === 'false') {
      logger.warn({}, '[Router] Ignoring LLM_ROUTER_ENABLED=false in production because Mistral is available. Set LLM_FORCE_LOCAL=true to force Ollama.');
    }
    return true;
  }

  return configured === 'true';
}

function hasMistralApiKey() {
  return Boolean(process.env.MISTRAL_API_KEY && process.env.MISTRAL_API_KEY.trim().length > 0);
}

function getTierForContext(skill: string, baseTier: MistralTier, contextTokens?: number): MistralTier {
  const tokens = contextTokens ?? 0;
  let tier = baseTier;

  if (tokens > 100_000 && tier === 'reasoning') {
    tier = 'large';
    logger.warn({ skill, contextTokens: tokens }, '[Router] Contexte > 100k : reasoning -> large');
  }

  if (tokens > 8_000 && tier === 'micro') {
    tier = 'standard';
    logger.info({ skill, contextTokens: tokens }, '[Router] Contexte > 8k : micro -> standard');
  }

  return tier;
}

function modelForTier(tier: MistralTier): string {
  if (tier === 'reasoning') return MistralProvider.MODELS.REASONING;
  if (tier === 'large') return MistralProvider.MODELS.LARGE;
  if (tier === 'standard') return MistralProvider.MODELS.SMALL;
  if (tier === 'micro') return MistralProvider.MODELS.MICRO;
  if (tier === 'ocr') return MistralProvider.MODELS.OCR;
  return process.env.OLLAMA_MODEL ?? 'qwen2.5:7b';
}

function getOrCreateMistralProvider(tier: MistralProviderTier): MistralProvider {
  const key = `mistral:${tier}:${modelForTier(
    tier === 'small' ? 'standard' : tier,
  )}`;

  const cached = providerCache.get(key);
  if (cached) {
    return cached as MistralProvider;
  }

  const provider = MistralProvider.createForTier(tier);
  providerCache.set(key, provider);
  return provider;
}

function getOrCreateOllamaProvider(): OllamaProvider {
  const key = `ollama:${process.env.OLLAMA_MODEL ?? 'qwen2.5:7b'}`;
  const cached = providerCache.get(key);
  if (cached) {
    return cached as OllamaProvider;
  }
  const provider = new OllamaProvider();
  providerCache.set(key, provider);
  return provider;
}

export function estimateTokens(messages: { content: string }[]): number {
  const totalChars = messages.reduce((sum, msg) => sum + msg.content.length, 0);
  // Based on audit P0-07: use 3.5 chars/token and 1.2 safety margin
  return Math.ceil((totalChars / 3.5) * 1.2);
}

export function getTierForSkill(skill: string): MistralTier {
  return SKILL_ROUTING[skill] ?? 'standard';
}

export function isCircuitOpen(tier: MistralTier): boolean {
  const state = circuitBreakers.get(tier);
  if (!state) return false;
  return state.openUntil > Date.now();
}

export function recordProviderSuccess(tier: MistralTier): void {
  circuitBreakers.delete(tier);
}

export function recordProviderError(tier: MistralTier): void {
  const now = Date.now();
  const current = circuitBreakers.get(tier);
  if (!current || now - current.lastErrorAt > CIRCUIT_WINDOW_MS) {
    circuitBreakers.set(tier, { errors: 1, openUntil: 0, lastErrorAt: now });
    return;
  }

  const nextErrors = current.errors + 1;
  const openUntil = nextErrors >= CIRCUIT_THRESHOLD ? now + CIRCUIT_WINDOW_MS : current.openUntil;
  if (nextErrors >= CIRCUIT_THRESHOLD) {
    logger.warn({ tier, openUntil: new Date(openUntil).toISOString() }, '[Router] circuit_breaker_open');
  }

  circuitBreakers.set(tier, {
    errors: nextErrors,
    openUntil,
    lastErrorAt: now,
  });
}

export function resetCircuitBreakers(): void {
  circuitBreakers.clear();
}

export function resetRouterState(): void {
  resetCircuitBreakers();
  providerCache.clear();
}

function providerForTier(tier: MistralTier): SelectedProvider {
  if (tier === 'local') {
    return {
      provider: getOrCreateOllamaProvider(),
      tier,
      model: modelForTier(tier),
      providerName: 'ollama',
    };
  }

  const mistralTier: MistralProviderTier =
    tier === 'standard' ? 'small' : tier;
  const provider = getOrCreateMistralProvider(mistralTier);
  return {
    provider,
    tier,
    model: modelForTier(tier),
    providerName: `mistral_${tier}`,
  };
}

export function selectProvider(config: RouterConfig): SelectedProvider {
  if (!routerEnabled()) {
    return providerForTier('local');
  }

  if (config.forceProvider) {
    logger.info({ tier: config.forceProvider, skill: config.skill }, '[Router] Override forcé');
    return providerForTier(config.forceProvider);
  }

  let tier = getTierForSkill(config.skill);
  tier = getTierForContext(config.skill, tier, config.contextTokens);

  if (config.hasImageInput && tier === 'local') {
    tier = 'micro';
  }

  if (!hasMistralApiKey() && tier !== 'local') {
    logger.warn({ tier, skill: config.skill }, '[Router] MISTRAL_API_KEY absente -> fallback Ollama');
    tier = 'local';
  }

  while (isCircuitOpen(tier)) {
    const nextTier = circuitFallback[tier];
    if (nextTier === tier) break;
    tier = nextTier;
  }

  return providerForTier(tier);
}

// ═══════════════════════════════════════════════════════════════════════════
// FALLBACK MULTI-LLM EN CASCADE AVEC TIMEOUT
// Ordre de priorité : Gemini → OpenAI → Mistral → Ollama (local)
// ═══════════════════════════════════════════════════════════════════════════

interface LLMRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

interface LLMResponse {
  content: string;
  provider: string;
  latencyMs: number;
}

const LLM_TIMEOUT_MS = Number(process.env.LLM_TIMEOUT_MS ?? '15000');
const LLM_PROVIDER_ORDER = (process.env.LLM_PROVIDER_ORDER ?? 'gemini,openai,mistral,ollama')
  .split(',')
  .map((s) => s.trim()) as string[];

async function callWithTimeout(
  fn: () => Promise<string>,
  timeoutMs: number,
  providerName: string,
): Promise<string> {
  return Promise.race([
    fn(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${providerName} timeout after ${timeoutMs}ms`)), timeoutMs),
    ),
  ]);
}

export async function routeLLM(req: LLMRequest): Promise<LLMResponse> {
  for (const providerName of LLM_PROVIDER_ORDER) {
    const start = Date.now();
    try {
      let content: string;

      if (providerName === 'gemini' && process.env.GEMINI_API_KEY) {
        const gemini = new GeminiProvider(process.env.GEMINI_API_KEY);
        const messages = req.systemPrompt
          ? [{ role: 'system' as const, content: req.systemPrompt }, { role: 'user' as const, content: req.prompt }]
          : [{ role: 'user' as const, content: req.prompt }];
        const result = await callWithTimeout(
          () => gemini.generateContent(messages, { maxTokens: req.maxTokens, temperature: req.temperature }).then((r) => r.text),
          LLM_TIMEOUT_MS,
          'gemini',
        );
        content = result;
      } else if (providerName === 'openai' && process.env.OPENAI_API_KEY) {
        const openai = new OpenAIProvider(process.env.OPENAI_API_KEY);
        const messages = req.systemPrompt
          ? [{ role: 'system' as const, content: req.systemPrompt }, { role: 'user' as const, content: req.prompt }]
          : [{ role: 'user' as const, content: req.prompt }];
        const result = await callWithTimeout(
          () => openai.generateContent(messages, { maxTokens: req.maxTokens, temperature: req.temperature }).then((r) => r.text),
          LLM_TIMEOUT_MS,
          'openai',
        );
        content = result;
      } else if (providerName === 'mistral' && process.env.MISTRAL_API_KEY) {
        const mistral = MistralProvider.createForTier('small');
        const messages = req.systemPrompt
          ? [{ role: 'system' as const, content: req.systemPrompt }, { role: 'user' as const, content: req.prompt }]
          : [{ role: 'user' as const, content: req.prompt }];
        const result = await callWithTimeout(
          () => mistral.generateContent(messages, { maxTokens: req.maxTokens, temperature: req.temperature }).then((r) => r.text),
          LLM_TIMEOUT_MS,
          'mistral',
        );
        content = result;
      } else if (providerName === 'ollama') {
        const ollama = getOrCreateOllamaProvider();
        const messages = req.systemPrompt
          ? [{ role: 'system' as const, content: req.systemPrompt }, { role: 'user' as const, content: req.prompt }]
          : [{ role: 'user' as const, content: req.prompt }];
        const result = await callWithTimeout(
          () => ollama.generateContent(messages, { maxTokens: req.maxTokens, temperature: req.temperature }).then((r) => r.text),
          LLM_TIMEOUT_MS,
          'ollama',
        );
        content = result;
      } else {
        // Provider not configured, skip to next
        continue;
      }

      const latencyMs = Date.now() - start;
      logger.info({ provider: providerName, latencyMs }, 'llm.route.success');
      return { content, provider: providerName, latencyMs };
    } catch (err) {
      logger.warn(
        { provider: providerName, err, latencyMs: Date.now() - start },
        `llm.route.failed - trying next provider`,
      );
      // Continue to next provider
    }
  }

  logger.error({ providers: LLM_PROVIDER_ORDER }, 'llm.route.all_providers_failed');
  throw new Error('All LLM providers failed. Please try again later.');
}

export async function getRouterProvider(skill: string, contextTokens?: number): Promise<LLMProvider> {
  if (!routerEnabled()) {
    return getOrCreateOllamaProvider();
  }

  const selected = selectProvider({ skill, contextTokens });
  
  // Use multi-provider fallback with timeout BY DEFAULT (activé sauf si explicitement désactivé)
  const useMultiProviderFallback = process.env.LLM_MULTI_PROVIDER_FALLBACK !== 'false';
  
  if (useMultiProviderFallback) {
    // Return a wrapped provider that uses the cascade fallback
    return {
      async generateContent(promptOrMessages: string | ProviderChatMessage[], options?: GenerateContentOptions) {
        const prompt = typeof promptOrMessages === 'string' ? promptOrMessages : promptOrMessages.map((m) => m.content).join('\n');
        const response = await routeLLM({ 
          prompt, 
          systemPrompt: typeof promptOrMessages === 'string' ? undefined : promptOrMessages.find((m) => m.role === 'system')?.content,
          maxTokens: options?.maxTokens,
          temperature: options?.temperature,
        });
        return { text: response.content, content: response.content, model: response.provider, usage: { latencyMs: response.latencyMs } };
      },
      async getEmbeddings(text: string) {
        // Fallback to Mistral for embeddings
        const mistral = MistralProvider.createForTier('small');
        return mistral.getEmbeddings(text);
      },
    };
  }

  // Original behavior: try providers in order without timeout
  const providers: { name: string; create: () => LLMProvider }[] = [
    { name: 'Gemini', create: () => new GeminiProvider(process.env.GEMINI_API_KEY ?? '') },
    { name: 'OpenAI', create: () => new OpenAIProvider(process.env.OPENAI_API_KEY ?? '') },
    { name: 'Mistral', create: () => selected.provider },
    { name: 'Ollama', create: () => getOrCreateOllamaProvider() }
  ];

  for (const { name, create } of providers) {
    try {
      // Skip if API key is missing
      if (name === 'Gemini' && !process.env.GEMINI_API_KEY) continue;
      if (name === 'OpenAI' && !process.env.OPENAI_API_KEY) continue;

      const provider = create();
      logger.info({ skill, providerName: name }, `[Router] Provider sélectionné : ${name}`);
      return provider;
    } catch (error) {
      logger.warn({ skill, providerName: name, error }, `[Router] Échec du provider ${name}, passage au suivant...`);
    }
  }

  logger.warn({ skill }, '[Router] Tous les providers distants ont échoué, fallback sur Ollama local.');
  return getOrCreateOllamaProvider();
}
