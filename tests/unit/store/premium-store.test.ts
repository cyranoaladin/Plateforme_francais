import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  isDatabaseAvailable: vi.fn(),
  assertDatabaseAvailable: vi.fn(),
  findUserById: vi.fn(),
  upsertProfile: vi.fn(),
  createWeakSkillEntry: vi.fn(),
  findWeakSkillEntry: vi.fn(),
  createWeakSkillRevision: vi.fn(),
  updateWeakSkillEntry: vi.fn(),
  findSkillMapEntries: vi.fn(),
  transaction: vi.fn(),
  createSkillMapEntry: vi.fn(),
  updateSkillMapEntry: vi.fn(),
}));

vi.mock('@/lib/db/client', () => ({
  isDatabaseAvailable: mocks.isDatabaseAvailable,
  assertDatabaseAvailable: mocks.assertDatabaseAvailable,
  prisma: {
    user: { findUnique: mocks.findUserById },
    studentProfile: { upsert: mocks.upsertProfile },
    weakSkillEntry: {
      create: mocks.createWeakSkillEntry,
      findUnique: mocks.findWeakSkillEntry,
      update: mocks.updateWeakSkillEntry,
      findMany: vi.fn().mockResolvedValue([]),
    },
    weakSkillRevision: { create: mocks.createWeakSkillRevision },
    skillMapEntry: {
      findMany: mocks.findSkillMapEntries,
      create: mocks.createSkillMapEntry,
      update: mocks.updateSkillMapEntry,
    },
    studyPlanSnapshot: { upsert: vi.fn(), findUnique: vi.fn() },
    diagnosticSnapshot: { create: vi.fn() },
    weeklyReportSnapshot: { create: vi.fn(), findFirst: vi.fn() },
    $transaction: mocks.transaction,
  },
}));

describe('premium-store', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();

    mocks.isDatabaseAvailable.mockResolvedValue(true);
    mocks.assertDatabaseAvailable.mockResolvedValue(undefined);
    mocks.findUserById.mockResolvedValue({ id: 'stu-1' });
    mocks.upsertProfile.mockResolvedValue({ id: 'profile-1' });
    mocks.createWeakSkillEntry.mockResolvedValue(undefined);
    mocks.findWeakSkillEntry.mockResolvedValue({
      id: 'err-1',
      revisions: [{ success: true }, { success: true }],
      status: 'IMPROVING',
    });
    mocks.createWeakSkillRevision.mockResolvedValue(undefined);
    mocks.updateWeakSkillEntry.mockResolvedValue(undefined);
    mocks.findSkillMapEntries.mockResolvedValue([]);
    mocks.createSkillMapEntry.mockResolvedValue(undefined);
    mocks.updateSkillMapEntry.mockResolvedValue(undefined);
    mocks.transaction.mockImplementation(async (ops: Array<Promise<unknown>>) => Promise.all(ops));
  });

  it('crée un item ErrorBank via Prisma quand la DB est disponible', async () => {
    const { addErrorBankItem } = await import('@/lib/store/premium-store');
    const item = await addErrorBankItem({
      studentId: 'stu-1',
      errorType: 'plan_desequilibre',
      category: 'ecrit',
      microSkillId: 'ecrit_plan',
      example: 'Partie II trop courte',
      correction: 'Équilibrer les parties',
      sourceInteractionId: 'inter-1',
      sourceAgent: 'correcteur',
    });

    expect(item.studentId).toBe('stu-1');
    expect(item.resolved).toBe(false);
    expect(mocks.createWeakSkillEntry).toHaveBeenCalled();
  });

  it('rejette explicitement sans base de données', async () => {
    mocks.isDatabaseAvailable.mockResolvedValue(false);
    mocks.assertDatabaseAvailable.mockRejectedValue(new Error('premium-store JSON fallback interdit en production'));
    mocks.findUserById.mockResolvedValue(null);

    const { getOrCreateSkillMap } = await import('@/lib/store/premium-store');
    await expect(getOrCreateSkillMap('stu-offline')).rejects.toThrow('premium-store JSON fallback interdit en production');
  });

  it('borne les scores skill map entre 0 et 1 via Prisma', async () => {
    mocks.findSkillMapEntries
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          microSkillKey: 'ecrit_plan',
          skill: 'ECRIT_COMMENT_PLAN',
          score: 1,
          confidence: 0.3,
          trend: 'STABLE',
          observationCount: 1,
          lastObservedAt: new Date('2026-01-01T00:00:00.000Z'),
          id: 'entry-1',
        },
      ]);

    const { updateSkillMap } = await import('@/lib/store/premium-store');
    const map = await updateSkillMap('stu-1', [{ microSkillId: 'ecrit_plan', score: 1.5 }]);

    expect(mocks.createSkillMapEntry).toHaveBeenCalled();
    expect(map.axes.ecrit[0]?.score).toBe(1);
  });
});
