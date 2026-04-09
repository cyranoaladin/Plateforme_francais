import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { isPublicPath, middleware } from '../../middleware';

describe('middleware public routes', () => {
  it('considère /contact comme route publique', () => {
    expect(isPublicPath('/contact')).toBe(true);
    expect(isPublicPath('/pricing')).toBe(true);
  });

  it('ne redirige pas /contact vers /login et applique CSP', () => {
    const response = middleware(new NextRequest('http://localhost:3000/contact'));
    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
  });

  it('redirige /bienvenue vers la route canonique /', () => {
    const response = middleware(new NextRequest('http://localhost:3000/bienvenue'));
    expect(response.headers.get('location')).toBe('http://localhost:3000/');
  });

  it('redirige /connexion vers /login', () => {
    const response = middleware(new NextRequest('http://localhost:3000/connexion'));
    expect(response.headers.get('location')).toBe('http://localhost:3000/login');
  });

  it('redirige /inscription vers /login?mode=register', () => {
    const response = middleware(new NextRequest('http://localhost:3000/inscription'));
    expect(response.headers.get('location')).toBe('http://localhost:3000/login?mode=register');
  });

  it('redirige /tarifs vers /pricing', () => {
    const response = middleware(new NextRequest('http://localhost:3000/tarifs'));
    expect(response.headers.get('location')).toBe('http://localhost:3000/pricing');
  });

  it('laisse /parent passer au middleware normal quand une session existe', () => {
    const request = new NextRequest('http://localhost:3000/parent', {
      headers: {
        cookie: 'eaf_session=test-session',
      },
    });

    const response = middleware(request);
    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
  });

  it('considère /api/v1/cron/session-cleanup comme route publique (protégée par CRON_SECRET côté handler)', () => {
    expect(isPublicPath('/api/v1/cron/session-cleanup')).toBe(true);

    const response = middleware(new NextRequest('http://localhost:3000/api/v1/cron/session-cleanup'));
    expect(response.status).not.toBe(401);
  });

  it('rejette GET sur une route POST-only explicitement autorisée', () => {
    const response = middleware(new NextRequest('http://localhost:3000/api/v1/auth/logout', {
      method: 'GET',
    }));
    expect(response.status).toBe(405);
  });
});
