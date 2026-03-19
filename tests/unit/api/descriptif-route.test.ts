import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/auth/guard', () => ({
  requireAuthenticatedUser: vi.fn(),
}));
vi.mock('@/lib/security/csrf', () => ({
  validateCsrf: vi.fn().mockResolvedValue(null),
}));
vi.mock('@/lib/db/client', () => ({
  prisma: {
    studentProfile: {
      findUnique: vi.fn(),
    },
    descriptifTexte: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/client';
import { GET, POST } from '@/app/api/v1/student/descriptif/route';

const authOk = { user: { id: 'user-1', profile: {} } };

describe('GET /api/v1/student/descriptif', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({ auth: authOk, errorResponse: null } as never);
  });

  it('retourne les textes du descriptif', async () => {
    vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue({ id: 'profile-1' } as never);
    vi.mocked(prisma.descriptifTexte.findMany).mockResolvedValue([
      { id: '1', objetEtude: 'roman', oeuvre: 'Manon Lescaut', auteur: 'Prévost', typeExtrait: 'extrait_oeuvre', titre: 'La rencontre', premieresLignes: null },
    ] as never);

    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.textes).toHaveLength(1);
    expect(body.textes[0].oeuvre).toBe('Manon Lescaut');
  });

  it('retourne tableau vide si pas de profil', async () => {
    vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue(null);

    const res = await GET();
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.textes).toEqual([]);
  });
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
      body: JSON.stringify({ textes: [{ objetEtude: 'roman', oeuvre: 'X', auteur: 'Y', typeExtrait: 'extrait_oeuvre', titre: 'Z' }] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('retourne 400 si payload vide', async () => {
    const req = new Request('http://localhost/api/v1/student/descriptif', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ textes: [] }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('sauvegarde les textes et retourne ok + count', async () => {
    vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue({ id: 'profile-1' } as never);
    vi.mocked(prisma.$transaction).mockResolvedValue(undefined as never);

    const textes = [
      { objetEtude: 'roman', oeuvre: 'Manon Lescaut', auteur: 'Prévost', typeExtrait: 'extrait_oeuvre', titre: 'La rencontre' },
      { objetEtude: 'poesie', oeuvre: 'Cahier de Douai', auteur: 'Rimbaud', typeExtrait: 'extrait_oeuvre', titre: 'Ma Bohème' },
      { objetEtude: 'theatre', oeuvre: 'Le Menteur', auteur: 'Corneille', typeExtrait: 'extrait_oeuvre', titre: 'Acte I' },
    ];

    const req = new Request('http://localhost/api/v1/student/descriptif', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ textes }),
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.count).toBe(3);
  });
});
