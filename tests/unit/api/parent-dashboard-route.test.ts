import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/guard', () => ({
  requireUserRole: vi.fn(),
}));

vi.mock('@/lib/db/client', () => ({
  prisma: {
    studentProfile: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/db/repositories/memoryRepo', () => ({
  listMemoryEventsByUser: vi.fn(),
}));

import { requireUserRole } from '@/lib/auth/guard';
import { prisma } from '@/lib/db/client';
import { listMemoryEventsByUser } from '@/lib/db/repositories/memoryRepo';

describe('parent dashboard route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireUserRole).mockResolvedValue({
      auth: {
        user: {
          email: 'parent@test.dev',
          profile: { displayName: 'Parent Audit' },
        },
      },
      errorResponse: null,
    } as never);
  });

  it('returns an explicit unlinked state when no student matches parent email', async () => {
    vi.mocked(prisma.studentProfile.findMany).mockResolvedValue([] as never);

    const { GET } = await import('@/app/api/v1/parent/dashboard/route');
    const response = await GET(new Request('http://localhost/api/v1/parent/dashboard?limit=20'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.linkageStatus).toBe('unlinked');
    expect(body.linkedStudents).toEqual([]);
  });

  it('returns the linked student timeline when a parent email matches', async () => {
    vi.mocked(prisma.studentProfile.findMany).mockResolvedValue([
      {
        userId: 'student-1',
        displayName: 'Élève Lié',
        onboardingCompleted: true,
        eafDate: new Date('2026-06-08T08:00:00.000Z'),
        selectedOeuvres: ['Candide'],
        oeuvreChoisieEntretien: 'Candide',
        classLevel: 'Première générale',
        user: {
          email: 'student@test.dev',
        },
      },
    ] as never);
    vi.mocked(listMemoryEventsByUser).mockResolvedValue([
      {
        id: 'evt-1',
        userId: 'student-1',
        type: 'evaluation',
        feature: 'atelier_oral',
        payload: { weakSkills: ['oral'] },
        createdAt: '2026-03-23T10:00:00.000Z',
      },
    ] as never);

    const { GET } = await import('@/app/api/v1/parent/dashboard/route');
    const response = await GET(new Request('http://localhost/api/v1/parent/dashboard?limit=20'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.linkageStatus).toBe('linked');
    expect(body.profile.displayName).toBe('Élève Lié');
    expect(body.linkedStudents[0].displayName).toBe('Élève Lié');
    expect(body.weakSignals).toEqual({ oral: 1 });
  });
});
