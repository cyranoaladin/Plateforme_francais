import { createElement, type AnchorHTMLAttributes } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { PassagePrincipe } from '@/app/atelier-oral/components/passage/PassagePrincipe';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) =>
    createElement('a', { href, ...props }, children),
}));

describe('PassagePrincipe', () => {
  it('rappelle le principe de séance et propose le lien de guidage', () => {
    const html = renderToString(
      createElement(PassagePrincipe, {
        oralTutorHref: '/tuteur',
      }),
    );

    expect(html).toContain('Principe de séance');
    expect(html).toContain('Mieux vaut quatre prises de parole nettes');
    expect(html).toContain('Reprendre cette phase avec le guidage');
    expect(html).toContain('href="/tuteur"');
  });
});
