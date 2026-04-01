import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PassageSubmitBar } from '@/app/atelier-oral/components/passage/PassageSubmitBar';

describe('PassageSubmitBar', () => {
  it('affiche le mode vocal actif et le bouton de soumission', () => {
    const html = renderToString(
      createElement(PassageSubmitBar, {
        currentStepLabel: 'Lecture /2',
        canSubmit: true,
        isLoading: false,
        useServerVoice: true,
        submitStep: async () => {},
      }),
    );

    expect(html).toContain('Soumettre —');
    expect(html).toContain('Lecture /2');
    expect(html).toContain('Mode vocal serveur');
    expect(html).toContain('Ton audio est envoyé pour transcription');
  });
});
