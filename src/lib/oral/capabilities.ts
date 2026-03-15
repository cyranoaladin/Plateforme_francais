import { externalRAG } from '@/lib/rag/external-client';
import { getSttCapability } from '@/lib/stt/transcriber';
import { getTtsCapability } from '@/lib/tts/generator';

export type CapabilityMode = 'full' | 'degraded' | 'unavailable';

export type OralCapability = {
  available: boolean;
  mode: CapabilityMode;
  provider: string | null;
  reason?: string;
  userMessage?: string;
};

export type OralVoiceMode = 'browser' | 'server' | 'auto';

export type OralCapabilities = {
  stt: OralCapability;
  tts: OralCapability;
  rag: OralCapability;
  llm: OralCapability;
  /** What the operator requested via ORAL_VOICE_MODE env var */
  requestedVoiceMode: OralVoiceMode;
  /** What the system can actually execute given provider availability */
  effectiveVoiceMode: 'browser' | 'server';
  /** @deprecated Use effectiveVoiceMode instead */
  voiceMode: 'browser' | 'server';
};

function getRagCapability(): OralCapability {
  const configured = externalRAG.isConfigured();
  return configured
    ? {
        available: true,
        mode: 'full',
        provider: 'external_rag',
      }
    : {
        available: false,
        mode: 'degraded',
        provider: null,
        reason: 'RAG_API_TOKEN_MISSING',
        userMessage: 'Les références RAG officielles sont momentanément indisponibles.',
      };
}

function getLlmCapability(): OralCapability {
  const hasRemoteProvider = Boolean(
    process.env.MISTRAL_API_KEY?.trim()
      || process.env.OPENAI_API_KEY?.trim()
      || process.env.GEMINI_API_KEY?.trim(),
  );

  if (hasRemoteProvider) {
    return {
      available: true,
      mode: 'full',
      provider: process.env.MISTRAL_API_KEY?.trim()
        ? 'mistral_router'
        : process.env.OPENAI_API_KEY?.trim()
          ? 'openai'
          : 'gemini',
    };
  }

  return {
    available: false,
    mode: 'degraded',
    provider: null,
    reason: 'LLM_REMOTE_PROVIDER_MISSING',
    userMessage: "Le moteur IA distant n'est pas configuré pour cette session.",
  };
}

function getRequestedVoiceMode(): OralVoiceMode {
  const envVal = (process.env.ORAL_VOICE_MODE ?? '').toLowerCase().trim();
  if (envVal === 'browser' || envVal === 'server' || envVal === 'auto') return envVal;
  return 'browser';
}

function resolveEffectiveVoiceMode(requested: OralVoiceMode, sttAvailable: boolean): 'browser' | 'server' {
  if (requested === 'browser') return 'browser';
  if (requested === 'server') return sttAvailable ? 'server' : 'browser';
  if (requested === 'auto') return sttAvailable ? 'server' : 'browser';
  return 'browser';
}

export async function getOralCapabilities(): Promise<OralCapabilities> {
  const stt = getSttCapability();
  const requested = getRequestedVoiceMode();
  const effective = resolveEffectiveVoiceMode(requested, stt.available);

  return {
    stt,
    tts: getTtsCapability(),
    rag: getRagCapability(),
    llm: getLlmCapability(),
    requestedVoiceMode: requested,
    effectiveVoiceMode: effective,
    voiceMode: effective,
  };
}
