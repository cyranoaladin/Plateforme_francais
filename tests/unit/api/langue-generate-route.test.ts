import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/guard', () => ({
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock('@/lib/security/csrf', () => ({
  validateCsrf: vi.fn().mockResolvedValue(null),
}));

import { requireAuthenticatedUser } from '@/lib/auth/guard';

const authOk = {
  user: {
    id: 'user-langue',
    profile: {},
  },
};

describe('POST /api/v1/langue/generate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({ auth: authOk, errorResponse: null } as never);
  });

  it('retourne une serie locale de 5 exercices en mode mixte', async () => {
    const { POST } = await import('@/app/api/v1/langue/generate/route');
    const req = new Request('http://localhost/api/v1/langue/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ theme: 'mixte', count: 5 }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.source).toBe('local_bank');
    expect(body.exercises).toHaveLength(5);
    expect(new Set(body.exercises.map((exercise: { id: string }) => exercise.id)).size).toBe(5);
  });

  it('respecte le theme demande', async () => {
    const { POST } = await import('@/app/api/v1/langue/generate/route');
    const req = new Request('http://localhost/api/v1/langue/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ theme: 'systeme_verbal', count: 4 }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.exercises).toHaveLength(4);
    expect(
      body.exercises.every((exercise: { axe: string }) => exercise.axe === 'systeme_verbal'),
    ).toBe(true);
  });
});
