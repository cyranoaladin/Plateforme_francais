import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';

import LandingPage from '../../src/app/page';

describe('landing page CSP compatibility', () => {
  it('renders without inline style attributes on the root page', () => {
    const html = renderToString(<LandingPage />);

    expect(html).not.toContain(' style=');
  });
});
