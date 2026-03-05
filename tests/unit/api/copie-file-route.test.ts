import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
  },
}));
vi.mock('@/lib/auth/guard', () => ({
  requireAuthenticatedUser: vi.fn(),
}));
vi.mock('@/lib/epreuves/repository', () => ({
  findCopieById: vi.fn(),
}));
vi.mock('@/lib/storage/copies', () => ({
  resolveCopieAbsolutePath: vi.fn().mockReturnValue('/tmp/test.jpg'),
}));

import { promises as fsPromises } from 'fs';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { findCopieById } from '@/lib/epreuves/repository';

describe('GET /api/v1/epreuves/copies/[copieId]/file', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: { user: { id: 'u1', profile: {} } },
      errorResponse: null,
    } as never);
  });

  it('retourne 404 si copie absente', async () => {
    vi.mocked(findCopieById).mockResolvedValue(null);
    const { GET } = await import('@/app/api/v1/epreuves/copies/[copieId]/file/route');
    const res = await GET(new Request('http://localhost'), { params: Promise.resolve({ copieId: 'x' }) });
    expect(res.status).toBe(404);
  });

  it('stream le fichier si propriété valide', async () => {
    vi.mocked(findCopieById).mockResolvedValue({
      id: 'c1',
      userId: 'u1',
      epreuveId: 'e1',
      filePath: 'uploads/copies/u1/x.jpg',
      fileType: 'image/jpeg',
      status: 'done',
      ocrText: null,
      correction: null,
      createdAt: '',
      correctedAt: null,
    });
    vi.mocked(fsPromises.readFile as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(Buffer.from('img'));

    const { GET } = await import('@/app/api/v1/epreuves/copies/[copieId]/file/route');
    const res = await GET(new Request('http://localhost'), { params: Promise.resolve({ copieId: 'c1' }) });
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/jpeg');
  });
});
