import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth/guard', () => ({
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock('@/lib/epreuves/repository', () => ({
  findEpreuveById: vi.fn(),
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

describe('GET /api/v1/epreuves/{epreuveId}/copie/{copieId}', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const { requireAuthenticatedUser } = await import('@/lib/auth/guard');
    vi.mocked(requireAuthenticatedUser).mockResolvedValue(makeAuth());
  });

  it('retourne la copie avec statut et correction', async () => {
    const { findEpreuveById, findCopieById } = await import('@/lib/epreuves/repository');
    vi.mocked(findEpreuveById).mockResolvedValue({ id: 'ep-1', userId: 'user-1' } as never);
    vi.mocked(findCopieById).mockResolvedValue({
      id: 'copie-1',
      epreuveId: 'ep-1',
      userId: 'user-1',
      status: 'done',
      correction: {
        note: 14,
        mention: 'Bien',
        bilan: {
          global: 'Copie solide.',
          points_forts: ['Analyse précise'],
          axes_amelioration: ['Mieux développer la conclusion'],
        },
        rubriques: [],
        annotations: [],
        corrige_type: 'commentaire',
        conseil_final: 'Continuez.',
      },
      ocrText: 'Texte extrait',
      createdAt: '2026-01-10',
      correctedAt: '2026-01-10',
    } as never);

    const { GET } = await import('@/app/api/v1/epreuves/[epreuveId]/copie/[copieId]/route');
    const req = new Request('http://localhost/api/v1/epreuves/ep-1/copie/copie-1');
    const res = await GET(req, { params: Promise.resolve({ epreuveId: 'ep-1', copieId: 'copie-1' }) });
    expect(res!.status).toBe(200);
    const body = await res!.json();
    expect(body.copieId).toBe('copie-1');
    expect(body.status).toBe('done');
    expect(body.correction).toEqual(
      expect.objectContaining({
        note: 14,
        mention: 'Bien',
        bilan: expect.objectContaining({
          global: 'Copie solide.',
        }),
      }),
    );
  });

  it('normalise une correction partielle pour garantir un bilan exploitable', async () => {
    const { findEpreuveById, findCopieById } = await import('@/lib/epreuves/repository');
    vi.mocked(findEpreuveById).mockResolvedValue({ id: 'ep-1', userId: 'user-1' } as never);
    vi.mocked(findCopieById).mockResolvedValue({
      id: 'copie-2',
      epreuveId: 'ep-1',
      userId: 'user-1',
      status: 'done',
      correction: {
        note: 11,
        rubriques: [{ titre: 'Analyse', note: 5, max: 8 }],
      },
      ocrText: 'Texte extrait',
      createdAt: '2026-01-10',
      correctedAt: '2026-01-10',
    } as never);

    const { GET } = await import('@/app/api/v1/epreuves/[epreuveId]/copie/[copieId]/route');
    const req = new Request('http://localhost/api/v1/epreuves/ep-1/copie/copie-2');
    const res = await GET(req, { params: Promise.resolve({ epreuveId: 'ep-1', copieId: 'copie-2' }) });
    expect(res!.status).toBe(200);
    const body = await res!.json();
    expect(body.correction.mention).toBe('Passable');
    expect(body.correction.bilan.global).toEqual(expect.any(String));
    expect(body.correction.bilan.axes_amelioration.length).toBeGreaterThan(0);
  });

  it('masque un texte OCR technique dans la réponse utilisateur', async () => {
    const { findEpreuveById, findCopieById } = await import('@/lib/epreuves/repository');
    vi.mocked(findEpreuveById).mockResolvedValue({ id: 'ep-1', userId: 'user-1' } as never);
    vi.mocked(findCopieById).mockResolvedValue({
      id: 'copie-ocr',
      epreuveId: 'ep-1',
      userId: 'user-1',
      status: 'error',
      correction: null,
      ocrText: '[ocr pixtral: erreur serveur 500]',
      createdAt: '2026-01-10',
      correctedAt: '2026-01-10',
    } as never);

    const { GET } = await import('@/app/api/v1/epreuves/[epreuveId]/copie/[copieId]/route');
    const req = new Request('http://localhost/api/v1/epreuves/ep-1/copie/copie-ocr');
    const res = await GET(req, { params: Promise.resolve({ epreuveId: 'ep-1', copieId: 'copie-ocr' }) });
    expect(res!.status).toBe(200);
    const body = await res!.json();
    expect(body.ocrText).toBeNull();
  });

  it("préserve un payload d'erreur sans le normaliser en faux bilan", async () => {
    const { findEpreuveById, findCopieById } = await import('@/lib/epreuves/repository');
    vi.mocked(findEpreuveById).mockResolvedValue({ id: 'ep-1', userId: 'user-1' } as never);
    vi.mocked(findCopieById).mockResolvedValue({
      id: 'copie-error',
      epreuveId: 'ep-1',
      userId: 'user-1',
      status: 'error',
      correction: {
        errorMessage: "Nous n'avons pas réussi à lire automatiquement cette copie.",
      },
      ocrText: null,
      createdAt: '2026-01-10',
      correctedAt: '2026-01-10',
    } as never);

    const { GET } = await import('@/app/api/v1/epreuves/[epreuveId]/copie/[copieId]/route');
    const req = new Request('http://localhost/api/v1/epreuves/ep-1/copie/copie-error');
    const res = await GET(req, { params: Promise.resolve({ epreuveId: 'ep-1', copieId: 'copie-error' }) });
    expect(res!.status).toBe(200);
    const body = await res!.json();
    expect(body.status).toBe('error');
    expect(body.correction).toEqual({
      errorMessage: "Nous n'avons pas réussi à lire automatiquement cette copie.",
    });
    expect(body.correction.note).toBeUndefined();
  });

  it('retourne 404 si épreuve introuvable', async () => {
    const { findEpreuveById, findCopieById } = await import('@/lib/epreuves/repository');
    vi.mocked(findEpreuveById).mockResolvedValue(null as never);
    vi.mocked(findCopieById).mockResolvedValue(null as never);

    const { GET } = await import('@/app/api/v1/epreuves/[epreuveId]/copie/[copieId]/route');
    const req = new Request('http://localhost/api/v1/epreuves/ep-x/copie/copie-x');
    const res = await GET(req, { params: Promise.resolve({ epreuveId: 'ep-x', copieId: 'copie-x' }) });
    expect(res!.status).toBe(404);
  });

  it('retourne 404 si copie appartient à un autre utilisateur (IDOR)', async () => {
    const { findEpreuveById, findCopieById } = await import('@/lib/epreuves/repository');
    vi.mocked(findEpreuveById).mockResolvedValue({ id: 'ep-1', userId: 'user-1' } as never);
    vi.mocked(findCopieById).mockResolvedValue({
      id: 'copie-other',
      epreuveId: 'ep-1',
      userId: 'other-user',
      status: 'done',
    } as never);

    const { GET } = await import('@/app/api/v1/epreuves/[epreuveId]/copie/[copieId]/route');
    const req = new Request('http://localhost/api/v1/epreuves/ep-1/copie/copie-other');
    const res = await GET(req, { params: Promise.resolve({ epreuveId: 'ep-1', copieId: 'copie-other' }) });
    expect(res!.status).toBe(404);
  });

  it('retourne 401 si non authentifié', async () => {
    const { requireAuthenticatedUser } = await import('@/lib/auth/guard');
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: null,
      errorResponse: new Response(JSON.stringify({ error: 'Non authentifié.' }), { status: 401 }),
    } as ReturnType<typeof requireAuthenticatedUser> extends Promise<infer T> ? T : never);

    const { GET } = await import('@/app/api/v1/epreuves/[epreuveId]/copie/[copieId]/route');
    const req = new Request('http://localhost/api/v1/epreuves/ep-1/copie/copie-1');
    const res = await GET(req, { params: Promise.resolve({ epreuveId: 'ep-1', copieId: 'copie-1' }) });
    expect(res!.status).toBe(401);
  });
});
