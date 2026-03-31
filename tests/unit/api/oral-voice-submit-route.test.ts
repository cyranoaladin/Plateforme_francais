import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/security/csrf', () => ({
  validateCsrf: vi.fn(async () => null),
}));

import { POST } from '@/app/api/v1/oral/voice-submit/route';

describe('POST /api/v1/oral/voice-submit', () => {
  it('retourne 410 pour signaler la dépréciation de la route legacy', async () => {
    const response = await POST(new Request('http://localhost/api/v1/oral/voice-submit', { method: 'POST' }));

    expect(response.status).toBe(410);
    const body = await response.json();
    expect(body.error).toContain('/audio-turn');
  });
});
