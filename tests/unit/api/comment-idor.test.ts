import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { StudentProfile } from '@/lib/auth/types';

const mockPrisma = {
  copieDeposee: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock('@/lib/db/client', () => ({
  isDatabaseAvailable: vi.fn().mockResolvedValue(true),
  prisma: mockPrisma,
}));

vi.mock('@/lib/auth/guard', () => ({
  requireUserRole: vi.fn(),
}));

vi.mock('@/lib/security/csrf', () => ({
  validateCsrf: vi.fn().mockResolvedValue(null),
  CSRF_COOKIE: 'eaf_csrf',
}));

vi.mock('@/lib/validation/request', () => ({
  parseJsonBody: vi.fn().mockResolvedValue({
    success: true,
    data: { comment: 'Bon travail, mais attention aux transitions.' },
  }),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: vi.fn().mockReturnValue({ value: 'csrf-tok' }),
  }),
}));

const baseProfile: StudentProfile = {
  displayName: 'Prof',
  classLevel: 'Ens',
  targetScore: '',
  onboardingCompleted: true,
  selectedOeuvres: [],
  parcoursProgress: [],
  badges: [],
  preferredObjects: [],
  weakSkills: [],
  classCode: 'CLS-A',
};

function makeTeacherAuth(classCode = 'CLS-A') {
  return {
    auth: {
      user: {
        id: 'teach-1',
        role: 'enseignant' as const,
        email: 'prof@eaf.local',
        passwordHash: '',
        passwordSalt: '',
        createdAt: '2026-01-01',
        profile: { ...baseProfile, classCode },
      },
      token: 'tok',
    },
    errorResponse: null,
  };
}

describe('POST /api/v1/enseignant/corrections/{copieId}/comment — IDOR protection', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const { requireUserRole } = await import('@/lib/auth/guard');
    vi.mocked(requireUserRole).mockResolvedValue(makeTeacherAuth('CLS-A'));
    mockPrisma.copieDeposee.update.mockResolvedValue({ id: 'copie-1' });
  });

  it('autorise le commentaire si classCode enseignant = classCode élève', async () => {
    mockPrisma.copieDeposee.findUnique.mockResolvedValue({
      id: 'copie-1',
      correction: {},
      user: {
        id: 'stu-1',
        profile: { classCode: 'CLS-A' },
      },
    });

    const { POST } = await import(
      '@/app/api/v1/enseignant/corrections/[copieId]/comment/route'
    );
    const req = new Request('http://localhost/api/v1/enseignant/corrections/copie-1/comment', {
      method: 'POST',
      body: JSON.stringify({ comment: 'Bien' }),
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': 'tok' },
    });
    const res = await POST(req, { params: Promise.resolve({ copieId: 'copie-1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('bloque (403) si classCode enseignant ≠ classCode élève (IDOR)', async () => {
    mockPrisma.copieDeposee.findUnique.mockResolvedValue({
      id: 'copie-2',
      correction: {},
      user: {
        id: 'stu-other',
        profile: { classCode: 'CLS-B' },
      },
    });

    const { POST } = await import(
      '@/app/api/v1/enseignant/corrections/[copieId]/comment/route'
    );
    const req = new Request('http://localhost/api/v1/enseignant/corrections/copie-2/comment', {
      method: 'POST',
      body: JSON.stringify({ comment: 'Test IDOR' }),
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': 'tok' },
    });
    const res = await POST(req, { params: Promise.resolve({ copieId: 'copie-2' }) });
    expect(res.status).toBe(403);
  });

  it('retourne 404 si copie introuvable', async () => {
    mockPrisma.copieDeposee.findUnique.mockResolvedValue(null);

    const { POST } = await import(
      '@/app/api/v1/enseignant/corrections/[copieId]/comment/route'
    );
    const req = new Request('http://localhost/api/v1/enseignant/corrections/copie-xxx/comment', {
      method: 'POST',
      body: JSON.stringify({ comment: 'ghost' }),
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': 'tok' },
    });
    const res = await POST(req, { params: Promise.resolve({ copieId: 'copie-xxx' }) });
    expect(res.status).toBe(404);
  });

  it('retourne 503 si base de données indisponible', async () => {
    const { isDatabaseAvailable } = await import('@/lib/db/client');
    vi.mocked(isDatabaseAvailable).mockResolvedValue(false);

    const { POST } = await import(
      '@/app/api/v1/enseignant/corrections/[copieId]/comment/route'
    );
    const req = new Request('http://localhost/api/v1/enseignant/corrections/copie-1/comment', {
      method: 'POST',
      body: JSON.stringify({ comment: 'offline' }),
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': 'tok' },
    });
    const res = await POST(req, { params: Promise.resolve({ copieId: 'copie-1' }) });
    expect(res.status).toBe(503);
  });

  it('bloque (403) si enseignant sans classCode configuré', async () => {
    const { requireUserRole } = await import('@/lib/auth/guard');
    vi.mocked(requireUserRole).mockResolvedValue(makeTeacherAuth(''));

    const { isDatabaseAvailable } = await import('@/lib/db/client');
    vi.mocked(isDatabaseAvailable).mockResolvedValue(true);

    mockPrisma.copieDeposee.findUnique.mockResolvedValue({
      id: 'copie-3',
      correction: {},
      user: { id: 'stu-3', profile: { classCode: 'CLS-A' } },
    });

    const { POST } = await import(
      '@/app/api/v1/enseignant/corrections/[copieId]/comment/route'
    );
    const req = new Request('http://localhost/', {
      method: 'POST',
      body: JSON.stringify({ comment: 'no class' }),
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': 'tok' },
    });
    const res = await POST(req, { params: Promise.resolve({ copieId: 'copie-3' }) });
    expect(res.status).toBe(403);
  });
});
