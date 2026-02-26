import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db/client', () => ({
  prisma: {
    studentProfile: { findUnique: vi.fn() },
    carnetEntry: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
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
import { GET, POST } from '@/app/api/v1/carnet/route';
import { DELETE } from '@/app/api/v1/carnet/[entryId]/route';

const mockAuth = { user: { id: 'user-1', profile: {} } };
const mockProfile = { id: 'profile-1', userId: 'user-1' };
const mockEntry = {
  id: 'entry-1',
  studentId: 'profile-1',
  oeuvre: 'Cahier de Douai',
  auteur: 'Arthur Rimbaud',
  type: 'citation',
  contenu: 'Le cœur voleur',
  page: '12',
  tags: [],
  createdAt: new Date(),
};

describe('GET /api/v1/carnet', () => {
  beforeEach(() => {
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({ auth: mockAuth, errorResponse: null } as never);
    vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue(mockProfile as never);
    vi.mocked(prisma.carnetEntry.findMany).mockResolvedValue([]);
  });

  it('retourne une liste vide pour un nouveau profil', async () => {
    const req = new Request('http://localhost/api/v1/carnet');
    const res = await GET(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.entries).toEqual([]);
  });

  it('filtre par oeuvre si query param fourni', async () => {
    const req = new Request('http://localhost/api/v1/carnet?oeuvre=Cahier+de+Douai');
    await GET(req);
    expect(prisma.carnetEntry.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ oeuvre: 'Cahier de Douai' }),
      }),
    );
  });

  it('retourne 401 si non authentifié', async () => {
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: null,
      errorResponse: new Response('Unauthorized', { status: 401 }),
    } as never);
    const req = new Request('http://localhost/api/v1/carnet');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('retourne 404 si profil inexistant', async () => {
    vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue(null);
    const req = new Request('http://localhost/api/v1/carnet');
    const res = await GET(req);
    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/carnet', () => {
  beforeEach(() => {
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({ auth: mockAuth, errorResponse: null } as never);
    vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue(mockProfile as never);
    vi.mocked(prisma.carnetEntry.create).mockResolvedValue(mockEntry as never);
  });

  it('crée une entrée valide et retourne 201', async () => {
    const req = new Request('http://localhost/api/v1/carnet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        oeuvre: 'Cahier de Douai',
        auteur: 'Arthur Rimbaud',
        type: 'citation',
        contenu: 'Le cœur voleur',
        page: '12',
      }),
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.ok).toBe(true);
    expect(data.entry).toBeDefined();
  });

  it('retourne 400 si type invalide', async () => {
    const req = new Request('http://localhost/api/v1/carnet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        oeuvre: 'Test',
        auteur: 'Test',
        type: 'poeme',
        contenu: 'Test',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('retourne 400 si contenu dépasse 2000 caractères', async () => {
    const req = new Request('http://localhost/api/v1/carnet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        oeuvre: 'Test',
        auteur: 'Test',
        type: 'note',
        contenu: 'x'.repeat(2001),
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('retourne 400 si page dépasse 20 caractères', async () => {
    const req = new Request('http://localhost/api/v1/carnet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        oeuvre: 'Test',
        auteur: 'Test',
        type: 'note',
        contenu: 'Test valide',
        page: '123456789012345678901',
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/v1/carnet/:entryId — IDOR guard', () => {
  it('retourne 404 si l\'entrée appartient à un autre utilisateur', async () => {
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({ auth: mockAuth, errorResponse: null } as never);
    vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue(mockProfile as never);
    vi.mocked(prisma.carnetEntry.findUnique).mockResolvedValue({
      ...mockEntry,
      studentId: 'profile-AUTRE',
    } as never);

    const req = new Request('http://localhost/api/v1/carnet/entry-1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ entryId: 'entry-1' }) });
    expect(res.status).toBe(404);
    expect(prisma.carnetEntry.delete).not.toHaveBeenCalled();
  });

  it('supprime si l\'entrée appartient bien à l\'utilisateur', async () => {
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({ auth: mockAuth, errorResponse: null } as never);
    vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue(mockProfile as never);
    vi.mocked(prisma.carnetEntry.findUnique).mockResolvedValue(mockEntry as never);
    vi.mocked(prisma.carnetEntry.delete).mockResolvedValue(mockEntry as never);

    const req = new Request('http://localhost/api/v1/carnet/entry-1', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ entryId: 'entry-1' }) });
    const data = await res.json();
    expect(data.ok).toBe(true);
  });

  it('retourne 404 si entryId inexistant', async () => {
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({ auth: mockAuth, errorResponse: null } as never);
    vi.mocked(prisma.studentProfile.findUnique).mockResolvedValue(mockProfile as never);
    vi.mocked(prisma.carnetEntry.findUnique).mockResolvedValue(null);

    const req = new Request('http://localhost/api/v1/carnet/inexistant', { method: 'DELETE' });
    const res = await DELETE(req, { params: Promise.resolve({ entryId: 'inexistant' }) });
    expect(res.status).toBe(404);
  });
});
