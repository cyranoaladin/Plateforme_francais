import { describe, expect, it } from 'vitest';
import { createPasswordCredentials, verifyPassword } from '@/lib/auth/session';

describe('Auth password', () => {
  it('hash + verify fonctionne et refuse un mauvais mot de passe', () => {
    const creds = createPasswordCredentials('demo1234');
    const user = {
      id: 'u1',
      email: 'u@test.local',
      role: 'eleve',
      passwordHash: creds.passwordHash,
      passwordSalt: creds.passwordSalt,
      createdAt: new Date().toISOString(),
      profile: {
        id: 'p1', userId: 'u1', displayName: 'U', classLevel: 'Premiere', targetScore: '14',
        preferredObjects: [], weakSkills: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      },
      sessions: [],
    };

    expect(verifyPassword('demo1234', user as never)).toBe(true);
    expect(verifyPassword('wrong', user as never)).toBe(false);
  });
});
