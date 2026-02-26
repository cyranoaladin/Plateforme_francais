import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/client', () => ({
  prisma: {
    studentProfile: { findUnique: vi.fn() },
  },
}));
vi.mock('@/lib/db/repositories/userRepo', () => ({
  updateUserProfile: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/lib/auth/guard', () => ({
  requireAuthenticatedUser: vi.fn(),
}));
vi.mock('@/lib/security/csrf', () => ({
  validateCsrf: vi.fn().mockResolvedValue(null),
}));

import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { PUT } from '@/app/api/v1/student/oeuvre-choisie/route';

const mockProfile = {
  displayName: 'Test',
  classLevel: 'Première',
  targetScore: '14',
  establishment: null,
  eafDate: null,
  onboardingCompleted: false,
  selectedOeuvres: [],
  classCode: null,
  parcoursProgress: [],
  badges: [],
  preferredObjects: [],
  weakSkills: [],
  oeuvreChoisieEntretien: null,
};

const mockAuth = { user: { id: 'user-1', profile: mockProfile } };

describe('PUT /api/v1/student/oeuvre-choisie', () => {
  beforeEach(() => {
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({ auth: mockAuth, errorResponse: null } as never);
  });

  it('met à jour oeuvreChoisieEntretien et retourne 200', async () => {
    const req = new Request('http://localhost', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oeuvreChoisieEntretien: 'Cahier de Douai — Rimbaud' }),
    });
    const res = await PUT(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
  });

  it('retourne 400 si champ manquant', async () => {
    const req = new Request('http://localhost', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const res = await PUT(req);
    expect(res.status).toBe(400);
  });

  it('retourne 400 si valeur vide', async () => {
    const req = new Request('http://localhost', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oeuvreChoisieEntretien: '' }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(400);
  });

  it('retourne 400 si valeur > 300 caractères', async () => {
    const req = new Request('http://localhost', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oeuvreChoisieEntretien: 'x'.repeat(301) }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(400);
  });

  it('retourne 401 si non authentifié', async () => {
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: null,
      errorResponse: new Response('Unauthorized', { status: 401 }),
    } as never);
    const req = new Request('http://localhost', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oeuvreChoisieEntretien: 'Test' }),
    });
    const res = await PUT(req);
    expect(res.status).toBe(401);
  });
});
