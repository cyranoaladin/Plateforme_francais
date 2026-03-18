import { afterEach, describe, expect, it, vi } from 'vitest';
import { ensurePublicCsrfToken, getCsrfTokenFromDocument } from '@/lib/security/csrf-client';

describe('csrf-client', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('lit le jeton CSRF depuis document.cookie', () => {
    Object.defineProperty(globalThis, 'document', {
      value: { cookie: 'foo=bar; eaf_csrf=token-cookie; hello=world' },
      configurable: true,
    });

    expect(getCsrfTokenFromDocument()).toBe('token-cookie');
  });

  it('réutilise le jeton existant sans appel réseau', async () => {
    Object.defineProperty(globalThis, 'document', {
      value: { cookie: 'eaf_csrf=token-cookie' },
      configurable: true,
    });
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    await expect(ensurePublicCsrfToken()).resolves.toBe('token-cookie');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('bootstrappe le jeton via /api/v1/csrf quand le cookie est absent', async () => {
    const documentState = { cookie: '' };
    Object.defineProperty(globalThis, 'document', {
      value: documentState,
      configurable: true,
    });
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => {
      documentState.cookie = 'eaf_csrf=bootstrapped-token';
      return new Response(JSON.stringify({ csrfToken: 'bootstrapped-token' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }));

    await expect(ensurePublicCsrfToken()).resolves.toBe('bootstrapped-token');
  });
});
