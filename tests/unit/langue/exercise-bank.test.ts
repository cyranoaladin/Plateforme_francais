import { describe, expect, it } from 'vitest';
import { buildLangueExerciseSeries, getLangueExerciseBank } from '@/lib/langue/exercise-bank';

describe('langue exercise bank', () => {
  it('contient une banque riche pour le mode mixte', () => {
    expect(getLangueExerciseBank('mixte').length).toBeGreaterThanOrEqual(15);
  });

  it('filtre correctement les exercices par theme', () => {
    const subordonnees = getLangueExerciseBank('subordonnees');
    const relations = getLangueExerciseBank('relations_logiques');
    const verbal = getLangueExerciseBank('systeme_verbal');

    expect(subordonnees.every((exercise) => exercise.axe === 'subordonnees')).toBe(true);
    expect(relations.every((exercise) => exercise.axe === 'relations_logiques')).toBe(true);
    expect(verbal.every((exercise) => exercise.axe === 'systeme_verbal')).toBe(true);
  });

  it('compose une serie de 5 exercices uniques pour le mode mixte', () => {
    const series = buildLangueExerciseSeries('mixte', 5);
    expect(series).toHaveLength(5);
    expect(new Set(series.map((exercise) => exercise.id)).size).toBe(5);
  });

  it('compose une serie thematique avec le bon axe', () => {
    const series = buildLangueExerciseSeries('relations_logiques', 5);
    expect(series).toHaveLength(5);
    expect(series.every((exercise) => exercise.axe === 'relations_logiques')).toBe(true);
  });
});
