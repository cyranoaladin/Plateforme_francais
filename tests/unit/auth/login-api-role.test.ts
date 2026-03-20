/**
 * Tests unitaires : l'API /api/v1/auth/login retourne le rôle dans la réponse.
 * Vérifie que chaque rôle (admin, eleve, enseignant, parent) est correctement retourné.
 */
import { describe, expect, it, vi, beforeEach } from 'vitest';

// ─── Mocks ──────────────────────────────────────────────────────────────

const mockFindUserByEmail = vi.fn();
const mockVerifyPassword = vi.fn();
const mockCreateUserSession = vi.fn();
const mockSetSessionCookie = vi.fn();
const mockSetRoleCookie = vi.fn();
const mockEnsureCsrfCookie = vi.fn();
const mockCheckRateLimit = vi.fn();
const mockParseJsonBody = vi.fn();

vi.mock('@/lib/db/repositories/userRepo', () => ({
  findUserByEmail: (...args: unknown[]) => mockFindUserByEmail(...args),
}));

vi.mock('@/lib/auth/session', () => ({
  verifyPassword: (...args: unknown[]) => mockVerifyPassword(...args),
  createUserSession: (...args: unknown[]) => mockCreateUserSession(...args),
  setSessionCookie: (...args: unknown[]) => mockSetSessionCookie(...args),
  setRoleCookie: (...args: unknown[]) => mockSetRoleCookie(...args),
}));

vi.mock('@/lib/security/csrf', () => ({
  ensureCsrfCookie: (...args: unknown[]) => mockEnsureCsrfCookie(...args),
}));

vi.mock('@/lib/security/rate-limit', () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
}));

vi.mock('@/lib/validation/request', () => ({
  parseJsonBody: (...args: unknown[]) => mockParseJsonBody(...args),
}));

vi.mock('@/lib/validation/schemas', () => ({
  loginBodySchema: {},
}));

// ─── Helpers ────────────────────────────────────────────────────────────

function makeUser(role: 'admin' | 'eleve' | 'enseignant' | 'parent') {
  return {
    id: `user-${role}`,
    email: `${role}@test.com`,
    passwordHash: 'hash',
    passwordSalt: 'salt',
    role,
    createdAt: new Date().toISOString(),
    profile: {
      displayName: role,
      classLevel: 'Première générale',
      targetScore: '14/20',
      onboardingCompleted: role !== 'eleve',
      selectedOeuvres: [],
      parcoursProgress: [],
      badges: [],
      preferredObjects: [],
      weakSkills: [],
    },
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────

describe('POST /api/v1/auth/login — retourne le rôle', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockCheckRateLimit.mockResolvedValue({ allowed: true });
    mockCreateUserSession.mockResolvedValue({ token: 'tok-123' });
    mockSetSessionCookie.mockResolvedValue(undefined);
    mockSetRoleCookie.mockResolvedValue(undefined);
    mockEnsureCsrfCookie.mockResolvedValue(undefined);
  });

  for (const role of ['admin', 'eleve', 'enseignant', 'parent'] as const) {
    it(`retourne role="${role}" pour un utilisateur ${role}`, async () => {
      const user = makeUser(role);
      mockParseJsonBody.mockResolvedValue({
        success: true,
        data: { email: user.email, password: 'test1234' },
      });
      mockFindUserByEmail.mockResolvedValue(user);
      mockVerifyPassword.mockReturnValue(true);

      const { POST } = await import('@/app/api/v1/auth/login/route');
      const req = new Request('http://localhost/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, password: 'test1234' }),
      });

      const res = await POST(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.ok).toBe(true);
      expect(body.role).toBe(role);
    });
  }

  it('retourne 401 pour un mauvais mot de passe', async () => {
    const user = makeUser('eleve');
    mockParseJsonBody.mockResolvedValue({
      success: true,
      data: { email: user.email, password: 'wrong' },
    });
    mockFindUserByEmail.mockResolvedValue(user);
    mockVerifyPassword.mockReturnValue(false);

    const { POST } = await import('@/app/api/v1/auth/login/route');
    const req = new Request('http://localhost/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: user.email, password: 'wrong' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBeTruthy();
    expect(body.role).toBeUndefined();
  });

  it('retourne 401 pour un email inexistant', async () => {
    mockParseJsonBody.mockResolvedValue({
      success: true,
      data: { email: 'nobody@test.com', password: 'test1234' },
    });
    mockFindUserByEmail.mockResolvedValue(null);

    const { POST } = await import('@/app/api/v1/auth/login/route');
    const req = new Request('http://localhost/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'nobody@test.com', password: 'test1234' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.role).toBeUndefined();
  });

  it('retourne 429 quand rate-limité', async () => {
    mockCheckRateLimit.mockResolvedValue({ allowed: false, retryAfter: 60 });
    mockParseJsonBody.mockResolvedValue({
      success: true,
      data: { email: 'test@test.com', password: 'test1234' },
    });

    const { POST } = await import('@/app/api/v1/auth/login/route');
    const req = new Request('http://localhost/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@test.com', password: 'test1234' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
  });

  it('pose le cookie de rôle correct pour admin', async () => {
    const user = makeUser('admin');
    mockParseJsonBody.mockResolvedValue({
      success: true,
      data: { email: user.email, password: 'test1234' },
    });
    mockFindUserByEmail.mockResolvedValue(user);
    mockVerifyPassword.mockReturnValue(true);

    const { POST } = await import('@/app/api/v1/auth/login/route');
    const req = new Request('http://localhost/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: user.email, password: 'test1234' }),
    });

    await POST(req);
    expect(mockSetRoleCookie).toHaveBeenCalledWith('admin');
  });
});
