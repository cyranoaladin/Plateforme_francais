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

describe('requestedVoiceMode / effectiveVoiceMode', () => {
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

  /* ── Safe defaults ── */

  it('env absent → requested=browser, effective=browser', async () => {
    delete process.env.ORAL_VOICE_MODE;
    const caps = await getOralCapabilities();
    expect(caps.requestedVoiceMode).toBe('browser');
    expect(caps.effectiveVoiceMode).toBe('browser');
    expect(caps.voiceMode).toBe('browser');
  });

  it('env empty → requested=browser, effective=browser', async () => {
    process.env.ORAL_VOICE_MODE = '';
    const caps = await getOralCapabilities();
    expect(caps.requestedVoiceMode).toBe('browser');
    expect(caps.effectiveVoiceMode).toBe('browser');
  });

  it('env unknown → requested=browser, effective=browser', async () => {
    process.env.ORAL_VOICE_MODE = 'xyz_invalid';
    const caps = await getOralCapabilities();
    expect(caps.requestedVoiceMode).toBe('browser');
    expect(caps.effectiveVoiceMode).toBe('browser');
  });

  /* ── Explicit browser ── */

  it('env=browser → requested=browser, effective=browser', async () => {
    process.env.ORAL_VOICE_MODE = 'browser';
    const caps = await getOralCapabilities();
    expect(caps.requestedVoiceMode).toBe('browser');
    expect(caps.effectiveVoiceMode).toBe('browser');
  });

  /* ── Server mode with STT OK ── */

  it('env=server + STT OK → requested=server, effective=server', async () => {
    process.env.ORAL_VOICE_MODE = 'server';
    vi.mocked(getSttCapability).mockReturnValue({
      available: true,
      mode: 'full',
      provider: 'openai_whisper',
    });
    const caps = await getOralCapabilities();
    expect(caps.requestedVoiceMode).toBe('server');
    expect(caps.effectiveVoiceMode).toBe('server');
  });

  /* ── Server mode with STT KO — the critical safety case ── */

  it('env=server + STT KO → requested=server, effective=browser (fallback)', async () => {
    process.env.ORAL_VOICE_MODE = 'server';
    vi.mocked(getSttCapability).mockReturnValue({
      available: false,
      mode: 'unavailable',
      provider: null,
    });
    const caps = await getOralCapabilities();
    expect(caps.requestedVoiceMode).toBe('server');
    expect(caps.effectiveVoiceMode).toBe('browser');
    expect(caps.voiceMode).toBe('browser');
  });

  /* ── Auto mode ── */

  it('env=auto + STT OK → requested=auto, effective=server', async () => {
    process.env.ORAL_VOICE_MODE = 'auto';
    vi.mocked(getSttCapability).mockReturnValue({
      available: true,
      mode: 'full',
      provider: 'openai_whisper',
    });
    const caps = await getOralCapabilities();
    expect(caps.requestedVoiceMode).toBe('auto');
    expect(caps.effectiveVoiceMode).toBe('server');
  });

  it('env=auto + STT KO → requested=auto, effective=browser', async () => {
    process.env.ORAL_VOICE_MODE = 'auto';
    vi.mocked(getSttCapability).mockReturnValue({
      available: false,
      mode: 'unavailable',
      provider: null,
    });
    const caps = await getOralCapabilities();
    expect(caps.requestedVoiceMode).toBe('auto');
    expect(caps.effectiveVoiceMode).toBe('browser');
  });
});
