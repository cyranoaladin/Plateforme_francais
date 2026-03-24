import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/guard', () => ({
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock('@/lib/epreuves/repository', () => ({
  findCopieById: vi.fn(),
  findEpreuveById: vi.fn(),
}));

vi.mock('@react-pdf/renderer', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@react-pdf/renderer')>();
  return {
    ...actual,
    renderToBuffer: vi.fn(async () => Buffer.from('%PDF-1.3 mock')),
  };
});

function makeAuth(userId = 'user-1') {
  return {
    auth: {
      user: {
        id: userId,
        role: 'eleve' as const,
        email: 'test@eaf.local',
        profile: {},
      },
      token: 'tok',
    },
    errorResponse: null,
  };
}

describe('GET /api/v1/epreuves/copies/{copieId}/report', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const { requireAuthenticatedUser } = await import('@/lib/auth/guard');
    vi.mocked(requireAuthenticatedUser).mockResolvedValue(makeAuth() as never);
  });

  it('returns a PDF for a finished correction owned by the user', async () => {
    const { findCopieById, findEpreuveById } = await import('@/lib/epreuves/repository');
    vi.mocked(findCopieById).mockResolvedValue({
      id: 'copie-done',
      epreuveId: 'ep-1',
      userId: 'user-1',
      status: 'done',
      filePath: '/tmp/copie.pdf',
      fileType: 'application/pdf',
      ocrText: 'Texte',
      correction: {
        note: 12,
        mention: 'Assez bien',
        bilan: { global: 'Bon ensemble', points_forts: [], axes_amelioration: [] },
        rubriques: [],
        annotations: [],
        corrige_type: 'commentaire',
        conseil_final: 'Continue',
      },
      createdAt: '2026-03-24T10:00:00.000Z',
      correctedAt: '2026-03-24T10:10:00.000Z',
    } as never);
    vi.mocked(findEpreuveById).mockResolvedValue({
      id: 'ep-1',
      userId: 'user-1',
      type: 'commentaire',
      sujet: 'Sujet test',
      texte: 'Texte',
      consignes: 'Consignes',
      bareme: {},
      generatedAt: '2026-03-24T09:00:00.000Z',
    } as never);

    const { GET } = await import('@/app/api/v1/epreuves/copies/[copieId]/report/route');
    const response = await GET(new Request('http://localhost/api/v1/epreuves/copies/copie-done/report'), {
      params: Promise.resolve({ copieId: 'copie-done' }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
  });

  it('returns 404 when the copy is in error even if an error payload exists', async () => {
    const { findCopieById } = await import('@/lib/epreuves/repository');
    vi.mocked(findCopieById).mockResolvedValue({
      id: 'copie-error',
      epreuveId: 'ep-1',
      userId: 'user-1',
      status: 'error',
      filePath: '/tmp/copie.png',
      fileType: 'image/png',
      ocrText: null,
      correction: {
        errorMessage: "Nous n'avons pas réussi à lire automatiquement cette copie.",
      },
      createdAt: '2026-03-24T10:00:00.000Z',
      correctedAt: null,
    } as never);

    const { GET } = await import('@/app/api/v1/epreuves/copies/[copieId]/report/route');
    const response = await GET(new Request('http://localhost/api/v1/epreuves/copies/copie-error/report'), {
      params: Promise.resolve({ copieId: 'copie-error' }),
    });

    expect(response.status).toBe(404);
  });
});
