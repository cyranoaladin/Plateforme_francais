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
