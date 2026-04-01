import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { transcribeAudio } from '@/lib/stt/transcriber';

describe('transcribeAudio', () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('applique un AbortSignal sur Whisper', async () => {
    process.env.OPENAI_API_KEY = 'openai-test';
    process.env.LLM_TIMEOUT_MS = '32000';

    global.fetch = (vi.fn(async () => ({
      ok: true,
      text: async () => 'transcription ok',
    })) as unknown) as typeof fetch;

    const result = await transcribeAudio(Buffer.from('audio'), 'audio/webm');

    expect(result).toBe('transcription ok');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/audio/transcriptions',
      expect.objectContaining({
        method: 'POST',
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it('applique un AbortSignal sur le endpoint STT Mistral compatible', async () => {
    delete process.env.OPENAI_API_KEY;
    process.env.MISTRAL_API_KEY = 'mistral-test';
    process.env.MISTRAL_STT_ENDPOINT = 'https://stt.example.test';
    process.env.LLM_TIMEOUT_MS = '32000';

    global.fetch = (vi.fn(async () => ({
      ok: true,
      json: async () => ({ text: 'texte transcrit' }),
    })) as unknown) as typeof fetch;

    const result = await transcribeAudio(Buffer.from('audio'), 'audio/webm');

    expect(result).toBe('texte transcrit');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://stt.example.test',
      expect.objectContaining({
        method: 'POST',
        signal: expect.any(AbortSignal),
      }),
    );
  });
});
