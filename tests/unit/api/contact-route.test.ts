import { NextResponse } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/email/client', () => ({
  sendTransactionalEmail: vi.fn(async () => undefined),
}));
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));
vi.mock('@/lib/security/csrf', () => ({
  validateCsrf: vi.fn(),
}));
vi.mock('@/lib/security/rate-limit', () => ({
  checkRateLimit: vi.fn(),
}));
vi.mock('@/lib/validation/request', () => ({
  parseJsonBody: vi.fn(),
}));

describe('POST /api/v1/contact', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    delete process.env.SMTP_HOST;
  });

  it('retourne 403 si le contrôle CSRF échoue', async () => {
    const { validateCsrf } = await import('@/lib/security/csrf');
    vi.mocked(validateCsrf).mockResolvedValue(
      NextResponse.json({ error: 'Jeton CSRF manquant.' }, { status: 403 }),
    );

    const { POST } = await import('@/app/api/v1/contact/route');
    const response = await POST(new Request('http://localhost/api/v1/contact', { method: 'POST' }));

    expect(response.status).toBe(403);
  });

  it('retourne 200 et envoie l’email quand le payload est valide', async () => {
    process.env.SMTP_HOST = 'smtp.hostinger.com';

    const { validateCsrf } = await import('@/lib/security/csrf');
    const { checkRateLimit } = await import('@/lib/security/rate-limit');
    const { parseJsonBody } = await import('@/lib/validation/request');
    const { sendTransactionalEmail } = await import('@/lib/email/client');

    vi.mocked(validateCsrf).mockResolvedValue(null);
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, retryAfter: 0 });
    vi.mocked(parseJsonBody).mockResolvedValue({
      success: true,
      data: {
        name: 'Alice',
        email: 'alice@example.com',
        subject: 'general',
        message: 'Bonjour, ceci est un message suffisamment long.',
      },
    });

    const { POST } = await import('@/app/api/v1/contact/route');
    const response = await POST(new Request('http://localhost/api/v1/contact', { method: 'POST' }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.emailSent).toBe(true);
    expect(sendTransactionalEmail).toHaveBeenCalledTimes(1);
  });
});
