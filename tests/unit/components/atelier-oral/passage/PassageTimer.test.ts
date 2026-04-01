import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PassageTimer } from '@/app/atelier-oral/components/passage/PassageTimer';

describe('PassageTimer', () => {
  it('affiche les deux compteurs pendant une simulation', () => {
    const html = renderToString(
      createElement(PassageTimer, {
        currentStep: 'LECTURE',
        currentStepIndex: 0,
        passageRemaining: 1200,
        phaseRemaining: 110,
        isSimulation: true,
      }),
    );

    expect(html).toContain('Temps restant passage');
    expect(html).toContain('Temps restant phase lecture');
  });
});
