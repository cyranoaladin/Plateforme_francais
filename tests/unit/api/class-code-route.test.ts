import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth/guard', () => ({
  requireUserRole: vi.fn(),
}));

vi.mock('@/lib/security/csrf', () => ({
  validateCsrf: vi.fn().mockResolvedValue(null),
  CSRF_COOKIE: 'eaf_csrf',
}));

vi.mock('@/lib/db/repositories/userRepo', () => ({
  updateUserProfile: vi.fn().mockResolvedValue(undefined),
}));

function makeEnseignantAuth() {
  return {
    auth: {
      user: {
        id: 'teach-1',
        role: 'enseignant' as const,
        email: 'prof@eaf.local',
        passwordHash: '',
        passwordSalt: '',
        createdAt: '2026-01-01',
        profile: {
          displayName: 'Prof',
          classLevel: 'Ens',
          targetScore: '',
          onboardingCompleted: true,
          selectedOeuvres: [],
          parcoursProgress: [],
          badges: [],
          preferredObjects: [],
          weakSkills: [],
        },
      },
      token: 'tok',
    },
    errorResponse: null,
  };
}

describe('POST /api/v1/enseignant/class-code', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const { requireUserRole } = await import('@/lib/auth/guard');
    vi.mocked(requireUserRole).mockResolvedValue(makeEnseignantAuth());
  });

  it('génère un code de 6 caractères alphanumériques', async () => {
    const { POST } = await import('@/app/api/v1/enseignant/class-code/route');
    const req = new Request('http://localhost/api/v1/enseignant/class-code', {
      method: 'POST',
      headers: { 'x-csrf-token': 'tok' },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.classCode).toBeDefined();
    expect(body.classCode).toHaveLength(6);
    expect(body.classCode).toMatch(/^[A-Z0-9]+$/);
  });

  it('persiste le code via updateUserProfile', async () => {
    const { POST } = await import('@/app/api/v1/enseignant/class-code/route');
    const { updateUserProfile } = await import('@/lib/db/repositories/userRepo');
    const req = new Request('http://localhost/api/v1/enseignant/class-code', {
      method: 'POST',
      headers: { 'x-csrf-token': 'tok' },
    });
    await POST(req);
    expect(updateUserProfile).toHaveBeenCalledWith(
      'teach-1',
      expect.objectContaining({ classCode: expect.any(String) }),
    );
  });

  it('retourne 403 si rôle ≠ enseignant', async () => {
    const { requireUserRole } = await import('@/lib/auth/guard');
    vi.mocked(requireUserRole).mockResolvedValue({
      auth: null,
      errorResponse: new Response(JSON.stringify({ error: 'Accès refusé.' }), { status: 403 }),
    } as ReturnType<typeof requireUserRole> extends Promise<infer T> ? T : never);

    const { POST } = await import('@/app/api/v1/enseignant/class-code/route');
    const req = new Request('http://localhost/api/v1/enseignant/class-code', {
      method: 'POST',
      headers: { 'x-csrf-token': 'tok' },
    });
    const res = await POST(req);
    expect(res!.status).toBe(403);
  });
});
