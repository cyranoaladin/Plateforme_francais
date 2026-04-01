import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/guard', () => ({
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock('@/lib/oral/repository', () => ({
  findOralSessionById: vi.fn(),
}));

import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { findOralSessionById } from '@/lib/oral/repository';
import { GET } from '@/app/api/v1/oral/session/[sessionId]/route';

describe('GET /api/v1/oral/session/[sessionId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retourne 401 si non authentifié', async () => {
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: null,
      errorResponse: new Response(JSON.stringify({ error: 'Non authentifié.' }), { status: 401 }),
    } as never);

    const response = await GET(new Request('http://localhost/api/v1/oral/session/s1'), {
      params: Promise.resolve({ sessionId: 's1' }),
    });

    expect(response.status).toBe(401);
  });

  it('retourne 404 si la session appartient à un autre utilisateur', async () => {
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: { user: { id: 'user-1' } },
      errorResponse: null,
    } as never);
    vi.mocked(findOralSessionById).mockResolvedValue({
      id: 's1',
      userId: 'user-2',
    } as never);

    const response = await GET(new Request('http://localhost/api/v1/oral/session/s1'), {
      params: Promise.resolve({ sessionId: 's1' }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ error: 'Ressource non disponible.' });
  });

  it('retourne la session demandée si elle appartient à l’utilisateur', async () => {
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: { user: { id: 'user-1' } },
      errorResponse: null,
    } as never);
    vi.mocked(findOralSessionById).mockResolvedValue({
      id: 's1',
      userId: 'user-1',
      status: 'FINALIZED',
      mode: 'SIMULATION',
      oeuvre: 'Manon Lescaut',
      extrait: 'Un extrait',
      questionGrammaire: 'Une question',
      score: 12,
      maxScore: 20,
      finalFeedback: { note: 12 },
      createdAt: '2026-03-31T00:00:00.000Z',
      endedAt: null,
      interactions: [{ step: 'LECTURE' }],
    } as never);

    const response = await GET(new Request('http://localhost/api/v1/oral/session/s1'), {
      params: Promise.resolve({ sessionId: 's1' }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.session).toMatchObject({ id: 's1', oeuvre: 'Manon Lescaut' });
    expect(body.session.userId).toBeUndefined();
    expect(body.session.interactions).toBeUndefined();
  });
});
