import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PassageFeedback } from '@/app/atelier-oral/components/passage/PassageFeedback';

describe('PassageFeedback', () => {
  it("affiche le badge d'évaluation indisponible et la relance jury", () => {
    const html = renderToString(
      createElement(PassageFeedback, {
        steps: ['LECTURE'],
        stepLabels: { LECTURE: 'Lecture /2', EXPLICATION: 'Explication /8', GRAMMAIRE: 'Grammaire /2', ENTRETIEN: 'Entretien /8' },
        aggregated: { totalScore: 0, totalMax: 2 },
        feedbacks: {
          LECTURE: {
            feedback: 'Évaluation automatique indisponible.',
            score: 0,
            max: 2,
            points_forts: ['Diction nette'],
            axes: ['Structurer davantage'],
            evaluationFailed: true,
            relance: 'Développe ton analyse.',
          },
          EXPLICATION: undefined,
          GRAMMAIRE: undefined,
          ENTRETIEN: undefined,
        },
      }),
    );

    expect(html).toContain('Évaluation indisponible');
    expect(html).toContain('score non comptabilisé');
    expect(html).toContain("Relance de l’examinateur");
  });
});
