import { afterEach, describe, expect, it, vi } from 'vitest';
import { ensurePublicCsrfToken, getCsrfToken, getCsrfTokenFromDocument } from '@/lib/security/csrf-client';

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

  it('attend brièvement qu un cookie CSRF apparaisse avant d appeler le réseau', async () => {
    vi.useFakeTimers();
    const documentState = { cookie: '' };
    Object.defineProperty(globalThis, 'document', {
      value: documentState,
      configurable: true,
    });

    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const tokenPromise = getCsrfToken();
    setTimeout(() => {
      documentState.cookie = 'eaf_csrf=token-after-poll';
    }, 100);

    await vi.advanceTimersByTimeAsync(120);

    await expect(tokenPromise).resolves.toBe('token-after-poll');
    expect(fetchSpy).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('bootstrappe le jeton via /api/v1/csrf quand le cookie est absent', async () => {
    vi.useFakeTimers();
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

    const tokenPromise = ensurePublicCsrfToken();
    await vi.advanceTimersByTimeAsync(600);
    await expect(tokenPromise).resolves.toBe('bootstrapped-token');
    vi.useRealTimers();
  });
});
