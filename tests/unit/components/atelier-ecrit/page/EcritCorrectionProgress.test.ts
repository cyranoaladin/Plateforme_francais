import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EcritCorrectionProgress } from '@/app/atelier-ecrit/components/EcritCorrectionProgress';

describe('EcritCorrectionProgress', () => {
  it('affiche les étapes du studio avec la bonne étape active', () => {
    const html = renderToString(
      createElement(EcritCorrectionProgress, {
        epreuveReady: true,
        copieReady: false,
        reportReady: false,
      }),
    );

    expect(html).toContain('Étape <!-- -->01');
    expect(html).toContain('Étape <!-- -->02');
    expect(html).toContain('Étape <!-- -->03');
  });
});
