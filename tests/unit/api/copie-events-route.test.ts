import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/guard', () => ({
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock('@/lib/security/rate-limit', () => ({
  checkRateLimit: vi.fn(),
}));

vi.mock('@/lib/epreuves/repository', () => ({
  findCopieById: vi.fn(),
  listCopieProgressEvents: vi.fn(),
}));

function makeAuth(userId = 'user-1') {
  return {
    auth: {
      user: {
        id: userId,
        role: 'eleve' as const,
        email: 'test@eaf.local',
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

describe('GET /api/v1/epreuves/copies/{copieId}/events', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const { requireAuthenticatedUser } = await import('@/lib/auth/guard');
    const { checkRateLimit } = await import('@/lib/security/rate-limit');
    vi.mocked(requireAuthenticatedUser).mockResolvedValue(makeAuth());
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, retryAfter: 0 });
  });

  it('retourne 401 sans utilisateur authentifié', async () => {
    const { requireAuthenticatedUser } = await import('@/lib/auth/guard');
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: null,
      errorResponse: new Response(JSON.stringify({ error: 'Non authentifié.' }), { status: 401 }),
    } as never);

    const { GET } = await import('@/app/api/v1/epreuves/copies/[copieId]/events/route');
    const res = await GET(new Request('http://localhost/api/v1/epreuves/copies/copie-1/events'), {
      params: Promise.resolve({ copieId: 'copie-1' }),
    });

    expect(res.status).toBe(401);
  });

  it('retourne 429 quand la limite SSE est dépassée', async () => {
    const { checkRateLimit } = await import('@/lib/security/rate-limit');
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, retryAfter: 7 });

    const { GET } = await import('@/app/api/v1/epreuves/copies/[copieId]/events/route');
    const res = await GET(new Request('http://localhost/api/v1/epreuves/copies/copie-1/events'), {
      params: Promise.resolve({ copieId: 'copie-1' }),
    });

    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('7');
  });

  it('retourne 404 si la copie appartient à un autre utilisateur', async () => {
    const { findCopieById } = await import('@/lib/epreuves/repository');
    vi.mocked(findCopieById).mockResolvedValue({
      id: 'copie-1',
      userId: 'other-user',
    } as never);

    const { GET } = await import('@/app/api/v1/epreuves/copies/[copieId]/events/route');
    const res = await GET(new Request('http://localhost/api/v1/epreuves/copies/copie-1/events'), {
      params: Promise.resolve({ copieId: 'copie-1' }),
    });

    expect(res.status).toBe(404);
  });

  it('retourne 404 si la copie est introuvable', async () => {
    const { findCopieById } = await import('@/lib/epreuves/repository');
    vi.mocked(findCopieById).mockResolvedValue(null as never);

    const { GET } = await import('@/app/api/v1/epreuves/copies/[copieId]/events/route');
    const res = await GET(new Request('http://localhost/api/v1/epreuves/copies/copie-1/events'), {
      params: Promise.resolve({ copieId: 'copie-1' }),
    });

    expect(res.status).toBe(404);
  });

  it('retourne un flux SSE avec historique initial', async () => {
    const { findCopieById, listCopieProgressEvents } = await import('@/lib/epreuves/repository');
    vi.mocked(findCopieById).mockResolvedValue({
      id: 'copie-1',
      userId: 'user-1',
    } as never);
    vi.mocked(listCopieProgressEvents).mockResolvedValue([
      {
        id: 'evt-1',
        copieId: 'copie-1',
        stage: 'queued',
        message: 'Copie déposée.',
        progress: 0,
        payload: null,
        createdAt: '2026-04-01T07:00:00.000Z',
      },
      {
        id: 'evt-2',
        copieId: 'copie-1',
        stage: 'ocr_started',
        message: 'OCR en cours.',
        progress: 25,
        payload: null,
        createdAt: '2026-04-01T07:00:05.000Z',
      },
    ] as never);

    const { GET } = await import('@/app/api/v1/epreuves/copies/[copieId]/events/route');
    const res = await GET(new Request('http://localhost/api/v1/epreuves/copies/copie-1/events?once=1'), {
      params: Promise.resolve({ copieId: 'copie-1' }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/event-stream');
    expect(res.headers.get('X-Accel-Buffering')).toBe('no');

    const body = await res.text();
    expect(body).toContain('"stage":"queued"');
    expect(body).toContain('"stage":"ocr_started"');
    expect(body).toContain('event: progress');
  });

  it('ferme le flux immédiatement sur un événement terminal report_ready', async () => {
    const { findCopieById, listCopieProgressEvents } = await import('@/lib/epreuves/repository');
    vi.mocked(findCopieById).mockResolvedValue({
      id: 'copie-1',
      userId: 'user-1',
    } as never);
    vi.mocked(listCopieProgressEvents).mockResolvedValue([
      {
        id: 'evt-report',
        copieId: 'copie-1',
        stage: 'report_ready',
        message: 'Rapport prêt.',
        progress: 100,
        payload: null,
        createdAt: '2026-04-01T07:00:10.000Z',
      },
    ] as never);

    const { GET } = await import('@/app/api/v1/epreuves/copies/[copieId]/events/route');
    const res = await GET(new Request('http://localhost/api/v1/epreuves/copies/copie-1/events'), {
      params: Promise.resolve({ copieId: 'copie-1' }),
    });

    expect(res.status).toBe(200);
    await expect(res.text()).resolves.toContain('"stage":"report_ready"');
  });

  it('ferme le flux immédiatement sur un événement terminal failed', async () => {
    const { findCopieById, listCopieProgressEvents } = await import('@/lib/epreuves/repository');
    vi.mocked(findCopieById).mockResolvedValue({
      id: 'copie-1',
      userId: 'user-1',
    } as never);
    vi.mocked(listCopieProgressEvents).mockResolvedValue([
      {
        id: 'evt-failed',
        copieId: 'copie-1',
        stage: 'failed',
        message: 'Échec de traitement.',
        progress: 100,
        payload: null,
        createdAt: '2026-04-01T07:00:12.000Z',
      },
    ] as never);

    const { GET } = await import('@/app/api/v1/epreuves/copies/[copieId]/events/route');
    const res = await GET(new Request('http://localhost/api/v1/epreuves/copies/copie-1/events'), {
      params: Promise.resolve({ copieId: 'copie-1' }),
    });

    expect(res.status).toBe(200);
    await expect(res.text()).resolves.toContain('"stage":"failed"');
  });
});
