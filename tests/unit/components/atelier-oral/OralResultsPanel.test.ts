import { createElement, type AnchorHTMLAttributes } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { OralResultsPanel } from '@/app/atelier-oral/components/OralResultsPanel';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) =>
    createElement('a', { href, ...props }, children),
}));

describe('OralResultsPanel', () => {
  it('affiche le bilan global et les scores par phase', () => {
    const html = renderToString(
      createElement(OralResultsPanel, {
        bilan: {
          note: 14,
          maxNote: 20,
          mention: 'Bien',
          phases: {
            lecture: { note: 2, max: 2, commentaire: 'Lecture nette.' },
            explication: { note: 6, max: 8, commentaire: 'Analyse solide.' },
            grammaire: { note: 1, max: 2, commentaire: 'Réponse correcte.' },
            entretien: { note: 5, max: 8, commentaire: 'Dialogue cohérent.' },
          },
          bilan_global: 'Ensemble structuré.',
          conseil_final: 'Citer plus précisément.',
        },
        oralTutorHref: '/tuteur',
        onReset: () => {},
      }),
    );

    expect(html).toContain('Bilan officiel');
    expect(html).toContain('14');
    expect(html).toContain('Ensemble structuré.');
    expect(html).toContain('Citer plus précisément.');
  });
});
