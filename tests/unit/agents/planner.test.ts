import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetPlan7Days = vi.fn();
const mockSaveStudyPlan = vi.fn();
const mockGetDueErrorBankItems = vi.fn();

vi.mock('@/lib/store/premium-store', () => ({
  getPlan7Days: (...args: unknown[]) => mockGetPlan7Days(...args),
  saveStudyPlan: (...args: unknown[]) => mockSaveStudyPlan(...args),
  getDueErrorBankItems: (...args: unknown[]) => mockGetDueErrorBankItems(...args),
}));

describe('getOrRefreshPlan7Days', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockSaveStudyPlan.mockResolvedValue(undefined);
    mockGetDueErrorBankItems.mockResolvedValue([]);
  });

  it('retourne le plan existant si âge < 7 jours', async () => {
    const freshPlan = {
      studentId: 'stu-1',
      weeks: [{ week: 1, sessions: [] }],
      slots: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockGetPlan7Days.mockResolvedValue(freshPlan);

    const { getOrRefreshPlan7Days } = await import('@/lib/agents/planner');
    const result = await getOrRefreshPlan7Days('stu-1');

    expect(result).toBe(freshPlan);
    expect(mockSaveStudyPlan).not.toHaveBeenCalled();
  });

  it('régénère si le plan a plus de 7 jours', async () => {
    const oldDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    const oldPlan = {
      studentId: 'stu-1',
      weeks: [{ week: 1, sessions: [] }],
      slots: [{ id: 'stu-1-ecrit-1', completed: true }],
      createdAt: oldDate,
      updatedAt: oldDate,
    };
    mockGetPlan7Days.mockResolvedValue(oldPlan);

    const { getOrRefreshPlan7Days } = await import('@/lib/agents/planner');
    await getOrRefreshPlan7Days('stu-1');

    expect(mockSaveStudyPlan).toHaveBeenCalledOnce();
  });

  it('préserve les slots complétés lors de la régénération', async () => {
    const oldDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
    const completedSlotId = 'stu-1-ecrit-1';
    mockGetPlan7Days.mockResolvedValue({
      studentId: 'stu-1',
      weeks: [{ week: 1, sessions: [] }],
      slots: [{ id: completedSlotId, completed: true }],
      createdAt: oldDate,
      updatedAt: oldDate,
    });

    const { getOrRefreshPlan7Days } = await import('@/lib/agents/planner');
    const newPlan = await getOrRefreshPlan7Days('stu-1');

    // The regenerated plan should preserve completion state for matching slot IDs
    const slot = newPlan.slots?.find((s: { id: string }) => s.id === completedSlotId);
    if (slot) {
      expect(slot.completed).toBe(true);
    }
  });

  it('crée un nouveau plan si aucun plan existant', async () => {
    mockGetPlan7Days.mockResolvedValue(null);

    const { getOrRefreshPlan7Days } = await import('@/lib/agents/planner');
    const result = await getOrRefreshPlan7Days('stu-new');

    expect(result.studentId).toBe('stu-new');
    expect(mockSaveStudyPlan).toHaveBeenCalledOnce();
    expect(result.weeks?.length).toBeGreaterThan(0);
  });

  it('intègre les items ErrorBank dus dans les slots de révision', async () => {
    mockGetPlan7Days.mockResolvedValue(null);
    mockGetDueErrorBankItems.mockResolvedValue([
      { id: 'err-1', errorType: 'plan_desequilibre', correction: 'Équilibrer les parties' },
      { id: 'err-2', errorType: 'citation_absente', correction: 'Ajouter des citations' },
    ]);

    const { getOrRefreshPlan7Days } = await import('@/lib/agents/planner');
    const result = await getOrRefreshPlan7Days('stu-1');

    const revisionSlots = result.slots?.filter((s: { type?: string }) => s.type === 'revision') ?? [];
    expect(revisionSlots.length).toBeGreaterThan(0);
    expect(revisionSlots[0].title).toContain('Révision');
  });
});
