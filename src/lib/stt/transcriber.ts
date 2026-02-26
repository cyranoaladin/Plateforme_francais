/**
 * STT Transcriber — server-side audio-to-text.
 * Priority: OpenAI Whisper → Mistral STT endpoint → null (client uses Web Speech API).
 */

export type TranscribeOptions = {
  language?: string;
  prompt?: string;
};

export type TranscribeResult = {
  text: string;
  confidence?: number;
  durationMs?: number;
};

/**
 * Transcribe an audio buffer to French text.
 * Supports: audio/webm, audio/ogg, audio/wav, audio/mp3, audio/mp4
 * Returns null if no STT service is configured (frontend should use Web Speech API).
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string = 'audio/webm',
  options: TranscribeOptions = {},
): Promise<TranscribeResult | null> {
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

/**
 * Transcribe via OpenAI Whisper API.
 */
async function transcribeWithWhisper(
  audioBuffer: Buffer,
  mimeType: string,
  apiKey: string,
  options: TranscribeOptions,
): Promise<TranscribeResult> {
  const ext = mimeType.split('/')[1]?.split(';')[0] ?? 'webm';
  const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });

  const formData = new FormData();
  formData.append('file', blob, `audio.${ext}`);
  formData.append('model', 'whisper-1');
  formData.append('language', options.language ?? 'fr');
  if (options.prompt) formData.append('prompt', options.prompt);
  formData.append('response_format', 'verbose_json');

  const startedAt = Date.now();
  const baseUrl = process.env.WHISPER_API_URL ?? 'https://api.openai.com/v1';

  const response = await fetch(`${baseUrl}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    throw new Error(`Whisper STT error: ${response.status} ${response.statusText}`);
  }

  const result = (await response.json()) as {
    text?: string;
    duration?: number;
    segments?: Array<{ avg_logprob?: number }>;
  };

  const avgLogProb = result.segments?.[0]?.avg_logprob;
  const confidence = avgLogProb !== undefined ? Math.exp(avgLogProb) : undefined;

  return {
    text: result.text ?? '',
    confidence,
    durationMs: Date.now() - startedAt,
  };
}

/**
 * Transcribe via a Mistral-compatible STT endpoint.
 */
async function transcribeWithMistralSTT(
  audioBuffer: Buffer,
  mimeType: string,
  apiKey: string,
  options: TranscribeOptions,
): Promise<TranscribeResult | null> {
  const endpoint = process.env.MISTRAL_STT_ENDPOINT!;
  const ext = mimeType.split('/')[1]?.split(';')[0] ?? 'webm';
  const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });

  const formData = new FormData();
  formData.append('file', blob, `audio.${ext}`);
  formData.append('language', options.language ?? 'fr');

  const startedAt = Date.now();

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) return null;
  const data = (await response.json()) as { text?: string };
  return {
    text: data.text?.trim() ?? '',
    durationMs: Date.now() - startedAt,
  };
}
