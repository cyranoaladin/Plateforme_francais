import { describe, it, expect, vi, beforeEach } from 'vitest';

const createWebVital = vi.fn();
const checkRateLimit = vi.fn();

vi.mock('@/lib/db/client', () => ({
  prisma: {
    webVital: {
      create: (...args: unknown[]) => createWebVital(...args),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/security/rate-limit', () => ({
  checkRateLimit: (...args: unknown[]) => checkRateLimit(...args),
}));

describe('POST /api/v1/metrics/vitals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    createWebVital.mockResolvedValue({ id: 'wv_1' });
    checkRateLimit.mockResolvedValue({ allowed: true, retryAfter: 0 });
  });

  it('accepte une métrique LCP valide', async () => {
    const { POST } = await import('@/app/api/v1/metrics/vitals/route');
    const req = new Request('http://localhost/api/v1/metrics/vitals', {
      method: 'POST',
      body: JSON.stringify({ name: 'LCP', value: 1200 }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.ok).toBe(true);
  });

  it.each(['LCP', 'FID', 'CLS', 'TTFB', 'INP'])('accepte la métrique %s', async (name: string) => {
    const { POST } = await import('@/app/api/v1/metrics/vitals/route');
    const req = new Request('http://localhost/', {
      method: 'POST',
      body: JSON.stringify({ name, value: 500 }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    expect(response.status).toBe(200);
  });

  it('rejette une métrique inconnue', async () => {
    const { POST } = await import('@/app/api/v1/metrics/vitals/route');
    const req = new Request('http://localhost/', {
      method: 'POST',
      body: JSON.stringify({ name: 'UNKNOWN_METRIC', value: 100 }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('retourne 202 si la base est indisponible', async () => {
    createWebVital.mockRejectedValueOnce(new Error('db unavailable'));
    const { POST } = await import('@/app/api/v1/metrics/vitals/route');
    const req = new Request('http://localhost/', {
      method: 'POST',
      body: JSON.stringify({ name: 'LCP', value: 500 }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    expect(response.status).toBe(202);
    await expect(response.json()).resolves.toEqual({ ok: true, dropped: true });
  });

  it('rejette une valeur négative', async () => {
    const { POST } = await import('@/app/api/v1/metrics/vitals/route');
    const req = new Request('http://localhost/', {
      method: 'POST',
      body: JSON.stringify({ name: 'LCP', value: -100 }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('rejette un body JSON invalide', async () => {
    const { POST } = await import('@/app/api/v1/metrics/vitals/route');
    const req = new Request('http://localhost/', {
      method: 'POST',
      body: 'not-json',
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  it('rejette une valeur > 60000', async () => {
    const { POST } = await import('@/app/api/v1/metrics/vitals/route');
    const req = new Request('http://localhost/', {
      method: 'POST',
      body: JSON.stringify({ name: 'LCP', value: 70000 }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(req);
    expect(response.status).toBe(400);
  });
});
