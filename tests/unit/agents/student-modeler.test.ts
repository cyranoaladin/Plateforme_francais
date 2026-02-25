import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockUpdateSkillMap = vi.fn();
const mockAddErrorBankItem = vi.fn();
const mockGetOrCreateSkillMap = vi.fn();

vi.mock('@/lib/store/premium-store', () => ({
  updateSkillMap: (...args: unknown[]) => mockUpdateSkillMap(...args),
  addErrorBankItem: (...args: unknown[]) => mockAddErrorBankItem(...args),
  getOrCreateSkillMap: (...args: unknown[]) => mockGetOrCreateSkillMap(...args),
}));

const MOCK_SKILL_MAP = {
  studentId: 'stu-001',
  axes: { ecrit: [], oral: [], langue: [], oeuvres: [], methode: [] },
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('processInteraction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockUpdateSkillMap.mockResolvedValue(MOCK_SKILL_MAP);
    mockGetOrCreateSkillMap.mockResolvedValue(MOCK_SKILL_MAP);
    mockAddErrorBankItem.mockResolvedValue({ id: 'err-1' });
  });

  it('convertit les critères rubrique en mises à jour SkillMap', async () => {
    const { processInteraction } = await import('@/lib/agents/student-modeler');
    await processInteraction({
      studentId: 'stu-001',
      interactionId: 'inter-001',
      agent: 'correcteur',
      rubric: {
        criteria: [
          { id: 'problematique', label: 'Problématique', score: 3, max: 5, evidence: '' },
          { id: 'plan', label: 'Plan', score: 4, max: 5, evidence: '' },
        ],
      },
    });

    expect(mockUpdateSkillMap).toHaveBeenCalledOnce();
    const [, updates] = mockUpdateSkillMap.mock.calls[0] as [string, Array<{ microSkillId: string }>];
    const ids = updates.map((u) => u.microSkillId);
    expect(ids).toContain('ecrit_problematique');
    expect(ids).toContain('ecrit_plan');
  });

  it('normalise le score entre 0 et 1', async () => {
    const { processInteraction } = await import('@/lib/agents/student-modeler');
    await processInteraction({
      studentId: 'stu-001',
      interactionId: 'inter-002',
      agent: 'correcteur',
      rubric: {
        criteria: [{ id: 'citations', label: 'Citations', score: 2, max: 4, evidence: '' }],
      },
    });

    const [, updates] = mockUpdateSkillMap.mock.calls[0] as [string, Array<{ microSkillId: string; score: number }>];
    const citationsUpdate = updates.find((u) => u.microSkillId === 'ecrit_citations');
    expect(citationsUpdate?.score).toBe(0.5);
  });

  it("enregistre les erreurs détectées dans l'ErrorBank", async () => {
    const { processInteraction } = await import('@/lib/agents/student-modeler');
    await processInteraction({
      studentId: 'stu-001',
      interactionId: 'inter-003',
      agent: 'correcteur',
      detectedErrors: [
        {
          errorType: 'plan_desequilibre',
          category: 'ecrit',
          microSkillId: 'ecrit_plan',
          example: 'Partie II plus courte que partie I',
          correction: 'Équilibrer les parties à 1/3 chacune',
        },
      ],
    });

    expect(mockAddErrorBankItem).toHaveBeenCalledOnce();
    const call = mockAddErrorBankItem.mock.calls[0][0] as { errorType: string; studentId: string };
    expect(call.errorType).toBe('plan_desequilibre');
    expect(call.studentId).toBe('stu-001');
  });

  it('applique les skillDeltas explicites', async () => {
    const { processInteraction } = await import('@/lib/agents/student-modeler');
    await processInteraction({
      studentId: 'stu-001',
      interactionId: 'inter-004',
      agent: 'coach_oral',
      skillDeltas: [
        { microSkillId: 'oral_lecture', scoreDelta: 0.8, evidence: 'Lecture fluide' },
      ],
    });

    const [, updates] = mockUpdateSkillMap.mock.calls[0] as [string, Array<{ microSkillId: string; score: number }>];
    expect(updates[0].microSkillId).toBe('oral_lecture');
    expect(updates[0].score).toBe(0.8);
  });

  it('borne les scores entre 0 et 1 même si scoreDelta > 1', async () => {
    const { processInteraction } = await import('@/lib/agents/student-modeler');
    await processInteraction({
      studentId: 'stu-001',
      interactionId: 'inter-005',
      agent: 'coach_oral',
      skillDeltas: [
        { microSkillId: 'oral_lecture', scoreDelta: 1.5, evidence: 'Parfait' },
      ],
    });

    const [, updates] = mockUpdateSkillMap.mock.calls[0] as [string, Array<{ microSkillId: string; score: number }>];
    expect(updates[0].score).toBeLessThanOrEqual(1);
  });

  it('retourne le skillMap actuel si aucune mise à jour', async () => {
    const { processInteraction } = await import('@/lib/agents/student-modeler');
    const result = await processInteraction({
      studentId: 'stu-001',
      interactionId: 'inter-006',
      agent: 'tuteur_libre',
    });

    expect(mockUpdateSkillMap).not.toHaveBeenCalled();
    expect(mockGetOrCreateSkillMap).toHaveBeenCalledWith('stu-001');
    expect(result).toBe(MOCK_SKILL_MAP);
  });
});

describe('extractErrorsFromRubric', () => {
  it('flagge les critères sous 50% comme erreurs', async () => {
    const { extractErrorsFromRubric } = await import('@/lib/agents/student-modeler');
    const errors = extractErrorsFromRubric(
      {
        criteria: [
          { id: 'plan', label: 'Plan', score: 1, max: 5, evidence: '' },
          { id: 'citations', label: 'Citations', score: 3, max: 5, evidence: '' },
        ],
      },
      'correcteur',
    );

    expect(errors).toHaveLength(1);
    expect(errors[0].errorType).toBe('plan_desequilibre');
  });

  it('ne flagge pas les critères >= 50%', async () => {
    const { extractErrorsFromRubric } = await import('@/lib/agents/student-modeler');
    const errors = extractErrorsFromRubric(
      {
        criteria: [{ id: 'plan', label: 'Plan', score: 3, max: 5, evidence: '' }],
      },
      'correcteur',
    );
    expect(errors).toHaveLength(0);
  });

  it("mappe chaque critère au bon type d'erreur", async () => {
    const { extractErrorsFromRubric } = await import('@/lib/agents/student-modeler');
    const criteriaMap = [
      { id: 'problematique', expectedType: 'problematique_floue' },
      { id: 'citations', expectedType: 'citation_absente' },
      { id: 'expression', expectedType: 'syntaxe_erreur' },
      { id: 'lecture', expectedType: 'lecture_monotone' },
    ];

    for (const { id, expectedType } of criteriaMap) {
      const errors = extractErrorsFromRubric(
        { criteria: [{ id, label: id, score: 0, max: 5, evidence: '' }] },
        'agent',
      );
      expect(errors[0].errorType).toBe(expectedType);
    }
  });
});
