import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/v1/health/route';
import { prisma } from '@/lib/db/client';
import { getRedisClient } from '@/lib/queue/correction-queue';

vi.mock('@/lib/db/client', () => ({
  prisma: {
    $queryRawUnsafe: vi.fn(),
  },
}));

vi.mock('@/lib/queue/correction-queue', () => ({
  getRedisClient: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    warn: vi.fn(),
  },
}));

vi.mock('@/lib/stt/transcriber', () => ({
  getSttCapability: vi.fn(() => ({ available: true })),
}));

vi.mock('@/lib/tts/generator', () => ({
  getTtsCapability: vi.fn(() => ({ available: true })),
}));

vi.mock('@/lib/config/validate-env', () => ({
  validateEnv: vi.fn(() => ({ required: 'ok', llm: 'ok', recommended: { missing: [] } })),
}));

describe('GET /api/v1/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock global fetch for RAG
    global.fetch = vi.fn();
  });

  it('retourne 200 quand DB et Redis sont ok, même si RAG est down', async () => {
    // DB ok
    (prisma.$queryRawUnsafe as any).mockResolvedValue([{ 1: 1 }]);
    
    // Redis ok
    (getRedisClient as any).mockReturnValue({
      ping: vi.fn().mockResolvedValue('PONG'),
    });

    // RAG down (fetch fails or returns !ok)
    (global.fetch as any).mockRejectedValue(new Error('Fetch failed'));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('degraded');
    expect(body.checks.db).toBe('ok');
    expect(body.checks.redis).toBe('ok');
    expect(body.checks.rag).toBe('down');
  });

  it('retourne 503 quand la DB est down', async () => {
    // DB down
    (prisma.$queryRawUnsafe as any).mockRejectedValue(new Error('DB connection failed'));
    
    // Redis ok
    (getRedisClient as any).mockReturnValue({
      ping: vi.fn().mockResolvedValue('PONG'),
    });

    // RAG ok
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'ok' }),
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.status).toBe('critical');
    expect(body.checks.db).toBe('down');
  });

  it('retourne 200 quand tout est ok', async () => {
    (prisma.$queryRawUnsafe as any).mockResolvedValue([{ 1: 1 }]);
    (getRedisClient as any).mockReturnValue({
      ping: vi.fn().mockResolvedValue('PONG'),
    });
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'ok' }),
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.checks.db).toBe('ok');
    expect(body.checks.redis).toBe('ok');
    expect(body.checks.rag).toBe('ok');
  });
});
