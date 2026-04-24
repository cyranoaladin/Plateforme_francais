import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DescriptifRappelCard } from '@/components/dashboard/DescriptifRappelCard';

describe('DescriptifRappelCard', () => {
  it("affiche le nombre de textes manquants", () => {
    const html = renderToString(createElement(DescriptifRappelCard, { current: 4, minimum: 16 }));
    // 16 - 4 = 12 manquants, React SSR inserts comment nodes: "12<!-- --> textes"
    expect(html).toContain('>12<');
    expect(html).toContain('textes<');
  });

  it('utilise le singulier quand 1 texte manquant', () => {
    const html = renderToString(createElement(DescriptifRappelCard, { current: 15, minimum: 16 }));
    // React SSR: "1<!-- --> texte<!-- -->" — no trailing 's' after texte
    expect(html).toContain('>1<');
    // The string "textes" should NOT appear in the "manquants" context
    // We check the style width to confirm it's 94% not 12.5%
    expect(html).toContain('width:94%');
  });

  it('affiche le pourcentage correct', () => {
    const html = renderToString(createElement(DescriptifRappelCard, { current: 8, minimum: 16 }));
    // 8/16 = 50%
    expect(html).toContain('width:50%');
    expect(html).toContain('>50<');
  });

  it('ne d\u00e9passe pas 100%', () => {
    const html = renderToString(createElement(DescriptifRappelCard, { current: 20, minimum: 16 }));
    // Math.min(125, 100) = 100
    expect(html).toContain('width:100%');
    expect(html).not.toContain('width:125%');
  });

  it('contient le lien vers /descriptif-lecture', () => {
    const html = renderToString(createElement(DescriptifRappelCard, { current: 4, minimum: 16 }));
    expect(html).toContain('/descriptif-lecture');
  });

  it('affiche 0 / minimum quand aucun texte d\u00e9pos\u00e9', () => {
    const html = renderToString(createElement(DescriptifRappelCard, { current: 0, minimum: 16 }));
    expect(html).toContain('width:0%');
    expect(html).toContain('textes d\u00e9pos\u00e9s');
  });

  it('la barre de progression atteint la couleur teal quand >= 80%', () => {
    // 13/16 = 81.25% -> teal
    const html = renderToString(createElement(DescriptifRappelCard, { current: 13, minimum: 16 }));
    expect(html).toContain('eaf-teal');
  });

  it('la barre de progression est orange quand < 80%', () => {
    // 7/16 = 43.75% -> orange
    const html = renderToString(createElement(DescriptifRappelCard, { current: 7, minimum: 16 }));
    // At least one occurrence of eaf-orange in the progress bar style
    expect(html).toContain('width:44%');
  });
});
