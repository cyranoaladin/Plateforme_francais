import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/guard', () => ({
  requireUserRole: vi.fn().mockResolvedValue({ auth: null, errorResponse: new Response(JSON.stringify({ error: 'Accès refusé.' }), { status: 403 }) }),
  requireExactUserRole: vi.fn().mockResolvedValue({ auth: null, errorResponse: new Response(JSON.stringify({ error: 'Accès refusé.' }), { status: 403 }) }),
}));

describe('integration enseignant API', () => {
  it('403 si élève tente accès enseignant', async () => {
    const { GET } = await import('@/app/api/v1/enseignant/dashboard/route');
    const res = await GET(new Request('http://localhost/api/v1/enseignant/dashboard') as never);
    expect(res.status).toBe(403);
  });
});
