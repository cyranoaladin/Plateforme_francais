import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/security/csrf', () => ({
  ensureCsrfCookie: vi.fn(async () => undefined),
  CSRF_COOKIE: 'eaf_csrf',
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn((name: string) =>
      name === 'eaf_csrf' ? { value: 'csrf-token-123' } : undefined,
    ),
  })),
}));

describe('GET /api/v1/csrf', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('retourne un token CSRF public et désactive le cache', async () => {
    const { GET } = await import('@/app/api/v1/csrf/route');
    const { ensureCsrfCookie } = await import('@/lib/security/csrf');

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(body).toEqual({ csrfToken: 'csrf-token-123' });
    expect(ensureCsrfCookie).toHaveBeenCalled();
  });
});
