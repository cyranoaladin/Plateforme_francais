import { describe, expect, it, vi } from 'vitest';

const getAuthenticatedUserMock = vi.fn();
vi.mock('@/lib/auth/session', () => ({
  getAuthenticatedUser: getAuthenticatedUserMock,
}));

describe('RBAC guard', () => {
  it('refuse un élève sur route enseignant', async () => {
    getAuthenticatedUserMock.mockResolvedValueOnce({ user: { role: 'eleve' } });
    const { requireUserRole } = await import('@/lib/auth/guard');
    const out = await requireUserRole('enseignant');
    expect(out.auth).toBeNull();
    expect(out.errorResponse?.status).toBe(403);
  });

  it('accepte admin quel que soit le role demandé', async () => {
    getAuthenticatedUserMock.mockResolvedValueOnce({ user: { role: 'admin' } });
    const { requireUserRole } = await import('@/lib/auth/guard');
    const out = await requireUserRole('enseignant');
    expect(out.auth).toBeTruthy();
    expect(out.errorResponse).toBeNull();
  });

  it('refuse admin sur une garde stricte parent', async () => {
    getAuthenticatedUserMock.mockResolvedValueOnce({ user: { role: 'admin' } });
    const { requireExactUserRole } = await import('@/lib/auth/guard');
    const out = await requireExactUserRole('parent');
    expect(out.auth).toBeNull();
    expect(out.errorResponse?.status).toBe(403);
  });
});
