import { describe, it, expect } from 'vitest';

/**
 * We test the pure/exported helpers from copy-analysis.
 * Since mapLacunesToEafSkills and detectCopyType are module-private,
 * we test them indirectly via getMiniDiagnosticExercise (public)
 * and validate the module's exported types and public API surface.
 *
 * For full integration tests of analyzeOnboardingCopy / processOnboardingCopy,
 * mocking the orchestrator and prisma is required (integration test scope).
 */
import { getMiniDiagnosticExercise } from '@/lib/onboarding/copy-analysis';

describe('getMiniDiagnosticExercise', () => {
  const exercise = getMiniDiagnosticExercise();

  it('returns a texte and consigne', () => {
    expect(exercise).toHaveProperty('texte');
    expect(exercise).toHaveProperty('consigne');
    expect(typeof exercise.texte).toBe('string');
    expect(typeof exercise.consigne).toBe('string');
  });

  it('texte contains a properly attributed citation', () => {
    expect(exercise.texte).toContain('Baudelaire');
    expect(exercise.texte).toContain('Les Fleurs du Mal');
    expect(exercise.texte).toContain('1857');
  });

  it('texte is a quotation with guillemets', () => {
    expect(exercise.texte).toMatch(/[«"]/);
  });

  it('consigne includes instruction to identify procédé stylistique', () => {
    const lower = exercise.consigne.toLowerCase();
    expect(lower).toContain('procédé');
    expect(lower).toContain('stylistique');
  });

  it('consigne asks for multiple procédés (minimum 2)', () => {
    expect(exercise.consigne).toContain('minimum 2');
  });

  it('consigne requests 8-12 lines of analysis', () => {
    expect(exercise.consigne).toContain('8-12 lignes');
  });

  it('texte does not contain dubious attribution', () => {
    expect(exercise.texte).not.toContain("Guillaume d'Orange");
  });
});
