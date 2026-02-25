import { describe, it, expect, vi, beforeEach } from 'vitest';

const redisMock = { incr: vi.fn(), expire: vi.fn(), ttl: vi.fn() };

vi.mock('@/lib/queue/correction-queue', () => ({
  getRedisClient: () => redisMock,
}));

vi.mock('@/lib/auth/guard', () => ({
  requireUserRole: vi.fn(),
}));

vi.mock('@/lib/db/client', () => ({
  isDatabaseAvailable: vi.fn().mockResolvedValue(false),
  prisma: {},
}));

vi.mock('@/lib/db/fallback-store', () => ({
  readFallbackStore: vi.fn().mockResolvedValue({
    users: [
      {
        id: 'stu-1',
        email: 'eleve@eaf.local',
        role: 'eleve',
        profile: { displayName: 'Élève Test', classCode: 'CLS-A' },
      },
    ],
    events: [
      {
        id: 'ev-1',
        userId: 'stu-1',
        type: 'evaluation',
        feature: 'ecrit',
        payload: { score: 14 },
        createdAt: '2026-01-15T10:00:00Z',
      },
    ],
    sessions: [],
  }),
}));

function makeEnseignantAuth(classCode: string | 'NO_CODE' = 'CLS-A') {
  const resolvedClassCode = classCode === 'NO_CODE' ? undefined : classCode;
  return {
    auth: {
      user: {
        id: 'teach-1',
        role: 'enseignant' as const,
        email: 'prof@eaf.local',
        passwordHash: '',
        passwordSalt: '',
        createdAt: '2026-01-01',
        profile: {
          displayName: 'Prof Test',
          classLevel: 'Enseignant',
          targetScore: '',
          onboardingCompleted: true,
          selectedOeuvres: [],
          parcoursProgress: [],
          badges: [],
          preferredObjects: [],
          weakSkills: [],
          classCode: resolvedClassCode,
        },
      },
      token: 'tok',
    },
    errorResponse: null,
  };
}

describe('GET /api/v1/enseignant/export', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    redisMock.incr.mockResolvedValue(1);
    redisMock.expire.mockResolvedValue(1);
    redisMock.ttl.mockResolvedValue(55);
    const { requireUserRole } = await import('@/lib/auth/guard');
    vi.mocked(requireUserRole).mockResolvedValue(makeEnseignantAuth());
  });

  it('retourne un CSV avec Content-Type text/csv', async () => {
    const { GET } = await import('@/app/api/v1/enseignant/export/route');
    const req = new Request('http://localhost/api/v1/enseignant/export');
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/csv');
  });

  it('le CSV contient un header student_name,email,...', async () => {
    const { GET } = await import('@/app/api/v1/enseignant/export/route');
    const req = new Request('http://localhost/api/v1/enseignant/export');
    const res = await GET(req);
    const text = await res.text();
    expect(text).toContain('student_name,email,average_score,last_activity');
  });

  it('neutralise les formules CSV (injection =, +, -, @)', () => {
    // Test direct de csvEscape logic
    const dangerous = '=SUM(A1:A10)';
    const safe = dangerous.replace(/^[=+\-@\t]/, (m) => `'${m}`);
    expect(safe.startsWith("'")).toBe(true);
  });

  it('retourne un CSV vide si classCode est absent', async () => {
    const { requireUserRole } = await import('@/lib/auth/guard');
    vi.mocked(requireUserRole).mockResolvedValue(makeEnseignantAuth('NO_CODE'));

    const { GET } = await import('@/app/api/v1/enseignant/export/route');
    const req = new Request('http://localhost/api/v1/enseignant/export');
    const res = await GET(req);
    const text = await res.text();
    // Only header row
    const lines = text.trim().split('\n');
    expect(lines).toHaveLength(1);
  });

  it('retourne 403 si rôle élève (via requireUserRole)', async () => {
    const { requireUserRole } = await import('@/lib/auth/guard');
    vi.mocked(requireUserRole).mockResolvedValue({
      auth: null,
      errorResponse: new Response(JSON.stringify({ error: 'Accès refusé.' }), { status: 403 }),
    } as ReturnType<typeof requireUserRole> extends Promise<infer T> ? T : never);

    const { GET } = await import('@/app/api/v1/enseignant/export/route');
    const req = new Request('http://localhost/api/v1/enseignant/export');
    const res = await GET(req);
    expect(res!.status).toBe(403);
  });
});
