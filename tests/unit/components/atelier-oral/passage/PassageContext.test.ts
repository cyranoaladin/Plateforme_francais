import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PassageContext } from '@/app/atelier-oral/components/passage/PassageContext';

describe('PassageContext', () => {
  it("affiche l'extrait, la question de grammaire et l'œuvre d'entretien", () => {
    const html = renderToString(
      createElement(PassageContext, {
        session: {
          sessionId: 'session-1',
          texte: 'Un extrait test.',
          questionGrammaire: 'Analysez la négation.',
          phraseGrammaire: 'Je ne sais pas.',
          oeuvreChoisie: 'Manon Lescaut',
          instructions: '',
        },
      }),
    );

    expect(html).toContain('Extrait &amp; question de grammaire');
    expect(html).toContain('Un extrait test.');
    expect(html).toContain('Analysez la négation.');
    expect(html).toContain('Manon Lescaut');
  });
});
