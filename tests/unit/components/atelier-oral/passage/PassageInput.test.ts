import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PassageInput } from '@/app/atelier-oral/components/passage/PassageInput';

describe('PassageInput', () => {
  it('affiche le textarea et le bouton micro avec le bon libellé de phase', () => {
    const html = renderToString(
      createElement(PassageInput, {
        currentStepLabel: 'Lecture /2',
        isMicOn: false,
        transcript: 'Réponse test',
        setTranscript: () => {},
        toggleMic: async () => {},
      }),
    );

    expect(html).toContain('Clique pour enregistrer');
    expect(html).toContain('Lecture /2');
    expect(html).toContain('Transcription / réponse');
    expect(html).toContain('Réponse test');
  });
});
