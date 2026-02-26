/**
 * TTS Generator — server-side text-to-speech.
 * Generates audio from jury feedback text for oral simulation immersion.
 * Uses an external TTS API (e.g., ElevenLabs, Azure TTS) or returns null if unavailable.
 */

export type TtsOptions = {
  voice?: string;
  speed?: number;
  format?: 'mp3' | 'opus' | 'wav';
};

/**
 * Generate a TTS audio URL for the given text.
 * Returns a URL pointing to the generated audio file (stored temporarily).
 * Returns null if TTS is not configured.
 */
export async function generateTtsUrl(
  text: string,
  options: TtsOptions = {},
): Promise<string | null> {
  const apiKey = process.env.TTS_API_KEY ?? '';
  const baseUrl = process.env.TTS_API_URL ?? '';

  if (!apiKey || !baseUrl) {
    return null;
  }

  const voice = options.voice ?? 'jury_fr';
  const format = options.format ?? 'mp3';

  const response = await fetch(`${baseUrl}/synthesize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      text: text.slice(0, 2000),
      voice,
      output_format: format,
      speed: options.speed ?? 1.0,
      language: 'fr',
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`TTS API error: ${response.status} ${response.statusText}`);
  }

  const result = (await response.json()) as { audio_url?: string };
  return result.audio_url ?? null;
}
