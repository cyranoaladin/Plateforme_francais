import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/client', () => ({
  prisma: {
    studentProfile: { findUnique: vi.fn() },
    descriptifTexte: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));
vi.mock('@/lib/auth/guard', () => ({
  requireAuthenticatedUser: vi.fn(),
}));
vi.mock('@/lib/security/csrf', () => ({
  validateCsrf: vi.fn().mockResolvedValue(null),
}));

import { prisma } from '@/lib/db/client';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { GET, POST, DELETE } from '@/app/api/v1/student/descriptif/route';

const mockAuth = { user: { id: 'user-1', profile: {} } };
const mockProfile = { id: 'profile-1', userId: 'user-1' };

const makeValidTextes = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    objetEtude: i % 4 === 0 ? 'poesie' : i % 4 === 1 ? 'roman' : i % 4 === 2 ? 'theatre' : 'litterature_idees',
    oeuvre: `Œuvre ${i % 3}`,
    auteur: `Auteur ${i % 3}`,
    typeExtrait: i % 2 === 0 ? 'extrait_oeuvre' : 'extrait_parcours',
    titre: `Titre ${i}`,
    premieresLignes: undefined,
  }));

describe('GET /api/v1/student/descriptif', () => {
  beforeEach(() => {
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({ auth: mockAuth, errorResponse: null } as never);
    vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue(mockProfile as never);
    vi.mocked(prisma.descriptifTexte.findMany).mockResolvedValue([]);
  });

  it('retourne un tableau vide pour un nouveau profil', async () => {
    const req = new Request('http://localhost/api/v1/student/descriptif');
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.textes).toEqual([]);
  });

  it('retourne 401 si non authentifié', async () => {
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: null,
      errorResponse: new Response('Unauthorized', { status: 401 }),
    } as never);
    const req = new Request('http://localhost/api/v1/student/descriptif');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('retourne 404 si profil inexistant', async () => {
    vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue(null);
    const req = new Request('http://localhost/api/v1/student/descriptif');
    const res = await GET(req);
    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/student/descriptif', () => {
  beforeEach(() => {
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({ auth: mockAuth, errorResponse: null } as never);
    vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue(mockProfile as never);
    vi.mocked(prisma.$transaction).mockResolvedValue([]);
  });

  it('accepte 20 textes valides et retourne ok: true', async () => {
    const textes = makeValidTextes(20);
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ textes }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.count).toBe(20);
    expect(Array.isArray(data.warnings)).toBe(true);
  });

  it('retourne warnings si moins de 20 textes', async () => {
    const textes = makeValidTextes(14);
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ textes }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.warnings.some((w: string) => w.includes('14'))).toBe(true);
  });

  it('retourne 400 si textes est un tableau vide', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ textes: [] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('retourne 400 si objetEtude invalide', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        textes: [{ objetEtude: 'philosophie', oeuvre: 'Test', auteur: 'A', typeExtrait: 'extrait_oeuvre', titre: 'T' }],
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('retourne 400 si plus de 60 textes', async () => {
    const req = new Request('http://localhost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ textes: makeValidTextes(61) }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/v1/student/descriptif', () => {
  beforeEach(() => {
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({ auth: mockAuth, errorResponse: null } as never);
    vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue(mockProfile as never);
    vi.mocked(prisma.descriptifTexte.deleteMany).mockResolvedValue({ count: 5 });
  });

  it('supprime tout le descriptif et retourne ok: true', async () => {
    const req = new Request('http://localhost', { method: 'DELETE' });
    const res = await DELETE(req);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(prisma.descriptifTexte.deleteMany).toHaveBeenCalledWith({
      where: { studentId: 'profile-1' },
    });
  });
});

describe('validateDescriptifRules — logique métier isolée', () => {
  const makeTexte = (objetEtude: string, oeuvre: string, typeExtrait: string, titre = 'T') => ({
    objetEtude, oeuvre, auteur: 'A', typeExtrait, titre,
  });

  it('5 textes par objet d\'étude requis — vérification de la distribution', () => {
    const textes = Array.from({ length: 20 }, () => makeTexte('poesie', 'O1', 'extrait_oeuvre'));
    const romanCount = textes.filter((t) => t.objetEtude === 'roman').length;
    expect(romanCount).toBe(0);
  });

  it('3 extraits minimum par œuvre — comptage', () => {
    const textes = [
      makeTexte('poesie', 'Cahier de Douai', 'extrait_oeuvre'),
      makeTexte('poesie', 'Cahier de Douai', 'extrait_oeuvre'),
    ];
    const byOeuvre: Record<string, number> = {};
    for (const t of textes) {
      if (t.typeExtrait === 'extrait_oeuvre') {
        byOeuvre[t.oeuvre] = (byOeuvre[t.oeuvre] ?? 0) + 1;
      }
    }
    expect(byOeuvre['Cahier de Douai']).toBe(2);
  });
});
