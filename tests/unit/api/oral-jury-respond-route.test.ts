import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/guard', () => ({
  requireAuthenticatedUser: vi.fn(),
}));
vi.mock('@/lib/security/csrf', () => ({
  validateCsrf: vi.fn().mockResolvedValue(null),
}));
vi.mock('@/lib/llm/orchestrator', () => ({
  orchestrate: vi.fn(),
}));
vi.mock('@/lib/tts/generator', () => ({
  generateTtsUrl: vi.fn().mockResolvedValue(null),
}));

import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { orchestrate } from '@/lib/llm/orchestrator';

describe('POST /api/v1/oral/jury-respond', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: { user: { id: 'u1', profile: {} } },
      errorResponse: null,
    } as never);
  });

  it('retourne une relance issue du skill examinateur_virtuel', async () => {
    vi.mocked(orchestrate).mockResolvedValueOnce({
      questions: [
        { question: 'Pourquoi ce choix de parcours ?', difficulte: 2 },
        { question: 'Proposez une lecture opposée.', difficulte: 3 },
      ],
      consigne_examinateur: 'Réponse argumentée.',
    } as never);

    const { POST } = await import('@/app/api/v1/oral/jury-respond/route');
    const req = new Request('http://localhost/api/v1/oral/jury-respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'tok' },
      body: JSON.stringify({
        message: 'Je pense que...',
        oeuvreChoisie: 'Cahier de Douai',
        examinerProfile: 'HOSTILE',
        conversationHistory: [{ role: 'eleve', content: 'Réponse 1' }],
      }),
    });

    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.juryText).toBeTruthy();
    expect(vi.mocked(orchestrate).mock.calls[0]?.[0]).toMatchObject({
      skill: 'examinateur_virtuel',
      userId: 'u1',
    });
  });

  it('fallback sur oral_entretien si examinateur_virtuel échoue', async () => {
    vi.mocked(orchestrate)
      .mockRejectedValueOnce(new Error('upstream fail'))
      .mockResolvedValueOnce({ relance: 'Peux-tu justifier avec une citation ?' } as never);

    const { POST } = await import('@/app/api/v1/oral/jury-respond/route');
    const req = new Request('http://localhost/api/v1/oral/jury-respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'tok' },
      body: JSON.stringify({ message: 'Test' }),
    });

    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.juryText).toContain('citation');
    expect(vi.mocked(orchestrate).mock.calls[1]?.[0]).toMatchObject({
      skill: 'oral_entretien',
      userId: 'u1',
    });
  });
});
