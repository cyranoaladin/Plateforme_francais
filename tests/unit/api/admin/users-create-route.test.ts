import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth/guard', () => ({
  requireUserRole: vi.fn(),
}));

vi.mock('@/lib/security/csrf', () => ({
  validateCsrf: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/lib/security/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ allowed: true, retryAfter: 0 }),
}));

vi.mock('@/lib/admin/audit', () => ({
  logAdminAction: vi.fn(),
  getClientIp: vi.fn().mockReturnValue('127.0.0.1'),
}));

const mockFindUserByEmail = vi.fn();
const mockCreateUser = vi.fn();

vi.mock('@/lib/db/repositories/userRepo', () => ({
  findUserByEmail: (...args: unknown[]) => mockFindUserByEmail(...args),
  createUser: (...args: unknown[]) => mockCreateUser(...args),
}));

vi.mock('@/lib/auth/session', () => ({
  createPasswordCredentials: vi.fn().mockReturnValue({
    passwordHash: 'hash123',
    passwordSalt: 'salt123',
  }),
}));

vi.mock('@/lib/date/current-school-year', () => ({
  getCurrentAnneeScolaire: vi.fn().mockReturnValue('2025-2026'),
}));

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
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

describe('POST /api/v1/admin/users/create', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireUserRole).mockResolvedValue(makeAdminAuth());
  });

  it('creates a new user successfully', async () => {
    vi.mocked(parseJsonBody).mockResolvedValue({
      success: true,
      data: { email: 'new@test.com', password: 'password123', role: 'eleve' },
    } as never);
    mockFindUserByEmail.mockResolvedValue(null);
    mockCreateUser.mockResolvedValue(undefined);

    const { POST } = await import('@/app/api/v1/admin/users/create/route');
    const req = new Request('http://localhost/api/v1/admin/users/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'new@test.com', password: 'password123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.user.email).toBe('new@test.com');
    expect(body.user.role).toBe('eleve');

    expect(mockCreateUser).toHaveBeenCalledOnce();
    expect(logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'user.create', targetType: 'user' }),
    );
  });

  it('returns 409 if email already exists', async () => {
    vi.mocked(parseJsonBody).mockResolvedValue({
      success: true,
      data: { email: 'existing@test.com', password: 'password123', role: 'eleve' },
    } as never);
    mockFindUserByEmail.mockResolvedValue({ id: 'u-exists', email: 'existing@test.com' });

    const { POST } = await import('@/app/api/v1/admin/users/create/route');
    const req = new Request('http://localhost/api/v1/admin/users/create', {
      method: 'POST',
      body: JSON.stringify({ email: 'existing@test.com', password: 'password123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  it('returns 403 for non-admin users', async () => {
    vi.mocked(requireUserRole).mockResolvedValue({
      auth: null,
      errorResponse: new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
    } as never);

    const { POST } = await import('@/app/api/v1/admin/users/create/route');
    const req = new Request('http://localhost/api/v1/admin/users/create', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('returns 429 when rate limited', async () => {
    const { checkRateLimit } = await import('@/lib/security/rate-limit');
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, retryAfter: 60 } as never);

    const { POST } = await import('@/app/api/v1/admin/users/create/route');
    const req = new Request('http://localhost/api/v1/admin/users/create', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
  });
});
