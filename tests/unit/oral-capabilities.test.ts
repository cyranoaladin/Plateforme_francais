import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('@/lib/rag/external-client', () => ({
  externalRAG: { isConfigured: vi.fn().mockReturnValue(false) },
}));

vi.mock('@/lib/stt/transcriber', () => ({
  getSttCapability: vi.fn(),
}));

vi.mock('@/lib/tts/generator', () => ({
  getTtsCapability: vi.fn().mockReturnValue({
    available: false,
    mode: 'unavailable',
    provider: null,
  }),
}));

import { getSttCapability } from '@/lib/stt/transcriber';
import { getOralCapabilities } from '@/lib/oral/capabilities';

describe('resolveVoiceMode (via getOralCapabilities)', () => {
  const originalEnv = process.env.ORAL_VOICE_MODE;

  beforeEach(() => {
    delete process.env.ORAL_VOICE_MODE;
    vi.mocked(getSttCapability).mockReturnValue({
      available: true,
      mode: 'full',
      provider: 'openai_whisper',
    });
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.ORAL_VOICE_MODE = originalEnv;
    } else {
      delete process.env.ORAL_VOICE_MODE;
    }
  });

  it('retourne browser quand ORAL_VOICE_MODE est absent (safe default)', async () => {
    delete process.env.ORAL_VOICE_MODE;
    const caps = await getOralCapabilities();
    expect(caps.voiceMode).toBe('browser');
  });

  it('retourne browser quand ORAL_VOICE_MODE=browser', async () => {
    process.env.ORAL_VOICE_MODE = 'browser';
    const caps = await getOralCapabilities();
    expect(caps.voiceMode).toBe('browser');
  });

  it('retourne server quand ORAL_VOICE_MODE=server', async () => {
    process.env.ORAL_VOICE_MODE = 'server';
    const caps = await getOralCapabilities();
    expect(caps.voiceMode).toBe('server');
  });

  it('retourne server quand ORAL_VOICE_MODE=auto et STT disponible', async () => {
    process.env.ORAL_VOICE_MODE = 'auto';
    vi.mocked(getSttCapability).mockReturnValue({
      available: true,
      mode: 'full',
      provider: 'openai_whisper',
    });
    const caps = await getOralCapabilities();
    expect(caps.voiceMode).toBe('server');
  });

  it('retourne browser quand ORAL_VOICE_MODE=auto et STT indisponible', async () => {
    process.env.ORAL_VOICE_MODE = 'auto';
    vi.mocked(getSttCapability).mockReturnValue({
      available: false,
      mode: 'unavailable',
      provider: null,
    });
    const caps = await getOralCapabilities();
    expect(caps.voiceMode).toBe('browser');
  });

  it('retourne browser quand ORAL_VOICE_MODE a une valeur inconnue', async () => {
    process.env.ORAL_VOICE_MODE = 'xyz_invalid';
    const caps = await getOralCapabilities();
    expect(caps.voiceMode).toBe('browser');
  });

  it('retourne browser quand ORAL_VOICE_MODE est une chaîne vide', async () => {
    process.env.ORAL_VOICE_MODE = '';
    const caps = await getOralCapabilities();
    expect(caps.voiceMode).toBe('browser');
  });
});
