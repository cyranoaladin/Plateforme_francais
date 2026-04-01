import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { OralWorkSelector } from '@/app/atelier-oral/components/OralWorkSelector';

describe('OralWorkSelector (atelier-oral)', () => {
  it('affiche les œuvres, les profils et le bandeau programme si fourni', () => {
    const html = renderToString(
      createElement(OralWorkSelector, {
        availableWorks: ['Manon Lescaut', 'La Peau de chagrin'],
        currentWork: 'Manon Lescaut',
        selectedMode: 'SIMULATION',
        onSelectWork: () => {},
        onChangeMode: () => {},
        examinerProfile: 'NEUTRE',
        onChangeProfile: () => {},
        showProgrammeWarning: true,
        warningMessage:
          "Le programme 2026-2027 n'est pas encore disponible. Les œuvres affichées sont celles du programme 2025-2026.",
      }),
    );

    expect(html).toContain('Simulation officielle');
    expect(html).toContain('Pratique libre');
    expect(html).toContain('Manon Lescaut');
    expect(html).toContain("programme 2025-2026");
  });
});
