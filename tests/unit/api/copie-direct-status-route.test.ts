import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/guard', () => ({
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock('@/lib/epreuves/repository', () => ({
  findCopieById: vi.fn(),
}));

function makeAuth(userId = 'user-1') {
  return {
    auth: {
      user: {
        id: userId,
        role: 'eleve' as const,
        email: 'test@eaf.local',
        emailVerified: new Date().toISOString(),
        passwordHash: '',
        passwordSalt: '',
        createdAt: '2026-01-01',
        profile: {
          displayName: 'Test',
          classLevel: '1ère',
          targetScore: '14',
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

describe('GET /api/v1/epreuves/copies/{copieId}/status', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const { requireAuthenticatedUser } = await import('@/lib/auth/guard');
    vi.mocked(requireAuthenticatedUser).mockResolvedValue(makeAuth());
  });

  it("retourne le statut via copieId seul quand l'utilisateur est propriétaire", async () => {
    const { findCopieById } = await import('@/lib/epreuves/repository');
    vi.mocked(findCopieById).mockResolvedValue({
      id: 'copie-1',
      epreuveId: 'ep-1',
      userId: 'user-1',
      status: 'done',
      correction: {
        note: 13,
        mention: 'Assez bien',
        rubriques: [],
      },
      ocrText: 'Texte extrait',
      fileType: 'application/pdf',
      createdAt: '2026-01-10',
      correctedAt: '2026-01-10',
    } as never);

    const { GET } = await import('@/app/api/v1/epreuves/copies/[copieId]/status/route');
    const req = new Request('http://localhost/api/v1/epreuves/copies/copie-1/status');
    const res = await GET(req, { params: Promise.resolve({ copieId: 'copie-1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(
      expect.objectContaining({
        copieId: 'copie-1',
        epreuveId: 'ep-1',
        status: 'done',
      }),
    );
    expect(body.correction.note).toBe(13);
    expect(body.correction.bilan.global).toEqual(expect.any(String));
  });

  it("retourne 404 quand la copie n'appartient pas à l'utilisateur", async () => {
    const { findCopieById } = await import('@/lib/epreuves/repository');
    vi.mocked(findCopieById).mockResolvedValue({
      id: 'copie-2',
      epreuveId: 'ep-2',
      userId: 'other-user',
      status: 'done',
    } as never);

    const { GET } = await import('@/app/api/v1/epreuves/copies/[copieId]/status/route');
    const req = new Request('http://localhost/api/v1/epreuves/copies/copie-2/status');
    const res = await GET(req, { params: Promise.resolve({ copieId: 'copie-2' }) });
    expect(res.status).toBe(404);
  });
});
