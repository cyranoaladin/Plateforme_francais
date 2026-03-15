/**
 * STT Transcriber — server-side audio-to-text.
 * Priority: OpenAI Whisper, then optional Mistral-compatible endpoint.
 */

export type TranscribeOptions = {
  language?: string;
  prompt?: string;
};

function extensionFromMimeType(mimeType: string): string {
  const clean = mimeType.split(';')[0].trim();
  const map: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/ogg': 'ogg',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/mp4': 'mp4',
    'audio/x-m4a': 'm4a',
  };
  return map[clean] ?? 'webm';
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string,
  options: TranscribeOptions = {},
): Promise<string | null> {
  const openaiKey = process.env.OPENAI_API_KEY ?? '';
  const mistralKey = process.env.MISTRAL_API_KEY ?? '';

  if (openaiKey) {
    return transcribeWithWhisper(audioBuffer, mimeType, openaiKey, options);
  }

  if (mistralKey && process.env.MISTRAL_STT_ENDPOINT) {
    return transcribeWithMistralSTT(audioBuffer, mimeType, mistralKey, options);
  }

  return null;
}

async function transcribeWithWhisper(
  audioBuffer: Buffer,
  mimeType: string,
  apiKey: string,
  options: TranscribeOptions,
): Promise<string | null> {
  const ext = extensionFromMimeType(mimeType);
  const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });

  const formData = new FormData();
  formData.append('file', blob, `audio.${ext}`);
  formData.append('model', process.env.OPENAI_STT_MODEL ?? 'whisper-1');
  formData.append('language', options.language ?? 'fr');
  if (options.prompt) {
    formData.append('prompt', options.prompt);
  }
  formData.append('response_format', 'text');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Whisper STT error: ${response.status} — ${err}`);
  }

  const text = (await response.text()).trim();
  return text.length > 0 ? text : null;
}

export function getSttCapability(): {
  available: boolean;
  mode: 'full' | 'degraded' | 'unavailable';
  provider: string | null;
  reason?: string;
  userMessage?: string;
} {
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const mistralKey = process.env.MISTRAL_API_KEY?.trim();
  const mistralEndpoint = process.env.MISTRAL_STT_ENDPOINT?.trim();

  if (openaiKey) {
    return { available: true, mode: 'full', provider: 'openai_whisper' };
  }

  if (mistralKey && mistralEndpoint) {
    return { available: true, mode: 'full', provider: 'mistral_stt' };
  }

  return {
    available: false,
    mode: 'unavailable',
    provider: null,
    reason: 'STT_PROVIDER_MISSING',
    userMessage: "Aucun service de transcription vocale n'est configuré.",
  };
}

async function transcribeWithMistralSTT(
  audioBuffer: Buffer,
  mimeType: string,
  apiKey: string,
  options: TranscribeOptions,
): Promise<string | null> {
  const endpoint = process.env.MISTRAL_STT_ENDPOINT;
  if (!endpoint) {
    return null;
  }

  const ext = extensionFromMimeType(mimeType);
  const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });

  const formData = new FormData();
  formData.append('file', blob, `audio.${ext}`);
  formData.append('language', options.language ?? 'fr');
  if (options.prompt) {
    formData.append('prompt', options.prompt);
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { text?: string };
  const text = data.text?.trim() ?? '';
  return text.length > 0 ? text : null;
}
