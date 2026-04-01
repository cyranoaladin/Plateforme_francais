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
});
