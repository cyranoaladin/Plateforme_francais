import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth/guard', () => ({
  requireAuthenticatedUser: vi.fn(),
}));
vi.mock('@/lib/security/csrf', () => ({
  validateCsrf: vi.fn().mockResolvedValue(null),
}));
vi.mock('@/lib/db/repositories/memoryRepo', () => ({
  createMemoryEventRecord: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/lib/memory/store', () => ({
  createMemoryEvent: vi.fn().mockImplementation((_userId: string, payload: unknown) => payload),
}));

import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { POST } from '@/app/api/v1/student/descriptif/route';

const authOk = { user: { id: 'user-1', profile: {} } };

const makeTexte = (objetEtude: 'poesie' | 'roman' | 'theatre' | 'litterature_idees', idx: number) => ({
  oeuvre: `Oeuvre ${idx}`,
  auteur: `Auteur ${idx}`,
  titre: `Titre ${idx}`,
  objetEtude,
  type: idx % 2 === 0 ? 'extrait_oeuvre' : 'extrait_parcours',
});

describe('POST /api/v1/student/descriptif', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({ auth: authOk, errorResponse: null } as never);
  });

  it('retourne 401 si non authentifié', async () => {
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: null,
      errorResponse: new Response('Unauthorized', { status: 401 }),
    } as never);
    const req = new Request('http://localhost/api/v1/student/descriptif', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ textes: [], oeuvreChoisie: 'X' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('retourne 400 si payload invalide', async () => {
    const req = new Request('http://localhost/api/v1/student/descriptif', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ textes: [] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('accepte un descriptif valide et retourne stats + warnings', async () => {
    const textes = [
      ...Array.from({ length: 5 }, (_, i) => makeTexte('poesie', i)),
      ...Array.from({ length: 5 }, (_, i) => makeTexte('roman', i + 10)),
      ...Array.from({ length: 5 }, (_, i) => makeTexte('theatre', i + 20)),
      ...Array.from({ length: 5 }, (_, i) => makeTexte('litterature_idees', i + 30)),
    ];

    const req = new Request('http://localhost/api/v1/student/descriptif', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ textes, oeuvreChoisie: 'Cahier de Douai' }),
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.stats.totalTextes).toBe(20);
    expect(body.stats.byObjet.poesie).toBe(5);
    expect(Array.isArray(body.warnings)).toBe(true);
  });
});
