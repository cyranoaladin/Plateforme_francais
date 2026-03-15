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
  voiceMode: OralVoiceMode;
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

function resolveVoiceMode(): OralVoiceMode {
  const envVal = (process.env.ORAL_VOICE_MODE ?? '').toLowerCase().trim();
  if (envVal === 'browser') return 'browser';
  if (envVal === 'server') return 'server';
  if (envVal === 'auto') {
    const stt = getSttCapability();
    return stt.available ? 'server' : 'browser';
  }
  // ORAL_VOICE_MODE absent or unrecognized → safe default: browser
  // This prevents silent activation of server voice mode in production
  // just because OPENAI_API_KEY exists (it's shared with LLM routing).
  // Operator must explicitly opt in via ORAL_VOICE_MODE=server or auto.
  return 'browser';
}

export async function getOralCapabilities(): Promise<OralCapabilities> {
  return {
    stt: getSttCapability(),
    tts: getTtsCapability(),
    rag: getRagCapability(),
    llm: getLlmCapability(),
    voiceMode: resolveVoiceMode(),
  };
}
