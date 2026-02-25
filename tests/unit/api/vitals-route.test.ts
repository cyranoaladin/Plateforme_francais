import { describe, it, expect, vi, beforeEach } from 'vitest';

const redisMock = { get: vi.fn(), set: vi.fn() };

vi.mock('@/lib/queue/correction-queue', () => ({
  getRedisClient: () => redisMock,
}));

vi.mock('@/lib/auth/guard', () => ({
  requireAuthenticatedUser: vi.fn(),
}));

function makeAuthResult(role = 'eleve' as const) {
  return {
    auth: {
      user: {
        id: 'user-1',
        role,
        email: 'test@eaf.local',
        passwordHash: '',
        passwordSalt: '',
        createdAt: '2026-01-01T00:00:00Z',
        profile: {
          displayName: 'Test',
          classLevel: '1ère',
          targetScore: '14',
          onboardingCompleted: true,
          selectedOeuvres: [],
          parcoursProgress: [],
          badges: [],
          preferredObjects: [],
          weakSkills: [],
        },
      },
      token: 'test-token',
    },
    errorResponse: null,
  };
}

describe('POST /api/v1/metrics/vitals', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    redisMock.get.mockResolvedValue(null);
    redisMock.set.mockResolvedValue('OK');
    const { requireAuthenticatedUser } = await import('@/lib/auth/guard');
    vi.mocked(requireAuthenticatedUser).mockResolvedValue(makeAuthResult());
  });

  it('accepte une métrique LCP valide', async () => {
    const { POST } = await import('@/app/api/v1/metrics/vitals/route');
    const req = new Request('http://localhost/api/v1/metrics/vitals', {
      method: 'POST',
      body: JSON.stringify({ name: 'LCP', value: 1200 }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
  });

  it.each(['LCP', 'FID', 'CLS', 'TTFB', 'INP'])('accepte la métrique %s', async (name) => {
    const { POST } = await import('@/app/api/v1/metrics/vitals/route');
    const req = new Request('http://localhost/', {
      method: 'POST',
      body: JSON.stringify({ name, value: 500 }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    expect(response.status).toBe(200);
  });

  it('rejette une métrique inconnue', async () => {
    const { POST } = await import('@/app/api/v1/metrics/vitals/route');
    const req = new Request('http://localhost/', {
      method: 'POST',
      body: JSON.stringify({ name: 'UNKNOWN_METRIC', value: 100 }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('rejette une valeur négative', async () => {
    const { POST } = await import('@/app/api/v1/metrics/vitals/route');
    const req = new Request('http://localhost/', {
      method: 'POST',
      body: JSON.stringify({ name: 'LCP', value: -100 }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('rejette un body JSON invalide', async () => {
    const { POST } = await import('@/app/api/v1/metrics/vitals/route');
    const req = new Request('http://localhost/', {
      method: 'POST',
      body: 'not-json',
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('rejette une valeur > 60000', async () => {
    const { POST } = await import('@/app/api/v1/metrics/vitals/route');
    const req = new Request('http://localhost/', {
      method: 'POST',
      body: JSON.stringify({ name: 'LCP', value: 70000 }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });
});
