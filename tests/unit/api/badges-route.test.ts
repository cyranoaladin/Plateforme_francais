import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { StudentProfile } from '@/lib/auth/types';

const mockProfile: StudentProfile = {
  displayName: 'Test',
  classLevel: '1ère',
  targetScore: '14',
  onboardingCompleted: true,
  selectedOeuvres: [],
  parcoursProgress: [],
  badges: ['Première copie déposée 📝'],
  preferredObjects: [],
  weakSkills: [],
};

vi.mock('@/lib/auth/guard', () => ({
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock('@/lib/security/csrf', () => ({
  validateCsrf: vi.fn().mockResolvedValue(null),
  CSRF_COOKIE: 'eaf_csrf',
}));

vi.mock('@/lib/validation/request', () => ({
  parseJsonBody: vi.fn().mockResolvedValue({ success: true, data: { trigger: 'first_copy' } }),
}));

vi.mock('@/lib/db/repositories/memoryRepo', () => ({
  listMemoryEventsByUser: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/lib/db/repositories/userRepo', () => ({
  updateUserProfile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/gamification/badges', () => ({
  evaluateBadges: vi.fn().mockReturnValue({
    badges: ['Première copie déposée 📝'],
    newBadges: [],
  }),
}));

function makeAuth() {
  return {
    auth: {
      user: {
        id: 'user-1',
        role: 'eleve' as const,
        email: 'test@eaf.local',
        passwordHash: '',
        passwordSalt: '',
        createdAt: '2026-01-01',
        profile: mockProfile,
      },
      token: 'tok',
    },
    errorResponse: null,
  };
}

describe('GET /api/v1/badges/list', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const { requireAuthenticatedUser } = await import('@/lib/auth/guard');
    vi.mocked(requireAuthenticatedUser).mockResolvedValue(makeAuth());
  });

  it('retourne les badges du profil utilisateur', async () => {
    const { GET } = await import('@/app/api/v1/badges/list/route');
    const res = await GET();
    expect(res!.status).toBe(200);
    const body = await res!.json();
    expect(body.badges).toContain('Première copie déposée 📝');
  });

  it('retourne 401 si non authentifié', async () => {
    const { requireAuthenticatedUser } = await import('@/lib/auth/guard');
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: null,
      errorResponse: new Response(JSON.stringify({ error: 'Non authentifié.' }), { status: 401 }),
    } as ReturnType<typeof requireAuthenticatedUser> extends Promise<infer T> ? T : never);

    const { GET } = await import('@/app/api/v1/badges/list/route');
    const res = await GET();
    expect(res!.status).toBe(401);
  });
});

describe('POST /api/v1/badges/evaluate', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const { requireAuthenticatedUser } = await import('@/lib/auth/guard');
    vi.mocked(requireAuthenticatedUser).mockResolvedValue(makeAuth());
  });

  it('évalue et retourne les badges après un trigger', async () => {
    const { POST } = await import('@/app/api/v1/badges/evaluate/route');
    const req = new Request('http://localhost/api/v1/badges/evaluate', {
      method: 'POST',
      body: JSON.stringify({ trigger: 'first_copy' }),
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': 'valid' },
    });
    const res = await POST(req);
    expect(res!.status).toBe(200);
    const body = await res!.json();
    expect(body.badges).toBeDefined();
  });
});
