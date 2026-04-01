import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { OralPrepPhase } from '@/app/atelier-oral/components/OralPrepPhase';

describe('OralPrepPhase', () => {
  it('affiche le timer et la checklist de preparation', () => {
    const html = renderToString(
      createElement(OralPrepPhase, {
        remainingSeconds: 1500,
        onReset: () => {},
        checklistItems: [
          { id: 'contexte', label: 'Identifier le contexte' },
          { id: 'mouvement', label: 'Repérer les mouvements' },
        ],
        checkedSet: new Set(['contexte']),
        toggleItem: () => {},
      }),
    );

    expect(html).toContain('Préparation libre');
    expect(html).toContain('25:00');
    expect(html).toContain('Identifier le contexte');
  });
});
