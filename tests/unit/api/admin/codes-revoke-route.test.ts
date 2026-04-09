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

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

const mockCodeFindUnique = vi.fn();
const mockCodeUpdate = vi.fn();

vi.mock('@/lib/db/client', () => ({
  prisma: {
    activationCode: {
      findUnique: (...args: unknown[]) => mockCodeFindUnique(...args),
      update: (...args: unknown[]) => mockCodeUpdate(...args),
    },
  },
}));

vi.mock('@/lib/validation/request', () => ({
  parseJsonBody: vi.fn(),
}));

import { requireUserRole } from '@/lib/auth/guard';
import { parseJsonBody } from '@/lib/validation/request';
import { logAdminAction } from '@/lib/admin/audit';

function makeAdminAuth() {
  return {
    auth: { user: { id: 'admin-1', email: 'admin@test.com', role: 'admin' } },
    errorResponse: null,
  } as never;
}

describe('POST /api/v1/admin/activation-codes/revoke', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireUserRole).mockResolvedValue(makeAdminAuth());
  });

  it('revokes a CREATED code', async () => {
    vi.mocked(parseJsonBody).mockResolvedValue({
      success: true,
      data: { codeId: 'code-1' },
    } as never);
    mockCodeFindUnique.mockResolvedValue({
      id: 'code-1',
      status: 'CREATED',
      plan: 'PREMIUM',
    });
    mockCodeUpdate.mockResolvedValue({});

    const { POST } = await import('@/app/api/v1/admin/activation-codes/revoke/route');
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ codeId: 'code-1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);

    expect(mockCodeUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'code-1' },
        data: { status: 'REVOKED' },
      }),
    );
    expect(logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'code.revoke' }),
    );
  });

  it('rejects revoking a REDEEMED code', async () => {
    vi.mocked(parseJsonBody).mockResolvedValue({
      success: true,
      data: { codeId: 'code-2' },
    } as never);
    mockCodeFindUnique.mockResolvedValue({
      id: 'code-2',
      status: 'REDEEMED',
    });

    const { POST } = await import('@/app/api/v1/admin/activation-codes/revoke/route');
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ codeId: 'code-2' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(mockCodeUpdate).not.toHaveBeenCalled();
  });

  it('returns 404 for unknown code', async () => {
    vi.mocked(parseJsonBody).mockResolvedValue({
      success: true,
      data: { codeId: 'nope' },
    } as never);
    mockCodeFindUnique.mockResolvedValue(null);

    const { POST } = await import('@/app/api/v1/admin/activation-codes/revoke/route');
    const req = new Request('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ codeId: 'nope' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });
});
