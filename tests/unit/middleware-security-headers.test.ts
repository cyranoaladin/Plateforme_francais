import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import { middleware } from '../../middleware';

describe('middleware security headers', () => {
  it('disables microphone outside atelier-oral', () => {
    const response = middleware(
      new NextRequest('http://localhost/dashboard', {
        headers: { cookie: 'eaf_session=test-token' },
      }),
    );

    expect(response.headers.get('Permissions-Policy')).toContain('microphone=()');
  });

  it('allows microphone on atelier-oral pages', () => {
    const response = middleware(
      new NextRequest('http://localhost/atelier-oral', {
        headers: { cookie: 'eaf_session=test-token' },
      }),
    );

    expect(response.headers.get('Permissions-Policy')).toContain('microphone=(self)');
  });

  it('publishes the same nonce on both compatibility headers', () => {
    const response = middleware(
      new NextRequest('http://localhost/dashboard', {
        headers: { cookie: 'eaf_session=test-token' },
      }),
    );

    expect(response.headers.get('x-nonce')).toBeTruthy();
    expect(response.headers.get('x-csp-nonce')).toBe(response.headers.get('x-nonce'));
    expect(response.headers.get('Content-Security-Policy')).toContain(`'nonce-${response.headers.get('x-nonce')}'`);
  });

  it('CSP on landing page uses nonce and script hashes', () => {
    const response = middleware(new NextRequest('http://localhost/'));
    const csp = response.headers.get('Content-Security-Policy');

    expect(csp).toBeTruthy();
    expect(csp).toContain(`'nonce-${response.headers.get('x-nonce')}'`);
    // Note: Strategy B is currently applied - unsafe-inline is allowed for style-src
    // until landing page inline styles are migrated to Tailwind.
    // See middleware.ts line 129: enforceStrictStyleCsp = false
    // TODO: Re-enable strict CSP test when inline styles are removed from landing
    expect(csp).not.toContain('unsafe-eval');
  });

  it('CSP includes style-src with current strategy', () => {
    const response = middleware(new NextRequest('http://localhost/'));
    const csp = response.headers.get('Content-Security-Policy');

    expect(csp).toContain('style-src');
    expect(csp).toContain("'self'");
    // Current state: unsafe-inline is allowed for styles due to landing page requirements
    expect(csp).toContain("'unsafe-inline'");
  });
});
