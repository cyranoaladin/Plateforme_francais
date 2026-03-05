import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('ExternalRAGClient timeout', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    process.env.RAG_API_TOKEN = 'test-token';
    process.env.RAG_API_URL = 'https://rag.local';
    process.env.RAG_TIMEOUT_MS = '10';
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env = { ...originalEnv };
    vi.unstubAllGlobals();
  });

  it('abort apres timeout et retourne [] pour fallback local', async () => {
    const fetchMock = vi.fn((_url: string, init?: RequestInit) => {
      return new Promise((_, reject) => {
        const signal = init?.signal as AbortSignal | undefined;
        signal?.addEventListener('abort', () => {
          const abortError = new Error('Aborted');
          abortError.name = 'AbortError';
          reject(abortError);
        });
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const { getExternalRAGClient } = await import('@/lib/rag/external-client');
    const client = getExternalRAGClient();

    const promise = client.search({ query: 'barème oral EAF' });
    await vi.advanceTimersByTimeAsync(20);
    const result = await promise;

    expect(result.results).toEqual([]);
    expect(result.total_found).toBe(0);
  });
});

