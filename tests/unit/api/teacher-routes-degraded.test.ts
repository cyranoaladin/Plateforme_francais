import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * Tests garde-fous : vérifier comportement fail-closed en production
 * pour les routes enseignant lorsque la DB est indisponible.
 *
 * Objectif : documenter et protéger contre régression scope teacher + DB fallback.
 * Scope : Lot 1-A / F-012
 */

const mockPrisma = {
  $queryRaw: vi.fn(),
  $queryRawUnsafe: vi.fn(),
  user: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  copieDeposee: {
    findMany: vi.fn(),
  },
};

const mockIsDatabaseAvailable = vi.fn();

vi.mock('@/lib/db/client', () => ({
  prisma: mockPrisma,
  isDatabaseAvailable: mockIsDatabaseAvailable,
}));

vi.mock('@/lib/auth/guard', () => ({
  requireAuthenticatedUser: vi.fn().mockResolvedValue({
    auth: { user: { id: 'teacher-1', role: 'enseignant', emailVerified: new Date().toISOString(), profile: { classCode: 'MATH2026' } } },
    errorResponse: null,
  }),
  requireUserRole: vi.fn().mockResolvedValue({
    auth: { user: { id: 'teacher-1', role: 'enseignant', emailVerified: new Date().toISOString(), profile: { classCode: 'MATH2026' } } },
    errorResponse: null,
  }),
  requireExactUserRole: vi.fn().mockResolvedValue({
    auth: { user: { id: 'teacher-1', role: 'enseignant', emailVerified: new Date().toISOString(), profile: { classCode: 'MATH2026' } } },
    errorResponse: null,
  }),
}));

vi.mock('@/lib/security/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({
    allowed: true,
    retryAfter: 0,
  }),
}));

vi.mock('@/lib/copy/fr', () => ({
  copy: {
    api: {
      cron: {
        databaseUnavailable: 'Database unavailable',
      },
      metrics: {
        rateLimitExceeded: 'Rate limit exceeded',
      },
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/db/fallback-store', () => ({
  readFallbackStore: vi.fn().mockResolvedValue({
    users: [],
    events: [],
  }),
}));

describe('Teacher routes - DB degraded fail-closed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    mockIsDatabaseAvailable.mockResolvedValue(true);
    mockPrisma.user.findMany.mockResolvedValue([]);
    mockPrisma.copieDeposee.findMany.mockResolvedValue([]);
  });

  describe('Dashboard en production DB down', () => {
    it('retourne 503 si isDatabaseAvailable=false (production)', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      mockIsDatabaseAvailable.mockResolvedValueOnce(false);

      // Import dynamique après stub env
      const { GET } = await import(
        '@/app/api/v1/enseignant/dashboard/route'
      );

      const response = await GET();

      expect(response.status).toBe(503);
      const body = await response.json();
      expect(body.error).toBeDefined();
    });

    it('passe normalement si DB disponible (production)', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      mockIsDatabaseAvailable.mockResolvedValueOnce(true);
      mockPrisma.user.findMany.mockResolvedValueOnce([
        {
          id: 'student-1',
          email: 'eleve@test.fr',
          profile: { classCode: 'MATH2026', displayName: 'Élève Test' },
          evaluations: [],
          memoryEvents: [],
          epreuves: [],
          copies: [],
        },
      ]);

      const { GET } = await import(
        '@/app/api/v1/enseignant/dashboard/route'
      );

      const response = await GET();

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.students).toBeDefined();
    });
  });

  describe('Export CSV en production DB down', () => {
    it('retourne 503 si isDatabaseAvailable=false (production)', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      mockIsDatabaseAvailable.mockResolvedValueOnce(false);

      const { GET } = await import(
        '@/app/api/v1/enseignant/export/route'
      );

      const request = new NextRequest('http://localhost:3000/api/v1/enseignant/export');
      const response = await GET(request);

      expect(response.status).toBe(503);
    });

    it('génère CSV si DB disponible (production)', async () => {
      vi.stubEnv('NODE_ENV', 'production');
      mockIsDatabaseAvailable.mockResolvedValueOnce(true);
      mockPrisma.user.findMany.mockResolvedValueOnce([
        {
          id: 'student-1',
          email: 'eleve@test.fr',
          profile: { classCode: 'MATH2026', displayName: 'Élève Test' },
          evaluations: [],
          memoryEvents: [],
        },
      ]);

      const { GET } = await import(
        '@/app/api/v1/enseignant/export/route'
      );

      const request = new NextRequest('http://localhost:3000/api/v1/enseignant/export');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/csv');
    });
  });
});
