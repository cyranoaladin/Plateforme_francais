import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/client', () => ({
  prisma: {
    studentProfile: { findUnique: vi.fn() },
  },
}));
vi.mock('@/lib/auth/guard', () => ({
  requireAuthenticatedUser: vi.fn(),
}));
vi.mock('@/lib/security/csrf', () => ({
  validateCsrf: vi.fn().mockResolvedValue(null),
}));
vi.mock('@/lib/oral/repository', () => ({
  findOralSessionById: vi.fn(),
  appendOralInteraction: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/lib/oral/service', () => ({
  evaluateOralPhase: vi.fn().mockResolvedValue({
    feedback: 'Très bien.',
    score: 7,
    max: 8,
    points_forts: [],
    axes: [],
  }),
}));
vi.mock('@/lib/oral/scoring', () => ({
  PHASE_MAX_SCORES: { LECTURE: 2, EXPLICATION: 8, GRAMMAIRE: 2, ENTRETIEN: 8 },
}));

import { prisma } from '@/lib/db/client';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { findOralSessionById } from '@/lib/oral/repository';
import { evaluateOralPhase } from '@/lib/oral/service';
import { POST } from '@/app/api/v1/oral/session/[sessionId]/interact/route';

const mockAuth = { user: { id: 'user-1' } };
const mockSession = {
  id: 'session-1',
  userId: 'user-1',
  oeuvre: 'Manon Lescaut',
  extrait: 'Il était une fois...',
  questionGrammaire: 'Analysez la subordonnée relative.',
};

describe('POST /api/v1/oral/session/:id/interact — ENTRETIEN phase', () => {
  beforeEach(() => {
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: mockAuth,
      errorResponse: null,
    } as never);
    vi.mocked(findOralSessionById).mockResolvedValue(mockSession as never);
    vi.mocked(evaluateOralPhase).mockClear();
  });

  it("passe oeuvreChoisieEntretien au service quand le profil l'a renseignée", async () => {
    vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue({
      id: 'profile-1',
      oeuvreChoisieEntretien: 'Manon Lescaut — Abbé Prévost',
    } as never);

    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'tok' },
      body: JSON.stringify({
        step: 'ENTRETIEN',
        transcript: 'Je présente Manon Lescaut.',
        duration: 480,
      }),
    });

    await POST(req, { params: Promise.resolve({ sessionId: 'session-1' }) });

    expect(evaluateOralPhase).toHaveBeenCalledWith(
      expect.objectContaining({
        phase: 'ENTRETIEN',
        oeuvreChoisieEntretien: 'Manon Lescaut — Abbé Prévost',
      }),
    );
  });

  it("passe null si le profil n'a pas renseigné oeuvreChoisieEntretien", async () => {
    vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue({
      id: 'profile-1',
      oeuvreChoisieEntretien: null,
    } as never);

    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'tok' },
      body: JSON.stringify({
        step: 'ENTRETIEN',
        transcript: 'Je ne sais pas quelle œuvre.',
        duration: 480,
      }),
    });

    await POST(req, { params: Promise.resolve({ sessionId: 'session-1' }) });

    expect(evaluateOralPhase).toHaveBeenCalledWith(
      expect.objectContaining({
        oeuvreChoisieEntretien: null,
      }),
    );
  });

  it('passe bien les données de session à evaluateOralPhase pour GRAMMAIRE', async () => {
    vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue({
      id: 'profile-1',
      oeuvreChoisieEntretien: 'Manon Lescaut',
    } as never);

    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'tok' },
      body: JSON.stringify({
        step: 'GRAMMAIRE',
        transcript: "C'est une subordonnée relative.",
        duration: 120,
      }),
    });

    await POST(req, { params: Promise.resolve({ sessionId: 'session-1' }) });

    expect(evaluateOralPhase).toHaveBeenCalledWith(
      expect.objectContaining({
        phase: 'GRAMMAIRE',
        oeuvre: 'Manon Lescaut',
        extrait: mockSession.extrait,
      }),
    );
  });

  it("retourne 404 si la session n'appartient pas à l'utilisateur", async () => {
    vi.mocked(findOralSessionById).mockResolvedValue({
      ...mockSession,
      userId: 'autre-user',
    } as never);

    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'tok' },
      body: JSON.stringify({
        step: 'ENTRETIEN',
        transcript: 'Test.',
        duration: 100,
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ sessionId: 'session-1' }) });
    expect(res.status).toBe(404);
    expect(evaluateOralPhase).not.toHaveBeenCalled();
  });

  it('retourne 400 si la phase est invalide', async () => {
    vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue({
      id: 'profile-1',
      oeuvreChoisieEntretien: null,
    } as never);

    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'tok' },
      body: JSON.stringify({
        step: 'PHASE_INEXISTANTE',
        transcript: 'Test.',
        duration: 100,
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ sessionId: 'session-1' }) });
    expect(res.status).toBe(400);
  });

  it('retourne 200 avec le résultat de évaluation pour LECTURE', async () => {
    vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue({
      id: 'profile-1',
      oeuvreChoisieEntretien: null,
    } as never);

    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': 'tok' },
      body: JSON.stringify({
        step: 'LECTURE',
        transcript: 'Lecture fluide.',
        duration: 90,
      }),
    });

    const res = await POST(req, { params: Promise.resolve({ sessionId: 'session-1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('feedback');
    expect(body).toHaveProperty('score');
  });
});
