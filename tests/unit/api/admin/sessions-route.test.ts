import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/guard', () => ({
  requireUserRole: vi.fn(),
}));

vi.mock('@/lib/security/csrf', () => ({
  validateCsrf: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/admin/audit', () => ({
  logAdminAction: vi.fn(),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));

const mockSessionFindMany = vi.fn();
const mockSessionCount = vi.fn();
const mockSessionDeleteMany = vi.fn();

vi.mock('@/lib/db/client', () => ({
  prisma: {
    session: {
      findMany: (...args: unknown[]) => mockSessionFindMany(...args),
      count: (...args: unknown[]) => mockSessionCount(...args),
      deleteMany: (...args: unknown[]) => mockSessionDeleteMany(...args),
    },
  },
}));

vi.mock('@/lib/validation/request', () => ({
  parseJsonBody: vi.fn(),
}));

import { requireUserRole } from '@/lib/auth/guard';
import { parseJsonBody } from '@/lib/validation/request';

function makeAdminAuth() {
  return {
    auth: { user: { id: 'admin-1', email: 'admin@test.com', role: 'admin' } },
    errorResponse: null,
  } as never;
}

describe('GET /api/v1/admin/sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireUserRole).mockResolvedValue(makeAdminAuth());
  });

  it('returns active sessions', async () => {
    const now = new Date();
    mockSessionFindMany.mockResolvedValue([
      {
        userId: 'u1',
        createdAt: now,
        expiresAt: new Date(now.getTime() + 86400000),
        lastSeenAt: now,
        user: { email: 'user@test.com', role: 'eleve', profile: { displayName: 'Test' } },
      },
    ]);
    mockSessionCount.mockResolvedValue(1);

    const { GET } = await import('@/app/api/v1/admin/sessions/route');
    const res = await GET();
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.sessions).toHaveLength(1);
    expect(body.sessions[0].email).toBe('user@test.com');
    expect(body.totalActive).toBe(1);
    // Token should not be exposed
    expect(body.sessions[0].token).toBeUndefined();
  });

  it('returns 403 for non-admin', async () => {
    vi.mocked(requireUserRole).mockResolvedValue({
      auth: null,
      errorResponse: new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
    } as never);

    const { GET } = await import('@/app/api/v1/admin/sessions/route');
    const res = await GET();
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/v1/admin/sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireUserRole).mockResolvedValue(makeAdminAuth());
  });

  it('revokes sessions for a user', async () => {
    vi.mocked(parseJsonBody).mockResolvedValue({
      success: true,
      data: { userId: 'u1' },
    } as never);
    mockSessionDeleteMany.mockResolvedValue({ count: 2 });

    const { DELETE } = await import('@/app/api/v1/admin/sessions/route');
    const req = new Request('http://localhost/api/v1/admin/sessions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'u1' }),
    });

    const res = await DELETE(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.revoked).toBe(2);
  });

  it('returns validation error for invalid userId', async () => {
    vi.mocked(parseJsonBody).mockResolvedValue({
      success: false,
      response: new Response(JSON.stringify({ error: 'Invalid' }), { status: 400 }),
    } as never);

    const { DELETE } = await import('@/app/api/v1/admin/sessions/route');
    const req = new Request('http://localhost/api/v1/admin/sessions', {
      method: 'DELETE',
      body: JSON.stringify({ userId: 'bad' }),
    });

    const res = await DELETE(req);
    expect(res.status).toBe(400);
  });
});
