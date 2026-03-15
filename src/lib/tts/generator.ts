/**
 * TTS Generator — server-side text-to-speech.
 * Priority: OpenAI TTS (same key as LLM), then custom TTS API.
 * Browser speechSynthesis is used as client-side fallback.
 */

export type TtsResult = {
  audioBuffer: Buffer;
  mimeType: string;
};

export function getTtsCapability(): {
  available: boolean;
  mode: 'full' | 'degraded' | 'unavailable';
  provider: string | null;
  reason?: string;
  userMessage?: string;
} {
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const customKey = process.env.TTS_API_KEY?.trim();
  const customUrl = process.env.TTS_API_URL?.trim();

  if (openaiKey) {
    return { available: true, mode: 'full', provider: 'openai_tts' };
  }

  if (customKey && customUrl) {
    return { available: true, mode: 'full', provider: 'tts_api' };
  }

  return {
    available: false,
    mode: 'unavailable',
    provider: null,
    reason: 'TTS_PROVIDER_MISSING',
    userMessage: "Aucun service de synthèse vocale n'est configuré.",
  };
}

/**
 * Generate TTS audio as a Buffer (for streaming/inline playback).
 * Returns null if no TTS provider is available.
 */
export async function generateTtsAudio(text: string): Promise<TtsResult | null> {
  if (!text.trim()) return null;

  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  if (openaiKey) {
    return generateWithOpenAI(text, openaiKey);
  }

  const customKey = process.env.TTS_API_KEY?.trim();
  const customUrl = process.env.TTS_API_URL?.trim();
  if (customKey && customUrl) {
    return generateWithCustomApi(text, customKey, customUrl);
  }

  return null;
}

/**
 * Legacy function — returns a URL to the generated audio.
 * Kept for backward compatibility with existing callers.
 */
export async function generateTtsUrl(text: string): Promise<string | null> {
  const apiKey = process.env.TTS_API_KEY ?? '';
  const apiUrl = process.env.TTS_API_URL ?? '';

  if (!apiKey || !apiUrl) {
    return null;
  }

  const response = await fetch(`${apiUrl.replace(/\/$/, '')}/v1/tts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      voice: process.env.TTS_VOICE_ID ?? 'fr_female_01',
      format: 'mp3',
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { url?: string; audioUrl?: string };
  const url = payload.url ?? payload.audioUrl ?? null;
  return url && url.trim().length > 0 ? url : null;
}

/* ── OpenAI TTS ── */

async function generateWithOpenAI(text: string, apiKey: string): Promise<TtsResult | null> {
  const model = process.env.OPENAI_TTS_MODEL ?? 'tts-1';
  const voice = process.env.OPENAI_TTS_VOICE ?? 'alloy';

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      voice,
      input: text,
      response_format: 'mp3',
    }),
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    return null;
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    audioBuffer: Buffer.from(arrayBuffer),
    mimeType: 'audio/mpeg',
  };
}

/* ── Custom TTS API ── */

async function generateWithCustomApi(
  text: string,
  apiKey: string,
  apiUrl: string,
): Promise<TtsResult | null> {
  const response = await fetch(`${apiUrl.replace(/\/$/, '')}/v1/tts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      voice: process.env.TTS_VOICE_ID ?? 'fr_female_01',
      format: 'mp3',
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    return null;
  }

  // Custom API may return JSON with URL or raw audio
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('audio/')) {
    const arrayBuffer = await response.arrayBuffer();
    return {
      audioBuffer: Buffer.from(arrayBuffer),
      mimeType: contentType.split(';')[0].trim(),
    };
  }

  // JSON response with URL — fetch the audio
  const payload = (await response.json()) as { url?: string; audioUrl?: string };
  const url = payload.url ?? payload.audioUrl;
  if (!url) return null;

  const audioResp = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!audioResp.ok) return null;

  const arrayBuffer = await audioResp.arrayBuffer();
  return {
    audioBuffer: Buffer.from(arrayBuffer),
    mimeType: audioResp.headers.get('content-type')?.split(';')[0].trim() ?? 'audio/mpeg',
  };
}
