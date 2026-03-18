import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { isPublicPath, middleware } from '../../middleware';

describe('middleware public routes', () => {
  it('considère /contact comme route publique', () => {
    expect(isPublicPath('/contact')).toBe(true);
    expect(isPublicPath('/pricing')).toBe(true);
  });

  it('ne redirige pas /contact vers /login', () => {
    const response = middleware(new NextRequest('http://localhost:3000/contact'));
    expect(response.headers.get('location')).toBeNull();
  });

  it('redirige /bienvenue vers la route canonique /', () => {
    const response = middleware(new NextRequest('http://localhost:3000/bienvenue'));
    expect(response.headers.get('location')).toBe('http://localhost:3000/');
  });
});
