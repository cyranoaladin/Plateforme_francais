import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EcritEpreuveSelector } from '@/app/atelier-ecrit/components/EcritEpreuveSelector';

describe('EcritEpreuveSelector', () => {
  it('affiche le CTA de génération quand aucun sujet n’est encore prêt', () => {
    const html = renderToString(
      createElement(EcritEpreuveSelector, {
        type: 'commentaire',
        oeuvre: '',
        theme: '',
        onTypeChange: () => {},
        onOeuvreChange: () => {},
        onThemeChange: () => {},
        onGenerate: async () => {},
        isGenerating: false,
        epreuve: null,
      }),
    );

    expect(html).toContain('Génère un sujet d&#x27;épreuve blanche.');
    expect(html).toContain('Générer mon sujet');
  });
});
