import { describe, expect, it } from 'vitest';
import { evaluateLangueAnswer } from '@/lib/evaluation/langue';

describe('evaluateLangueAnswer', () => {
  it('attribue 2/2 à une réponse complète sur la relative', () => {
    const result = evaluateLangueAnswer(
      1,
      'C\'est une subordonnée relative introduite par le pronom relatif qui, avec antécédent mer, et sa fonction est complément de l\'antécédent.',
    );

    expect(result.score).toBe(2);
    expect(result.status).toBe('success');
  });

  it('détecte une réponse insuffisante', () => {
    const result = evaluateLangueAnswer(2, 'Je ne sais pas.');

    expect(result.score).toBe(0.5);
    expect(result.status).toBe('error');
    expect(result.missing.length).toBeGreaterThan(0);
  });
});
