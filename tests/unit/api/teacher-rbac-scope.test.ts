import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

/**
 * Tests garde-fous : vérifier l'isolation par classCode pour les routes enseignant.
 *
 * Objectif : documenter et protéger contre régression RBAC scope teacher.
 * Scope : Lot 1-B / F-008
 */

const mockPrisma = {
  user: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  copieDeposee: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
};

const mockIsDatabaseAvailable = vi.fn();
const mockRequireUserRole = vi.fn();

vi.mock('@/lib/db/client', () => ({
  prisma: mockPrisma,
  isDatabaseAvailable: mockIsDatabaseAvailable,
}));

vi.mock('@/lib/auth/guard', () => ({
  requireUserRole: mockRequireUserRole,
  requireExactUserRole: mockRequireUserRole,
}));

vi.mock('@/lib/security/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({
    allowed: true,
    retryAfter: 0,
  }),
}));

vi.mock('@/lib/security/csrf', () => ({
  validateCsrf: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/validation/request', () => ({
  parseJsonBody: vi.fn().mockResolvedValue({
    success: true,
    data: { comment: 'Excellent travail!' },
  }),
}));

vi.mock('@/lib/copy/fr', () => ({
  copy: {
    api: {
      common: {
        unavailableResource: 'Resource not found',
      },
      comments: {
        outOfClass: 'Not allowed to comment on this copy',
        manualUnavailable: 'Service unavailable',
      },
      cron: {
        databaseUnavailable: 'Database unavailable',
      },
      metrics: {
        rateLimitExceeded: 'Rate limit exceeded',
      },
    },
  },
}));

vi.mock('@/lib/db/fallback-store', () => ({
  readFallbackStore: vi.fn().mockResolvedValue({
    users: [],
    events: [],
  }),
}));

