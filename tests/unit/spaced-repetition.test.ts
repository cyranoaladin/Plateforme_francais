import { beforeEach, describe, expect, it } from 'vitest';
import {
  addErrorBankItem,
  getErrorBankItems,
  recordRevisionAttempt,
  writePremiumStore,
} from '@/lib/store/premium-store';

describe('spaced-repetition', () => {
  beforeEach(async () => {
    await writePremiumStore((current) => ({
      ...current,
      errorBankV2: [],
    }));
  });

  it('sets due dates at J+2, J+7, J+21 when creating an error item', async () => {
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
  });

  it('marks item resolved after 3 successful revisions', async () => {
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

    await recordRevisionAttempt(created.id, { date: new Date().toISOString(), phase: 'j2', success: true });
    await recordRevisionAttempt(created.id, { date: new Date().toISOString(), phase: 'j7', success: true });
    await recordRevisionAttempt(created.id, { date: new Date().toISOString(), phase: 'j21', success: true });

    const items = await getErrorBankItems('student-b');
    expect(items).toHaveLength(1);
    expect(items[0].resolved).toBe(true);
    expect(items[0].revisionHistory).toHaveLength(3);
  });
});
