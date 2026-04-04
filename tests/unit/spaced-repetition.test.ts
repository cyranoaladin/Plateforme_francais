import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockFindUnique = vi.fn();
const mockUpsert = vi.fn();
const mockCreateWeakSkillEntry = vi.fn();
const mockFindManyWeakSkillEntry = vi.fn();
const mockFindUniqueWeakSkillEntry = vi.fn();
const mockCreateWeakSkillRevision = vi.fn();
const mockUpdateWeakSkillEntry = vi.fn();

vi.mock('@/lib/db/client', () => ({
  isDatabaseAvailable: vi.fn().mockResolvedValue(true),
  assertDatabaseAvailable: vi.fn().mockResolvedValue(undefined),
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
    studentProfile: {
      upsert: (...args: unknown[]) => mockUpsert(...args),
    },
    weakSkillEntry: {
      create: (...args: unknown[]) => mockCreateWeakSkillEntry(...args),
      findMany: (...args: unknown[]) => mockFindManyWeakSkillEntry(...args),
      findUnique: (...args: unknown[]) => mockFindUniqueWeakSkillEntry(...args),
      update: (...args: unknown[]) => mockUpdateWeakSkillEntry(...args),
    },
    weakSkillRevision: {
      create: (...args: unknown[]) => mockCreateWeakSkillRevision(...args),
    },
  },
}));

describe('spaced-repetition', () => {
  beforeEach(() => {
    vi.resetModules();
    mockFindUnique.mockReset();
    mockUpsert.mockReset();
    mockCreateWeakSkillEntry.mockReset();
    mockFindManyWeakSkillEntry.mockReset();
    mockFindUniqueWeakSkillEntry.mockReset();
    mockCreateWeakSkillRevision.mockReset();
    mockUpdateWeakSkillEntry.mockReset();

    mockFindUnique.mockResolvedValue({ id: 'student-profile-user' });
    mockUpsert.mockResolvedValue({ id: 'profile-1' });
  });

  it('sets due dates at J+2, J+7, J+21 when creating an error item', async () => {
    mockCreateWeakSkillEntry.mockResolvedValue(undefined);

    const { addErrorBankItem } = await import('@/lib/store/premium-store');
    const created = await addErrorBankItem({
      studentId: 'student-a',
      errorType: 'contresens',
      category: 'ecrit',
      microSkillId: 'ecrit_problematique',
      example: 'Exemple erreur',
      correction: 'Correction attendue',
      sourceInteractionId: 'interaction-1',
      sourceAgent: 'coach_ecrit',
    });

    const createdAt = new Date(created.createdAt).getTime();
    const j2 = new Date(created.dueDates.j2).getTime();
    const j7 = new Date(created.dueDates.j7).getTime();
    const j21 = new Date(created.dueDates.j21).getTime();

    const dayMs = 24 * 60 * 60 * 1000;
    expect(Math.round((j2 - createdAt) / dayMs)).toBe(2);
    expect(Math.round((j7 - createdAt) / dayMs)).toBe(7);
    expect(Math.round((j21 - createdAt) / dayMs)).toBe(21);
    expect(mockCreateWeakSkillEntry).toHaveBeenCalledTimes(1);
  });

  it('marks item resolved after 3 successful revisions', async () => {
    const createdAt = new Date('2026-04-01T00:00:00.000Z');
    mockCreateWeakSkillEntry.mockResolvedValue(undefined);
    mockFindUniqueWeakSkillEntry
      .mockResolvedValueOnce({ id: 'err-1', status: 'NEW', revisions: [] })
      .mockResolvedValueOnce({ id: 'err-1', status: 'IMPROVING', revisions: [{ success: true }] })
      .mockResolvedValueOnce({ id: 'err-1', status: 'IMPROVING', revisions: [{ success: true }, { success: true }] });
    mockCreateWeakSkillRevision.mockResolvedValue(undefined);
    mockUpdateWeakSkillEntry.mockResolvedValue(undefined);
    mockFindManyWeakSkillEntry.mockResolvedValue([
      {
        id: 'err-1',
        microSkillKey: 'methode_strategie',
        skill: 'TRANS_TEMPS_GESTION',
        pattern: 'hors_sujet',
        category: 'methode',
        examples: [{ example: 'Exemple hors-sujet', correction: 'Recadrage attendu' }],
        sourceInteractionId: 'interaction-2',
        sourceAgent: 'planner',
        firstDetectedAt: createdAt,
        status: 'RESOLVED',
        revisions: [
          { phase: 'J2', success: true, notes: null, createdAt: new Date('2026-04-03T00:00:00.000Z') },
          { phase: 'J7', success: true, notes: null, createdAt: new Date('2026-04-08T00:00:00.000Z') },
          { phase: 'J21', success: true, notes: null, createdAt: new Date('2026-04-22T00:00:00.000Z') },
        ],
      },
    ]);

    const { addErrorBankItem, recordRevisionAttempt, getErrorBankItems } = await import('@/lib/store/premium-store');
    const created = await addErrorBankItem({
      studentId: 'student-b',
      errorType: 'hors_sujet',
      category: 'methode',
      microSkillId: 'methode_strategie',
      example: 'Exemple hors-sujet',
      correction: 'Recadrage attendu',
      sourceInteractionId: 'interaction-2',
      sourceAgent: 'planner',
    });

    created.id = 'err-1';

    await recordRevisionAttempt(created.id, { date: new Date('2026-04-03T00:00:00.000Z').toISOString(), phase: 'j2', success: true });
    await recordRevisionAttempt(created.id, { date: new Date('2026-04-08T00:00:00.000Z').toISOString(), phase: 'j7', success: true });
    await recordRevisionAttempt(created.id, { date: new Date('2026-04-22T00:00:00.000Z').toISOString(), phase: 'j21', success: true });

    const items = await getErrorBankItems('student-b');
    expect(items).toHaveLength(1);
    expect(items[0].resolved).toBe(true);
    expect(items[0].revisionHistory).toHaveLength(3);
    expect(mockUpdateWeakSkillEntry).toHaveBeenLastCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        status: 'RESOLVED',
      }),
    }));
  });
});
