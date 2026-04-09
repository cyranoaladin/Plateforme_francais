/**
 * Tests unitaires pour le cron session-cleanup.
 * Vérifie la validation du CRON_SECRET (timing-safe) et les réponses HTTP.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock prisma
vi.mock('@/lib/db/client', () => ({
  prisma: {
    session: {
      deleteMany: vi.fn().mockResolvedValue({ count: 3 }),
    },
  },
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

const CRON_SECRET = 'test-secret-32chars-padding12345';

describe('cron/session-cleanup — authentification CRON_SECRET', () => {
  beforeEach(() => {
    process.env.CRON_SECRET = CRON_SECRET;
  });

  afterEach(() => {
    delete process.env.CRON_SECRET;
    vi.clearAllMocks();
  });

  it('retourne 500 si CRON_SECRET non configuré', async () => {
    delete process.env.CRON_SECRET;
    vi.resetModules();
    const { GET } = await import('@/app/api/v1/cron/session-cleanup/route');
    const req = new NextRequest('http://localhost/api/v1/cron/session-cleanup');
    const res = await GET(req);
    expect(res.status).toBe(500);
  });

  it('retourne 401 si x-cron-secret absent', async () => {
    vi.resetModules();
    process.env.CRON_SECRET = CRON_SECRET;
    const { GET } = await import('@/app/api/v1/cron/session-cleanup/route');
    const req = new NextRequest('http://localhost/api/v1/cron/session-cleanup');
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('retourne 401 si secret invalide', async () => {
    vi.resetModules();
    process.env.CRON_SECRET = CRON_SECRET;
    const { GET } = await import('@/app/api/v1/cron/session-cleanup/route');
    const req = new NextRequest('http://localhost/api/v1/cron/session-cleanup', {
      headers: { 'x-cron-secret': 'wrong-secret-32chars-padding1234' },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('retourne 200 avec le bon secret dans x-cron-secret', async () => {
    vi.resetModules();
    process.env.CRON_SECRET = CRON_SECRET;
    const { GET } = await import('@/app/api/v1/cron/session-cleanup/route');
    const req = new NextRequest('http://localhost/api/v1/cron/session-cleanup', {
      headers: { 'x-cron-secret': CRON_SECRET },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(typeof body.deletedSessions).toBe('number');
  });

  it('accepte le secret via Authorization Bearer', async () => {
    vi.resetModules();
    process.env.CRON_SECRET = CRON_SECRET;
    const { GET } = await import('@/app/api/v1/cron/session-cleanup/route');
    const req = new NextRequest('http://localhost/api/v1/cron/session-cleanup', {
      headers: { authorization: `Bearer ${CRON_SECRET}` },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});
