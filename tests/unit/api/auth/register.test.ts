import { beforeEach, describe, expect, it, vi } from 'vitest';

// ── Mock: rate-limit ────────────────────────────────────────────────────────
vi.mock('@/lib/security/rate-limit', () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true, retryAfter: 0 })),
}));

// ── Mock: validation/request ───────────────────────────────────────────────
vi.mock('@/lib/validation/request', () => ({
  parseJsonBody: vi.fn(),
}));

// ── Mock: userRepo ─────────────────────────────────────────────────────────
vi.mock('@/lib/db/repositories/userRepo', () => ({
  findUserByEmail: vi.fn(async () => null),
  createUser: vi.fn(async () => undefined),
}));

// ── Mock: session ──────────────────────────────────────────────────────────
vi.mock('@/lib/auth/session', () => ({
  createPasswordCredentials: vi.fn(() => ({
    passwordHash: 'hash-abc',
    passwordSalt: 'salt-xyz',
  })),
  createUserSession: vi.fn(async () => ({ token: 'session-tok-1' })),
  setSessionCookie: vi.fn(async () => undefined),
  setRoleCookie: vi.fn(async () => undefined),
  verifyPassword: vi.fn(() => true),
}));

// ── Mock: memoryRepo / memory/store ────────────────────────────────────────
vi.mock('@/lib/db/repositories/memoryRepo', () => ({
  createMemoryEventRecord: vi.fn(async () => undefined),
}));
vi.mock('@/lib/memory/store', () => ({
  createMemoryEvent: vi.fn(() => ({})),
}));

// ── Mock: email services ───────────────────────────────────────────────────
vi.mock('@/lib/email/service', () => ({
  sendWelcomeEmail: vi.fn(async () => ({ success: true })),
  sendParentNotificationEmail: vi.fn(async () => ({ success: true })),
  sendEmailVerificationEmail: vi.fn(async () => ({ success: true })),
}));
vi.mock('@/lib/email/parental-consent', () => ({
  generateConsentToken: vi.fn(() => 'consent-token-xyz'),
  sendParentalConsentEmail: vi.fn(async () => ({ success: true })),
}));

// ── Mock: prisma ───────────────────────────────────────────────────────────
vi.mock('@/lib/db/client', () => ({
  prisma: {
    user: {
      update: vi.fn(async () => ({})),
    },
    studentProfile: {
      findUnique: vi.fn(async () => null),
    },
  },
}));

// ── Mock: misc ─────────────────────────────────────────────────────────────
vi.mock('@/lib/auth/linked-role-accounts', () => ({
  ensureLinkedRoleAccount: vi.fn(async () => ({ status: 'new' })),
}));
vi.mock('@/lib/date/current-school-year', () => ({
  getCurrentAnneeScolaire: vi.fn(() => '2025-2026'),
}));
vi.mock('@/lib/security/csrf', () => ({
  ensureCsrfCookie: vi.fn(async () => undefined),
}));
vi.mock('@/lib/tracking/meta-capi', () => ({
  sendMetaCapiEvent: vi.fn(async () => undefined),
}));
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Helpers ────────────────────────────────────────────────────────────────
import { parseJsonBody } from '@/lib/validation/request';
import { findUserByEmail, createUser } from '@/lib/db/repositories/userRepo';
import { checkRateLimit } from '@/lib/security/rate-limit';

function makeRequest(body: Record<string, unknown> = {}): Request {
  return new Request('http://localhost/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  email: 'eleve@nexus.test',
  password: 'NexusTest2026!',
  acceptedCgu: true,
  cguVersion: '2026-03',
  isMinor: false,
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe('POST /api/v1/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, retryAfter: 0 });
    vi.mocked(findUserByEmail).mockResolvedValue(null);
    vi.mocked(createUser).mockResolvedValue(undefined);
    vi.mocked(parseJsonBody).mockResolvedValue({
      success: true,
      data: VALID_BODY,
    } as ReturnType<typeof parseJsonBody> extends Promise<infer U> ? U : never);
  });

  it('exporte le handler POST', async () => {
    const mod = await import('@/app/api/v1/auth/register/route');
    expect(typeof mod.POST).toBe('function');
  });

  it('retourne 201 pour une inscription valide', async () => {
    const { POST } = await import('@/app/api/v1/auth/register/route');
    const req = makeRequest(VALID_BODY);
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('retourne 429 si le rate limit est atteint', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: false,
      retryAfter: 3600,
    });
    const { POST } = await import('@/app/api/v1/auth/register/route');
    const req = makeRequest(VALID_BODY);
    const res = await POST(req);
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toMatch(/trop de tentatives/i);
  });

  it('retourne 400 si la validation échoue (email invalide)', async () => {
    vi.mocked(parseJsonBody).mockResolvedValue({
      success: false,
      response: new Response(JSON.stringify({ error: 'Email invalide', details: ['Adresse e-mail invalide.'] }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }),
    } as ReturnType<typeof parseJsonBody> extends Promise<infer U> ? U : never);

    const { POST } = await import('@/app/api/v1/auth/register/route');
    const req = makeRequest({ email: 'pas-un-email', password: 'Aa1!aaaa', acceptedCgu: true });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('retourne 400 si acceptedCgu est false', async () => {
    vi.mocked(parseJsonBody).mockResolvedValue({
      success: false,
      response: new Response(
        JSON.stringify({ error: 'Validation failed', details: ["Tu dois accepter les conditions d'utilisation."] }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      ),
    } as ReturnType<typeof parseJsonBody> extends Promise<infer U> ? U : never);

    const { POST } = await import('@/app/api/v1/auth/register/route');
    const req = makeRequest({ ...VALID_BODY, acceptedCgu: false });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('retourne 409 si le compte existe déjà', async () => {
    vi.mocked(findUserByEmail).mockResolvedValue({
      id: 'user-existing',
      email: VALID_BODY.email,
      role: 'eleve',
    } as Awaited<ReturnType<typeof findUserByEmail>>);

    const { POST } = await import('@/app/api/v1/auth/register/route');
    const req = makeRequest(VALID_BODY);
    const res = await POST(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/compte existe déjà/i);
  });

  it('retourne 500 si createUser lance une exception inattendue', async () => {
    vi.mocked(createUser).mockRejectedValue(new Error('DB connexion perdue'));

    const { POST } = await import('@/app/api/v1/auth/register/route');
    const req = makeRequest(VALID_BODY);
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/erreur interne/i);
  });

  it('le handler crée bien un utilisateur (createUser appelé, réponse 201)', async () => {
    const { POST } = await import('@/app/api/v1/auth/register/route');
    const req = makeRequest(VALID_BODY);
    const res = await POST(req);
    expect(createUser).toHaveBeenCalledOnce();
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('un mineur sans parentEmail retourne 400', async () => {
    vi.mocked(parseJsonBody).mockResolvedValue({
      success: false,
      response: new Response(
        JSON.stringify({ error: 'Validation', details: ["L'e-mail d'un parent est obligatoire pour les mineurs."] }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      ),
    } as ReturnType<typeof parseJsonBody> extends Promise<infer U> ? U : never);

    const { POST } = await import('@/app/api/v1/auth/register/route');
    const req = makeRequest({ ...VALID_BODY, isMinor: true });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
