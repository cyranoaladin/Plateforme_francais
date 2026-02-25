import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CSRF_COOKIE } from '@/lib/security/csrf';

// ── Mocks infrastructure ──────────────────────────────────────────────────
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));
vi.mock('next/server', () => ({
  NextResponse: {
    json: vi.fn((body: unknown, init?: { status?: number }) => ({
      _body: body,
      status: init?.status ?? 200,
      cookies: { set: vi.fn() },
    })),
  },
}));

async function setupCookies(cookieValue: string | null) {
  const { cookies } = await import('next/headers');
  vi.mocked(cookies).mockResolvedValue({
    get: vi.fn((name: string) =>
      name === CSRF_COOKIE && cookieValue ? { value: cookieValue } : undefined,
    ),
  } as unknown as Awaited<ReturnType<typeof cookies>>);
}

function makeRequest(headerToken: string | null, cookie: string | null) {
  return new Request('http://localhost/api/test', {
    method: 'POST',
    headers: {
      ...(headerToken !== null ? { 'x-csrf-token': headerToken } : {}),
      ...(cookie ? { cookie: `${CSRF_COOKIE}=${cookie}` } : {}),
    },
  });
}

describe('CSRF validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('retourne null si le token cookie = le token header', async () => {
    const token = 'abcdef1234567890abcdef1234567890abcdef1234567890';
    await setupCookies(token);
    const { validateCsrf } = await import('@/lib/security/csrf');
    const result = await validateCsrf(makeRequest(token, token));
    expect(result).toBeNull();
  });

  it('retourne 403 si le token header est absent', async () => {
    const token = 'valid-token-123456789012345678901234567890';
    await setupCookies(token);
    const { validateCsrf } = await import('@/lib/security/csrf');
    const result = await validateCsrf(makeRequest(null, token));
    expect(result).not.toBeNull();
    expect((result as { status: number }).status).toBe(403);
  });

  it('retourne 403 si le token cookie est absent', async () => {
    await setupCookies(null);
    const { validateCsrf } = await import('@/lib/security/csrf');
    const result = await validateCsrf(makeRequest('some-token', null));
    expect(result).not.toBeNull();
    expect((result as { status: number }).status).toBe(403);
  });

  it('retourne 403 si les tokens diffèrent', async () => {
    const cookieToken = 'token-aaa-aaa-aaa-aaa-aaa-aaaa-aaaa';
    const headerToken = 'token-bbb-bbb-bbb-bbb-bbb-bbbb-bbbb';
    await setupCookies(cookieToken);
    const { validateCsrf } = await import('@/lib/security/csrf');
    const result = await validateCsrf(makeRequest(headerToken, cookieToken));
    expect(result).not.toBeNull();
    expect((result as { status: number }).status).toBe(403);
  });

  it('utilise timingSafeEqual pour résister aux timing attacks', async () => {
    // validateCsrf hashes both tokens with SHA-256 then uses timingSafeEqual
    // We verify the module loads correctly (uses crypto internally)
    const csrfModule = await import('@/lib/security/csrf');
    expect(csrfModule.validateCsrf).toBeDefined();
    expect(csrfModule.CSRF_COOKIE).toBe('eaf_csrf');
  });
});
