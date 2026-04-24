import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { OralChecklistWarning } from '@/app/atelier-oral/components/OralChecklistWarning';

describe('OralChecklistWarning', () => {
  it('affiche un rappel tant que la checklist est incomplète', () => {
    const html = renderToString(createElement(OralChecklistWarning, { completed: 2, total: 5 }));
    expect(html).toContain('Checklist incomplète');
  });

  it("n'affiche rien quand tout est complété et descriptif OK", () => {
    const html = renderToString(createElement(OralChecklistWarning, { completed: 5, total: 5 }));
    expect(html).toBe('');
  });

  it('affiche une alerte descriptif vide quand descriptifCount === 0', () => {
    const html = renderToString(
      createElement(OralChecklistWarning, { completed: 5, total: 5, descriptifCount: 0 }),
    );
    expect(html).toContain('descriptif de lecture est vide');
  });

  it("affiche un avertissement partiel quand 0 < descriptifCount < 16", () => {
    const html = renderToString(
      createElement(OralChecklistWarning, { completed: 5, total: 5, descriptifCount: 8 }),
    );
    // React SSR inserts comment nodes between JSX expressions
    expect(html).toContain('>8<');
    expect(html).toContain('/16 textes');
  });

  it("n'affiche pas d'avertissement descriptif quand descriptifCount >= 16", () => {
    const html = renderToString(
      createElement(OralChecklistWarning, { completed: 5, total: 5, descriptifCount: 16 }),
    );
    expect(html).toBe('');
  });

  it("n'affiche pas d'avertissement descriptif quand descriptifCount est undefined", () => {
    const html = renderToString(
      createElement(OralChecklistWarning, { completed: 5, total: 5, descriptifCount: undefined }),
    );
    expect(html).toBe('');
  });

  it('affiche les deux alertes si checklist incomplète ET descriptif vide', () => {
    const html = renderToString(
      createElement(OralChecklistWarning, { completed: 2, total: 5, descriptifCount: 0 }),
    );
    expect(html).toContain('descriptif de lecture est vide');
    expect(html).toContain('Checklist incomplète');
  });
});
