import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetPlan7Days = vi.fn();
const mockSaveStudyPlan = vi.fn();
const mockGetDueErrorBankItems = vi.fn();
const mockFindMany = vi.fn();

vi.mock('@/lib/store/premium-store', () => ({
  getPlan7Days: (...args: unknown[]) => mockGetPlan7Days(...args),
  saveStudyPlan: (...args: unknown[]) => mockSaveStudyPlan(...args),
  getDueErrorBankItems: (...args: unknown[]) => mockGetDueErrorBankItems(...args),
}));

vi.mock('@/lib/db/client', () => ({
  prisma: {
    texteDescriptif: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
  },
}));

describe('planner — conscience du descriptif', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    // Force regeneration (no existing plan)
    mockGetPlan7Days.mockResolvedValue(null);
    mockSaveStudyPlan.mockResolvedValue(undefined);
    mockGetDueErrorBankItems.mockResolvedValue([]);
  });

  it('ajoute un slot "Compléter le descriptif" si count === 0', async () => {
    mockFindMany.mockResolvedValue([]);

    const { getOrRefreshPlan7Days } = await import('@/lib/agents/planner');
    const plan = await getOrRefreshPlan7Days('student-test-001');

    const descriptifSlot = plan.slots?.find((s) =>
      s.title?.toLowerCase().includes('descriptif'),
    );
    expect(descriptifSlot).toBeDefined();
  });

  it('l\'objectif oral est générique si count === 0', async () => {
    mockFindMany.mockResolvedValue([]);

    const { getOrRefreshPlan7Days } = await import('@/lib/agents/planner');
    const plan = await getOrRefreshPlan7Days('student-test-001');

    const oralSession = plan.weeks[0]?.sessions.find((s) => s.type === 'oral');
    expect(oralSession?.objectives?.[0]).toMatch(/génér|descriptif vide/i);
  });

  it('l\'objectif oral est personnalisé si count >= 16', async () => {
    mockFindMany.mockResolvedValue(
      Array.from({ length: 16 }, (_, i) => ({
        id: `texte-${i}`,
        titreExtrait: `Mon Beau Texte ${i}`,
        oeuvreAuteur: `Auteur Célèbre ${i}`,
      })),
    );

    const { getOrRefreshPlan7Days } = await import('@/lib/agents/planner');
    const plan = await getOrRefreshPlan7Days('student-test-001');

    const oralSession = plan.weeks[0]?.sessions.find((s) => s.type === 'oral');
    expect(oralSession?.objectives?.[0]).toContain('Mon Beau Texte 0');
  });

  it('n\'ajoute PAS de slot descriptif si count >= 16', async () => {
    mockFindMany.mockResolvedValue(
      Array.from({ length: 16 }, (_, i) => ({
        id: `texte-${i}`,
        titreExtrait: `Texte ${i}`,
        oeuvreAuteur: `Auteur ${i}`,
      })),
    );

    const { getOrRefreshPlan7Days } = await import('@/lib/agents/planner');
    const plan = await getOrRefreshPlan7Days('student-test-001');

    const descriptifSlots = plan.slots?.filter((s) =>
      s.title?.toLowerCase().includes('descriptif'),
    ) ?? [];
    expect(descriptifSlots).toHaveLength(0);
  });

  it('le plan sauvegardé inclut les slots révision de la banque d\'erreurs', async () => {
    mockFindMany.mockResolvedValue([]);
    mockGetDueErrorBankItems.mockResolvedValue([
      { errorType: 'concordance des temps', correction: 'Réviser les temps du passé' },
    ]);

    const { getOrRefreshPlan7Days } = await import('@/lib/agents/planner');
    const plan = await getOrRefreshPlan7Days('student-test-001');

    expect(mockSaveStudyPlan).toHaveBeenCalledWith(plan);
    const revisionSlot = plan.slots?.find((s) =>
      s.title?.toLowerCase().includes('concordance'),
    );
    expect(revisionSlot).toBeDefined();
  });
});
