import { MistralProvider, type MistralTier as MistralProviderTier } from '@/lib/llm/adapters/mistral';
import { OllamaProvider } from '@/lib/llm/adapters/ollama';
import type { LLMProvider } from '@/lib/llm/provider';
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
  return process.env.LLM_ROUTER_ENABLED === 'true';
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
  return process.env.OLLAMA_MODEL ?? 'llama3.1:70b';
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
  const key = `ollama:${process.env.OLLAMA_MODEL ?? 'llama3.1:70b'}`;
  const cached = providerCache.get(key);
  if (cached) {
    return cached as OllamaProvider;
  }
  const provider = new OllamaProvider();
  providerCache.set(key, provider);
  return provider;
}

export function estimateTokens(messages: { content: string }[]): number {
  return messages.reduce((sum, msg) => sum + Math.ceil(msg.content.length / 4), 0);
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

export function getRouterProvider(skill: string, contextTokens?: number): LLMProvider {
  return selectProvider({ skill, contextTokens }).provider;
}
