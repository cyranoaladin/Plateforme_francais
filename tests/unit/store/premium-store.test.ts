import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('node:fs', () => ({
  promises: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    readFile: vi.fn().mockRejectedValue({ code: 'ENOENT' }),
    writeFile: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('ErrorBank — addErrorBankItem', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.resetModules();
    const { promises: fs } = await import('node:fs');
    vi.mocked(fs.readFile).mockRejectedValue({ code: 'ENOENT' });
  });

  it('crée un item avec les champs obligatoires', async () => {
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

    expect(item.id).toBeTruthy();
    expect(item.studentId).toBe('stu-1');
    expect(item.dueDates.j2).toBeTruthy();
    expect(item.dueDates.j7).toBeTruthy();
    expect(item.dueDates.j21).toBeTruthy();
    expect(item.resolved).toBe(false);
    expect(item.revisionHistory).toEqual([]);
  });

  it('j2 < j7 < j21 dans les dates de révision', async () => {
    const { addErrorBankItem } = await import('@/lib/store/premium-store');
    const item = await addErrorBankItem({
      studentId: 'stu-1',
      errorType: 'syntaxe_erreur',
      category: 'langue',
      microSkillId: 'langue_relatives',
      example: 'erreur',
      correction: 'correction',
      sourceInteractionId: 'i-1',
      sourceAgent: 'correcteur',
    });

    const j2 = new Date(item.dueDates.j2).getTime();
    const j7 = new Date(item.dueDates.j7).getTime();
    const j21 = new Date(item.dueDates.j21).getTime();

    expect(j2).toBeLessThan(j7);
    expect(j7).toBeLessThan(j21);
  });
});

describe('ErrorBank — getDueErrorBankItems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('retourne les items j2 qui sont échus', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));

    const { addErrorBankItem, getDueErrorBankItems } = await import('@/lib/store/premium-store');

    await addErrorBankItem({
      studentId: 'stu-2',
      errorType: 'plan_desequilibre',
      category: 'ecrit',
      microSkillId: 'ecrit_plan',
      example: 'ex',
      correction: 'corr',
      sourceInteractionId: 'i',
      sourceAgent: 'correcteur',
    });

    // Avancer le temps de 3 jours
    vi.setSystemTime(new Date('2026-01-04T00:00:00Z'));
    const due = await getDueErrorBankItems('stu-2');
    expect(due.length).toBeGreaterThanOrEqual(1);

    vi.useRealTimers();
  });

  it('ne retourne pas les items résolus', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-01T00:00:00Z'));

    const { addErrorBankItem, recordRevisionAttempt, getDueErrorBankItems } = await import('@/lib/store/premium-store');

    const item = await addErrorBankItem({
      studentId: 'stu-3',
      errorType: 'citation_absente',
      category: 'ecrit',
      microSkillId: 'ecrit_citations',
      example: 'ex',
      correction: 'corr',
      sourceInteractionId: 'i',
      sourceAgent: 'correcteur',
    });

    // 3 révisions réussies → resolved = true
    for (let i = 0; i < 3; i++) {
      await recordRevisionAttempt(item.id, {
        date: new Date().toISOString(),
        phase: i === 0 ? 'j2' : i === 1 ? 'j7' : 'j21',
        success: true,
      });
    }

    vi.setSystemTime(new Date('2026-02-10T00:00:00Z'));
    const due = await getDueErrorBankItems('stu-3');
    const targetItem = due.find((d) => d.id === item.id);
    expect(targetItem).toBeUndefined();

    vi.useRealTimers();
  });
});

describe('SkillMap — getOrCreateSkillMap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('crée un SkillMap vide pour un nouvel étudiant', async () => {
    const { getOrCreateSkillMap } = await import('@/lib/store/premium-store');
    const map = await getOrCreateSkillMap('new-student-123');
    expect(map.studentId).toBe('new-student-123');
    expect(map.axes.ecrit).toEqual([]);
    expect(map.axes.oral).toEqual([]);
  });

  it('updateSkillMap borne les scores entre 0 et 1', async () => {
    const { updateSkillMap } = await import('@/lib/store/premium-store');
    const map = await updateSkillMap('stu-bounds', [
      { microSkillId: 'ecrit_plan', score: 1.5 },
      { microSkillId: 'oral_lecture', score: -0.2 },
    ]);

    const planSkill = map.axes.ecrit.find((s) => s.microSkillId === 'ecrit_plan');
    const lectureSkill = map.axes.oral.find((s) => s.microSkillId === 'oral_lecture');
    expect(planSkill?.score).toBeLessThanOrEqual(1);
    expect(lectureSkill?.score).toBeGreaterThanOrEqual(0);
  });
});
