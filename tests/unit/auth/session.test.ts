import { describe, expect, it } from 'vitest';
import { createSession, isSessionExpired } from '@/lib/memory/store';

describe('Auth session model', () => {
  it('crée une session valide non expirée', () => {
    const session = createSession('user-1');
    expect(session.token).toBeTruthy();
    expect(session.userId).toBe('user-1');
    expect(isSessionExpired(session)).toBe(false);
  });

  it('détecte une session expirée', () => {
    const old = {
      token: 'tok', userId: 'u1', createdAt: '2020-01-01T00:00:00.000Z',
      lastSeenAt: '2020-01-01T00:00:00.000Z', expiresAt: '2020-01-02T00:00:00.000Z',
    };
    expect(isSessionExpired(old)).toBe(true);
  });
});
