import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/guard', () => ({
  requireUserRole: vi.fn(),
}));

const mockAuditLogFindMany = vi.fn();
const mockAuditLogCount = vi.fn();

vi.mock('@/lib/db/client', () => ({
  prisma: {
    adminAuditLog: {
      findMany: (...args: unknown[]) => mockAuditLogFindMany(...args),
      count: (...args: unknown[]) => mockAuditLogCount(...args),
    },
  },
}));

import { requireUserRole } from '@/lib/auth/guard';

function makeAdminAuth() {
  return {
    auth: { user: { id: 'admin-1', email: 'admin@test.com', role: 'admin' } },
    errorResponse: null,
  } as never;
}

describe('GET /api/v1/admin/audit-log', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireUserRole).mockResolvedValue(makeAdminAuth());
  });

  it('returns paginated audit logs', async () => {
    const now = new Date();
    mockAuditLogFindMany.mockResolvedValue([
      {
        id: 'al-1',
        action: 'user.create',
        targetType: 'user',
        targetId: 'u1',
        details: { email: 'new@test.com' },
        ip: '1.2.3.4',
        createdAt: now,
        admin: { email: 'admin@test.com' },
      },
    ]);
    mockAuditLogCount.mockResolvedValue(1);

    const { GET } = await import('@/app/api/v1/admin/audit-log/route');
    const req = new Request('http://localhost/api/v1/admin/audit-log');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.logs).toHaveLength(1);
    expect(body.logs[0].action).toBe('user.create');
    expect(body.logs[0].adminEmail).toBe('admin@test.com');
    expect(body.pagination.total).toBe(1);
  });

  it('filters by action', async () => {
    mockAuditLogFindMany.mockResolvedValue([]);
    mockAuditLogCount.mockResolvedValue(0);

    const { GET } = await import('@/app/api/v1/admin/audit-log/route');
    const req = new Request('http://localhost/api/v1/admin/audit-log?action=user.suspend');
    const res = await GET(req);
    expect(res.status).toBe(200);

    expect(mockAuditLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { action: 'user.suspend' },
      }),
    );
  });

  it('respects pagination params', async () => {
    mockAuditLogFindMany.mockResolvedValue([]);
    mockAuditLogCount.mockResolvedValue(100);

    const { GET } = await import('@/app/api/v1/admin/audit-log/route');
    const req = new Request('http://localhost/api/v1/admin/audit-log?page=2&limit=25');
    const res = await GET(req);
    const body = await res.json();
    expect(body.pagination.page).toBe(2);
    expect(body.pagination.limit).toBe(25);
    expect(body.pagination.totalPages).toBe(4);
  });

  it('returns 403 for non-admin', async () => {
    vi.mocked(requireUserRole).mockResolvedValue({
      auth: null,
      errorResponse: new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
    } as never);

    const { GET } = await import('@/app/api/v1/admin/audit-log/route');
    const req = new Request('http://localhost/api/v1/admin/audit-log');
    const res = await GET(req);
    expect(res.status).toBe(403);
  });
});
