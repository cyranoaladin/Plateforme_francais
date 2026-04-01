import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/security/csrf-client', () => ({
  getCsrfToken: vi.fn().mockResolvedValue('csrf-test-token'),
}));

import { getCsrfToken } from '@/lib/security/csrf-client';
import { apiFetch } from '@/lib/api/client';

describe('apiFetch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('injecte le token CSRF pour une requete mutative', async () => {
    await apiFetch<{ ok: boolean }>('/api/v1/test', {
      method: 'POST',
      json: { hello: 'world' },
    });

    expect(getCsrfToken).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('/api/v1/test', expect.objectContaining({
      method: 'POST',
      headers: expect.any(Headers),
    }));
    const headers = (vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit | undefined)?.headers;
    expect(headers).toBeInstanceOf(Headers);
    expect((headers as Headers).get('X-CSRF-Token')).toBe('csrf-test-token');
  });

  it('ne demande pas de token CSRF pour une requete GET', async () => {
    await apiFetch<{ ok: boolean }>('/api/v1/test', {
      method: 'GET',
    });

    expect(getCsrfToken).not.toHaveBeenCalled();
  });
});