describe('Teacher RBAC - classCode scope isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    mockIsDatabaseAvailable.mockResolvedValue(true);
  });

  describe('A. Dashboard scope isolation', () => {
    it('enseignant A voit seulement ses élèves MATH2026, pas PHYS2026', async () => {
      // Enseignant A authentifié avec MATH2026
      mockRequireUserRole.mockResolvedValueOnce({
        auth: {
          user: {
            id: 'teacher-A',
            role: 'enseignant',
            profile: { classCode: 'MATH2026' },
          },
        },
        errorResponse: null,
      });

      // DB retourne uniquement élèves MATH2026 (le filtrage est côté Prisma)
      mockPrisma.user.findMany.mockResolvedValueOnce([
        {
          id: 'student-1',
          email: 'eleve1@math.fr',
          profile: { classCode: 'MATH2026', displayName: 'Élève Math 1' },
          evaluations: [],
          memoryEvents: [],
          epreuves: [],
          copies: [],
        },
        {
          id: 'student-2',
          email: 'eleve2@math.fr',
          profile: { classCode: 'MATH2026', displayName: 'Élève Math 2' },
          evaluations: [],
          memoryEvents: [],
          epreuves: [],
          copies: [],
        },
      ]);

      const { GET } = await import('@/app/api/v1/enseignant/dashboard/route');

      const request = new NextRequest('http://localhost:3000/api/v1/enseignant/dashboard');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();

      // Vérifier que le where clause Prisma a bien été appelé avec classCode MATH2026
      const dashboardWhere = mockPrisma.user.findMany.mock.calls[0]?.[0]?.where;
      expect(dashboardWhere?.role).toBe('eleve');
      expect(JSON.stringify(dashboardWhere)).toContain('"classCode":"MATH2026"');
      expect(JSON.stringify(dashboardWhere)).not.toContain('"PHYS2026"');

      // Vérifier que seuls les élèves MATH2026 apparaissent
      expect(body.students).toHaveLength(2);
      expect(body.students[0].email).toBe('eleve1@math.fr');
      expect(body.students[1].email).toBe('eleve2@math.fr');
    });

    it('enseignant B avec PHYS2026 ne voit pas les élèves MATH2026', async () => {
      // Enseignant B authentifié avec PHYS2026
      mockRequireUserRole.mockResolvedValueOnce({
        auth: {
          user: {
            id: 'teacher-B',
            role: 'enseignant',
            profile: { classCode: 'PHYS2026' },
          },
        },
        errorResponse: null,
      });

      // DB retourne uniquement élèves PHYS2026
      mockPrisma.user.findMany.mockResolvedValueOnce([
        {
          id: 'student-3',
          email: 'eleve3@phys.fr',
          profile: { classCode: 'PHYS2026', displayName: 'Élève Phys 1' },
          evaluations: [],
          memoryEvents: [],
          epreuves: [],
          copies: [],
        },
      ]);

      const { GET } = await import('@/app/api/v1/enseignant/dashboard/route');

      const request = new NextRequest('http://localhost:3000/api/v1/enseignant/dashboard');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const body = await response.json();

      // Vérifier filtrage PHYS2026
      const dashboardWhere = mockPrisma.user.findMany.mock.calls[0]?.[0]?.where;
      expect(dashboardWhere?.role).toBe('eleve');
      expect(JSON.stringify(dashboardWhere)).toContain('"classCode":"PHYS2026"');
      expect(JSON.stringify(dashboardWhere)).not.toContain('"MATH2026"');

      // Seul élève PHYS2026 visible
      expect(body.students).toHaveLength(1);
      expect(body.students[0].email).toBe('eleve3@phys.fr');
    });
  });

  describe('B. Export scope isolation', () => {
    it('enseignant A exporte seulement MATH2026, CSV ne contient pas PHYS2026', async () => {
      mockRequireUserRole.mockResolvedValueOnce({
        auth: {
          user: {
            id: 'teacher-A',
            role: 'enseignant',
            profile: { classCode: 'MATH2026' },
          },
        },
        errorResponse: null,
      });

      mockPrisma.user.findMany.mockResolvedValueOnce([
        {
          id: 'student-1',
          email: 'eleve1@math.fr',
          profile: { classCode: 'MATH2026', displayName: 'Élève Math 1' },
          evaluations: [{ score: 15 }],
          memoryEvents: [{ createdAt: new Date('2026-03-01') }],
        },
        {
          id: 'student-2',
          email: 'eleve2@math.fr',
          profile: { classCode: 'MATH2026', displayName: 'Élève Math 2' },
          evaluations: [{ score: 18 }],
          memoryEvents: [],
        },
      ]);

      const { GET } = await import('@/app/api/v1/enseignant/export/route');

      const request = new NextRequest('http://localhost:3000/api/v1/enseignant/export');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/csv');

      // Parser CSV
      const csvText = await response.text();
      const lines = csvText.trim().split('\n');

      // Header + 2 élèves MATH2026
      expect(lines.length).toBe(3);
      expect(lines[0]).toBe('student_name,email,average_score,last_activity');
      expect(lines[1]).toContain('eleve1@math.fr');
      expect(lines[2]).toContain('eleve2@math.fr');

      // Vérifier que le where clause Prisma filtre bien par MATH2026
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            role: 'eleve',
            profile: { classCode: 'MATH2026' },
          }),
        }),
      );
    });

    it('enseignant B exporte seulement PHYS2026, aucune ligne MATH2026', async () => {
      mockRequireUserRole.mockResolvedValueOnce({
        auth: {
          user: {
            id: 'teacher-B',
            role: 'enseignant',
            profile: { classCode: 'PHYS2026' },
          },
        },
        errorResponse: null,
      });

      mockPrisma.user.findMany.mockResolvedValueOnce([
        {
          id: 'student-3',
          email: 'eleve3@phys.fr',
          profile: { classCode: 'PHYS2026', displayName: 'Élève Phys 1' },
          evaluations: [],
          memoryEvents: [],
        },
      ]);

      const { GET } = await import('@/app/api/v1/enseignant/export/route');

      const request = new NextRequest('http://localhost:3000/api/v1/enseignant/export');
      const response = await GET(request);

      expect(response.status).toBe(200);

      const csvText = await response.text();
      const lines = csvText.trim().split('\n');

      // Header + 1 élève PHYS2026
      expect(lines.length).toBe(2);
      expect(lines[1]).toContain('eleve3@phys.fr');

      // Aucune mention de MATH2026
      expect(csvText).not.toContain('eleve1@math.fr');
      expect(csvText).not.toContain('eleve2@math.fr');
    });
  });

  describe('C. Cross-class comment denied', () => {
    it('enseignant A refuse commenter copie PHYS2026, retourne 403', async () => {
      // Enseignant A authentifié avec MATH2026
      mockRequireUserRole.mockResolvedValueOnce({
        auth: {
          user: {
            id: 'teacher-A',
            role: 'enseignant',
            profile: { classCode: 'MATH2026' },
          },
        },
        errorResponse: null,
      });

      // Copie appartient à élève PHYS2026
      mockPrisma.copieDeposee.findUnique.mockResolvedValueOnce({
        id: 'copie-phys-1',
        userId: 'student-3',
        user: {
          id: 'student-3',
          profile: { classCode: 'PHYS2026' },
        },
        correction: {},
      });

      const { POST } = await import(
        '@/app/api/v1/enseignant/corrections/[copieId]/comment/route'
      );

      const request = new NextRequest(
        'http://localhost:3000/api/v1/enseignant/corrections/copie-phys-1/comment',
        { method: 'POST', body: JSON.stringify({ comment: 'Test' }) },
      );

      const response = await POST(request, {
        params: Promise.resolve({ copieId: 'copie-phys-1' }),
      });

      // Comportement attendu: 403 forbidden
      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toBeDefined();

      // Vérifier qu'aucune update n'a été tentée
      expect(mockPrisma.copieDeposee.update).not.toHaveBeenCalled();
    });

    it('enseignant A peut commenter copie MATH2026, retourne 200', async () => {
      // Enseignant A authentifié avec MATH2026
      mockRequireUserRole.mockResolvedValueOnce({
        auth: {
          user: {
            id: 'teacher-A',
            role: 'enseignant',
            profile: { classCode: 'MATH2026' },
          },
        },
        errorResponse: null,
      });

      // Copie appartient à élève MATH2026
      mockPrisma.copieDeposee.findUnique.mockResolvedValueOnce({
        id: 'copie-math-1',
        userId: 'student-1',
        user: {
          id: 'student-1',
          profile: { classCode: 'MATH2026' },
        },
        correction: {},
      });

      mockPrisma.copieDeposee.update.mockResolvedValueOnce({
        id: 'copie-math-1',
        correction: { commentaireEnseignant: 'Excellent travail!' },
      });

      const { POST } = await import(
        '@/app/api/v1/enseignant/corrections/[copieId]/comment/route'
      );

      const request = new NextRequest(
        'http://localhost:3000/api/v1/enseignant/corrections/copie-math-1/comment',
        { method: 'POST', body: JSON.stringify({ comment: 'Excellent travail!' }) },
      );

      const response = await POST(request, {
        params: Promise.resolve({ copieId: 'copie-math-1' }),
      });

      // Comportement attendu: 200 OK
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.ok).toBe(true);

      // Vérifier que l'update a bien été effectuée
      expect(mockPrisma.copieDeposee.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'copie-math-1' },
          data: expect.objectContaining({
            correction: expect.objectContaining({
              commentaireEnseignant: 'Excellent travail!',
            }),
          }),
        }),
      );
    });

    it('enseignant sans classCode refuse toute copie, retourne 403', async () => {
      // Enseignant sans classCode (edge case)
      mockRequireUserRole.mockResolvedValueOnce({
        auth: {
          user: {
            id: 'teacher-no-class',
            role: 'enseignant',
            profile: { classCode: null },
          },
        },
        errorResponse: null,
      });

      mockPrisma.copieDeposee.findUnique.mockResolvedValueOnce({
        id: 'copie-math-1',
        userId: 'student-1',
        user: {
          id: 'student-1',
          profile: { classCode: 'MATH2026' },
        },
        correction: {},
      });

      const { POST } = await import(
        '@/app/api/v1/enseignant/corrections/[copieId]/comment/route'
      );

      const request = new NextRequest(
        'http://localhost:3000/api/v1/enseignant/corrections/copie-math-1/comment',
        { method: 'POST', body: JSON.stringify({ comment: 'Test' }) },
      );

      const response = await POST(request, {
        params: Promise.resolve({ copieId: 'copie-math-1' }),
      });

      // Comportement attendu: 403 forbidden (pas de classCode = pas de scope)
      expect(response.status).toBe(403);

      // Aucune update
      expect(mockPrisma.copieDeposee.update).not.toHaveBeenCalled();
    });
  });
});
