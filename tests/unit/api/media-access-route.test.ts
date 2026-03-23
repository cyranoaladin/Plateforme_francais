import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { FREE_LIBRARY_LIMITS } from '@/lib/billing/library-gating';
import { MEDIA_CATALOG } from '@/data/media-catalog';
import { RESSOURCES } from '@/data/ressources';

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    promises: {
      ...actual.promises,
      lstat: vi.fn(),
      readFile: vi.fn(),
    },
    existsSync: vi.fn().mockReturnValue(true),
  };
});

vi.mock('@/lib/auth/guard', () => ({
  requireAuthenticatedUser: vi.fn(),
}));

vi.mock('@/lib/billing/context', () => ({
  getBillingContext: vi.fn(),
}));

import { promises as fsPromises } from 'fs';
import { requireAuthenticatedUser } from '@/lib/auth/guard';
import { getBillingContext } from '@/lib/billing/context';

function findFreemiumBlockedMediaId(): string {
  for (const entry of MEDIA_CATALOG) {
    const normalizedPath = entry.filePath.replace(/^ressources\//, '');
    const matchedResource = RESSOURCES.find(
      (resource) => resource.url.replace(/^\/ressources\//, '') === normalizedPath,
    );

    if (!matchedResource) {
      continue;
    }

    const categoryResources = RESSOURCES.filter((resource) => resource.category === matchedResource.category);
    const indexInCategory = categoryResources.findIndex((resource) => resource.id === matchedResource.id);
    const limit = FREE_LIBRARY_LIMITS[matchedResource.category] ?? 2;

    if (indexInCategory >= limit) {
      return entry.id;
    }
  }

  throw new Error('No media entry outside freemium sample found in catalog.');
}

function findFreemiumAllowedMediaId(): string {
  for (const entry of MEDIA_CATALOG) {
    const normalizedPath = entry.filePath.replace(/^ressources\//, '');
    const matchedResource = RESSOURCES.find(
      (resource) => resource.url.replace(/^\/ressources\//, '') === normalizedPath,
    );

    if (!matchedResource) {
      continue;
    }

    const categoryResources = RESSOURCES.filter((resource) => resource.category === matchedResource.category);
    const indexInCategory = categoryResources.findIndex((resource) => resource.id === matchedResource.id);
    const limit = FREE_LIBRARY_LIMITS[matchedResource.category] ?? 2;

    if (indexInCategory >= 0 && indexInCategory < limit) {
      return entry.id;
    }
  }

  throw new Error('No media entry inside freemium sample found in catalog.');
}

describe('GET /api/v1/media/[id] access control', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuthenticatedUser).mockResolvedValue({
      auth: { user: { id: 'u-free', profile: {} } },
      errorResponse: null,
    } as never);
    vi.mocked(getBillingContext).mockResolvedValue({
      planId: 'FREE',
      config: { quotas: {} },
      endsAt: null,
      isActive: true,
    } as never);
    vi.mocked(fsPromises.lstat as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      isSymbolicLink: () => false,
      isFile: () => true,
      size: 3,
    });
    vi.mocked(fsPromises.readFile as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(Buffer.from('vid'));
  });

  it('refuse a freemium user when the media is outside the free library sample', async () => {
    const mediaId = findFreemiumBlockedMediaId();
    const { GET } = await import('@/app/api/v1/media/[id]/route');

    const response = await GET(
      new NextRequest(`http://localhost/api/v1/media/${mediaId}`),
      { params: Promise.resolve({ id: mediaId }) },
    );

    expect(response.status).toBe(403);
  });

  it('serves a media that belongs to the freemium sample', async () => {
    const mediaId = findFreemiumAllowedMediaId();
    const { GET } = await import('@/app/api/v1/media/[id]/route');

    const response = await GET(
      new NextRequest(`http://localhost/api/v1/media/${mediaId}`),
      { params: Promise.resolve({ id: mediaId }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Length')).toBe('3');
  });

  it('serves the same blocked media to a premium user', async () => {
    const mediaId = findFreemiumBlockedMediaId();
    vi.mocked(getBillingContext).mockResolvedValue({
      planId: 'PREMIUM',
      config: { quotas: {} },
      endsAt: null,
      isActive: true,
    } as never);
    const { GET } = await import('@/app/api/v1/media/[id]/route');

    const response = await GET(
      new NextRequest(`http://localhost/api/v1/media/${mediaId}`),
      { params: Promise.resolve({ id: mediaId }) },
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Length')).toBe('3');
  });

  it('supports byte range requests for an authorized premium user', async () => {
    const mediaId = findFreemiumBlockedMediaId();
    vi.mocked(getBillingContext).mockResolvedValue({
      planId: 'PREMIUM',
      config: { quotas: {} },
      endsAt: null,
      isActive: true,
    } as never);
    vi.mocked(fsPromises.lstat as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      isSymbolicLink: () => false,
      isFile: () => true,
      size: 10,
    });
    vi.mocked(fsPromises.readFile as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(Buffer.from('0123456789'));
    const { GET } = await import('@/app/api/v1/media/[id]/route');

    const response = await GET(
      new NextRequest(`http://localhost/api/v1/media/${mediaId}`, {
        headers: { Range: 'bytes=2-4' },
      }),
      { params: Promise.resolve({ id: mediaId }) },
    );

    expect(response.status).toBe(206);
    expect(response.headers.get('Accept-Ranges')).toBe('bytes');
    expect(response.headers.get('Content-Range')).toBe('bytes 2-4/10');
    expect(response.headers.get('Content-Length')).toBe('3');
    expect(Buffer.from(await response.arrayBuffer()).toString()).toBe('234');
  });
});
