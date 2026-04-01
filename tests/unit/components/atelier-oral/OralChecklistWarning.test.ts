import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { OralChecklistWarning } from '@/app/atelier-oral/components/OralChecklistWarning';

describe('OralChecklistWarning', () => {
  it('affiche un rappel tant que la checklist est incomplète', () => {
    const html = renderToString(createElement(OralChecklistWarning, { completed: 2, total: 5 }));
    expect(html).toContain('Checklist incomplète');
  });

  it("n'affiche rien quand tout est complété", () => {
    const html = renderToString(createElement(OralChecklistWarning, { completed: 5, total: 5 }));
    expect(html).toBe('');
  });
});
