import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';

vi.mock('@/lib/db/client', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    $queryRawUnsafe: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/stt/transcriber', () => ({
  getSttCapability: vi.fn().mockReturnValue({
    available: false,
    mode: 'unavailable',
    provider: null,
  }),
}));

vi.mock('@/lib/tts/generator', () => ({
  getTtsCapability: vi.fn().mockReturnValue({
    available: false,
    mode: 'unavailable',
    provider: null,
  }),
}));

vi.mock('@/lib/queue/correction-queue', () => ({
  getRedisClient: vi.fn().mockReturnValue({
    ping: vi.fn().mockResolvedValue('PONG'),
  }),
}));

vi.mock('@/lib/config/validate-env', () => ({
  validateEnv: vi.fn().mockReturnValue({ required: 'ok', llm: 'ok', recommended: { missing: [] } }),
}));

// Mock global fetch for RAG health check
const originalFetch = globalThis.fetch;
beforeAll(() => {
  globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });
});
afterAll(() => {
  globalThis.fetch = originalFetch;
});

import { GET } from '@/app/api/v1/health/route';
import { getSttCapability } from '@/lib/stt/transcriber';

describe('GET /api/v1/health', () => {
  const origBuildSha = process.env.BUILD_GIT_SHA;
  const origBuildTime = process.env.BUILD_TIME;
  const origVoiceMode = process.env.ORAL_VOICE_MODE;

  beforeEach(() => {
    process.env.BUILD_GIT_SHA = 'abc1234';
    process.env.BUILD_TIME = '2026-03-15T18:00:00.000Z';
    delete process.env.ORAL_VOICE_MODE;
  });

  afterEach(() => {
    if (origBuildSha !== undefined) process.env.BUILD_GIT_SHA = origBuildSha;
    else delete process.env.BUILD_GIT_SHA;
    if (origBuildTime !== undefined) process.env.BUILD_TIME = origBuildTime;
    else delete process.env.BUILD_TIME;
    if (origVoiceMode !== undefined) process.env.ORAL_VOICE_MODE = origVoiceMode;
    else delete process.env.ORAL_VOICE_MODE;
  });

  it('retourne 200 avec release metadata', async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.status).toBe('ok');
    expect(body.release).toBeDefined();
    expect(body.release.gitSha).toBe('abc1234');
    expect(body.release.buildTime).toBe('2026-03-15T18:00:00.000Z');
  });

  it('retourne voice mode info', async () => {
    const res = await GET();
    const body = await res.json();

    expect(body.voice).toBeDefined();
    expect(body.voice.requestedVoiceMode).toBe('browser');
    expect(body.voice.effectiveVoiceMode).toBe('browser');
    expect(body.voice.sttAvailable).toBe(false);
    expect(body.voice.ttsAvailable).toBe(false);
  });

  it('retourne effective=browser quand requested=server mais STT indisponible', async () => {
    process.env.ORAL_VOICE_MODE = 'server';
    vi.mocked(getSttCapability).mockReturnValue({
      available: false,
      mode: 'unavailable',
      provider: null,
    });

    const res = await GET();
    const body = await res.json();

    expect(body.voice.requestedVoiceMode).toBe('server');
    expect(body.voice.effectiveVoiceMode).toBe('browser');
  });

  it('retourne effective=server quand requested=server et STT disponible', async () => {
    process.env.ORAL_VOICE_MODE = 'server';
    vi.mocked(getSttCapability).mockReturnValue({
      available: true,
      mode: 'full',
      provider: 'openai_whisper',
    });

    const res = await GET();
    const body = await res.json();

    expect(body.voice.requestedVoiceMode).toBe('server');
    expect(body.voice.effectiveVoiceMode).toBe('server');
    expect(body.voice.sttAvailable).toBe(true);
  });
});
