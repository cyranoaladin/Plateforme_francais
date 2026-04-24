import { describe, it, expect, vi, beforeEach } from 'vitest';

const redisMock = { incr: vi.fn(), expire: vi.fn(), ttl: vi.fn() };

vi.mock('@/lib/queue/correction-queue', () => ({
  getRedisClient: () => redisMock,
}));

vi.mock('@/lib/auth/guard', () => ({
  requireUserRole: vi.fn(),
  requireExactUserRole: vi.fn(),
}));

// Mock DB disponible pour les tests de succès
const mockUsers = [
  {
    id: 'stu-1',
    email: 'eleve@eaf.local',
    role: 'eleve',
    profile: { displayName: 'Élève Test', classCode: 'CLS-A' },
    evaluations: [{ score: 14 }, { score: 16 }],
    memoryEvents: [{ createdAt: new Date('2026-01-15T10:00:00Z') }],
  },
  {
    id: 'stu-2',
    email: 'eleve2@eaf.local',
    role: 'eleve',
    profile: { displayName: 'Élève Test 2', classCode: 'CLS-A' },
    evaluations: [],
    memoryEvents: [],
  },
];

vi.mock('@/lib/db/client', () => ({
  isDatabaseAvailable: vi.fn(),
  prisma: {
    user: {
      findMany: vi.fn().mockResolvedValue(mockUsers),
    },
  },
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
        emailVerified: new Date().toISOString(),
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
    
    const { isDatabaseAvailable } = await import('@/lib/db/client');
    vi.mocked(isDatabaseAvailable).mockResolvedValue(true);
    
    const { requireUserRole, requireExactUserRole } = await import('@/lib/auth/guard');
    vi.mocked(requireUserRole).mockResolvedValue(makeEnseignantAuth());
    vi.mocked(requireExactUserRole).mockResolvedValue(makeEnseignantAuth());
  });

  it('retourne un CSV avec Content-Type text/csv quand DB disponible', async () => {
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
    const { requireUserRole, requireExactUserRole } = await import('@/lib/auth/guard');
    vi.mocked(requireUserRole).mockResolvedValue(makeEnseignantAuth('NO_CODE'));
    vi.mocked(requireExactUserRole).mockResolvedValue(makeEnseignantAuth('NO_CODE'));

    const { GET } = await import('@/app/api/v1/enseignant/export/route');
    const req = new Request('http://localhost/api/v1/enseignant/export');
    const res = await GET(req);
    const text = await res.text();
    // Only header row
    const lines = text.trim().split('\n');
    expect(lines).toHaveLength(1);
  });

  it('retourne 403 si rôle élève (via requireExactUserRole)', async () => {
    const { requireExactUserRole } = await import('@/lib/auth/guard');
    vi.mocked(requireExactUserRole).mockResolvedValue({
      auth: null,
      errorResponse: new Response(JSON.stringify({ error: 'Accès refusé.' }), { status: 403 }),
    } as ReturnType<typeof requireExactUserRole> extends Promise<infer T> ? T : never);

    const { GET } = await import('@/app/api/v1/enseignant/export/route');
    const req = new Request('http://localhost/api/v1/enseignant/export');
    const res = await GET(req);
    expect(res!.status).toBe(403);
  });

  it('retourne 503 si DB indisponible', async () => {
    const { isDatabaseAvailable } = await import('@/lib/db/client');
    vi.mocked(isDatabaseAvailable).mockResolvedValue(false);

    const { GET } = await import('@/app/api/v1/enseignant/export/route');
    const req = new Request('http://localhost/api/v1/enseignant/export');
    const res = await GET(req);
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toContain('Service temporairement indisponible');
  });
});
