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

export type OralCapabilities = {
  stt: OralCapability;
  tts: OralCapability;
  rag: OralCapability;
  llm: OralCapability;
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

export async function getOralCapabilities(): Promise<OralCapabilities> {
  return {
    stt: getSttCapability(),
    tts: getTtsCapability(),
    rag: getRagCapability(),
    llm: getLlmCapability(),
  };
}
