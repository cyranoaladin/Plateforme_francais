import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MemoryEvent, StudentProfile } from '@/lib/auth/types';

const mockProfile: StudentProfile = {
  displayName: 'Test',
  classLevel: '1ère',
  targetScore: '14',
  onboardingCompleted: true,
  selectedOeuvres: [],
  parcoursProgress: [],
  badges: [],
  preferredObjects: [],
  weakSkills: [],
};

const mockTimeline: MemoryEvent[] = [
  {
    id: 'ev-1',
    userId: 'user-1',
    type: 'evaluation',
    feature: 'atelier_ecrit',
    payload: { weakSkills: ['ecrit_plan', 'ecrit_citations'] },
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: 'ev-2',
    userId: 'user-1',
    type: 'evaluation',
    feature: 'atelier_ecrit',
    payload: { weakSkills: ['ecrit_plan'] },
    createdAt: '2026-01-11T10:00:00Z',
  },
  {
    id: 'ev-3',
    userId: 'user-1',
    type: 'interaction',
    feature: 'tuteur',
    createdAt: '2026-01-12T10:00:00Z',
  },
];

vi.mock('@/lib/auth/guard', () => ({
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock('@/lib/db/repositories/memoryRepo', () => ({
  listMemoryEventsByUser: vi.fn(),
}));

function makeAuth() {
  return {
    auth: {
      user: {
        id: 'user-1',
        role: 'eleve' as const,
        email: 'test@eaf.local',
        passwordHash: '',
        passwordSalt: '',
        createdAt: '2026-01-01',
        profile: mockProfile,
      },
      token: 'tok',
    },
    errorResponse: null,
  };
}

describe('GET /api/v1/memory/timeline', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const { requireAuthenticatedUser } = await import('@/lib/auth/guard');
    vi.mocked(requireAuthenticatedUser).mockResolvedValue(makeAuth());
    const { listMemoryEventsByUser } = await import('@/lib/db/repositories/memoryRepo');
    vi.mocked(listMemoryEventsByUser).mockResolvedValue(mockTimeline);
  });

  it('retourne le profil, timeline et weakSignals', async () => {
    const { GET } = await import('@/app/api/v1/memory/timeline/route');
    const req = new Request('http://localhost/api/v1/memory/timeline');
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.profile).toBeDefined();
    expect(body.timeline).toHaveLength(3);
    expect(body.weakSignals).toBeDefined();
    // ecrit_plan appears 2 times in evaluation events
    expect(body.weakSignals.ecrit_plan).toBe(2);
    expect(body.weakSignals.ecrit_citations).toBe(1);
  });

  it('respecte le paramètre limit', async () => {
    const { listMemoryEventsByUser } = await import('@/lib/db/repositories/memoryRepo');
    vi.mocked(listMemoryEventsByUser).mockResolvedValue([mockTimeline[0]]);

    const { GET } = await import('@/app/api/v1/memory/timeline/route');
    const req = new Request('http://localhost/api/v1/memory/timeline?limit=1');
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(listMemoryEventsByUser).toHaveBeenCalledWith('user-1', 1);
  });

  it('borne limit entre 1 et 200', async () => {
    const { listMemoryEventsByUser } = await import('@/lib/db/repositories/memoryRepo');
    vi.mocked(listMemoryEventsByUser).mockResolvedValue([]);

    const { GET } = await import('@/app/api/v1/memory/timeline/route');
    const req = new Request('http://localhost/api/v1/memory/timeline?limit=999');
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(listMemoryEventsByUser).toHaveBeenCalledWith('user-1', 200);
  });

  it('retourne 401 si non authentifié', async () => {
    const { requireAuthenticatedUser } = await import('@/lib/auth/guard');
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: null,
      errorResponse: new Response(JSON.stringify({ error: 'Non authentifié.' }), { status: 401 }),
    } as ReturnType<typeof requireAuthenticatedUser> extends Promise<infer T> ? T : never);

    const { GET } = await import('@/app/api/v1/memory/timeline/route');
    const req = new Request('http://localhost/api/v1/memory/timeline');
    const res = await GET(req);
    expect(res!.status).toBe(401);
  });
});
