import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * Tests Lot 3-A : Vérifier timing-safe auth pour session-cleanup cron.
 *
 * Objectif : Protéger contre timing attacks sur CRON_SECRET.
 * Scope : F-002 / Lot 3-A
 */

const mockPrisma = {
  session: {
    deleteMany: vi.fn(),
  },
};

vi.mock('@/lib/db/client', () => ({
  prisma: mockPrisma,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock('@/lib/copy/fr', () => ({
  copy: {
    api: {
      cron: {
        serverMisconfigured: 'CRON_SECRET not configured',
        unauthorized: 'Unauthorized',
      },
    },
  },
}));

describe('GET /api/v1/cron/session-cleanup - Timing-safe auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    mockPrisma.session.deleteMany.mockResolvedValue({ count: 5 });
  });

  it('retourne 500 si CRON_SECRET absent (fail-closed)', async () => {
    vi.stubEnv('CRON_SECRET', '');

    const { GET } = await import('@/app/api/v1/cron/session-cleanup/route');

    const request = new NextRequest('http://localhost:3000/api/v1/cron/session-cleanup', {
      headers: { authorization: 'Bearer test-secret' },
    });

    const response = await GET(request);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBeDefined();
    expect(mockPrisma.session.deleteMany).not.toHaveBeenCalled();
  });

  it('retourne 401 si secret invalide (timing-safe)', async () => {
    vi.stubEnv('CRON_SECRET', 'correct-secret-123');

    const { GET } = await import('@/app/api/v1/cron/session-cleanup/route');

    const request = new NextRequest('http://localhost:3000/api/v1/cron/session-cleanup', {
      headers: { authorization: 'Bearer wrong-secret-456' },
    });

    const response = await GET(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBeDefined();
    expect(mockPrisma.session.deleteMany).not.toHaveBeenCalled();
  });

  it('retourne 401 si header Authorization manquant', async () => {
    vi.stubEnv('CRON_SECRET', 'correct-secret-123');

    const { GET } = await import('@/app/api/v1/cron/session-cleanup/route');

    const request = new NextRequest('http://localhost:3000/api/v1/cron/session-cleanup');

    const response = await GET(request);

    expect(response.status).toBe(401);
    expect(mockPrisma.session.deleteMany).not.toHaveBeenCalled();
  });

  it('retourne 401 si Authorization header mal formé (pas Bearer)', async () => {
    vi.stubEnv('CRON_SECRET', 'correct-secret-123');

    const { GET } = await import('@/app/api/v1/cron/session-cleanup/route');

    const request = new NextRequest('http://localhost:3000/api/v1/cron/session-cleanup', {
      headers: { authorization: 'Basic dGVzdDp0ZXN0' },
    });

    const response = await GET(request);

    expect(response.status).toBe(401);
    expect(mockPrisma.session.deleteMany).not.toHaveBeenCalled();
  });

  it('exécute cleanup si secret valide (200)', async () => {
    vi.stubEnv('CRON_SECRET', 'correct-secret-123');

    const { GET } = await import('@/app/api/v1/cron/session-cleanup/route');

    const request = new NextRequest('http://localhost:3000/api/v1/cron/session-cleanup', {
      headers: { authorization: 'Bearer correct-secret-123' },
    });

    const response = await GET(request);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.deletedSessions).toBe(5);
    expect(mockPrisma.session.deleteMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { expiresAt: { lt: expect.any(Date) } },
          { lastSeenAt: { lt: expect.any(Date) } },
        ],
      },
    });
  });

  it('utilise timingSafeEqual (vérification code source)', async () => {
    const fs = await import('fs');
    const path = await import('path');

    const routeCode = fs.readFileSync(
      path.resolve(process.cwd(), 'src/app/api/v1/cron/session-cleanup/route.ts'),
      'utf8',
    );

    expect(routeCode).toContain("import { timingSafeEqual } from 'node:crypto'");
    expect(routeCode).toContain('timingSafeEqual');
    expect(routeCode).not.toContain('authHeader !== `Bearer ${cronSecret}`');
    expect(routeCode).not.toContain('authHeader === `Bearer ${cronSecret}`');
  });
});
