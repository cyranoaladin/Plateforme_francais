import { describe, expect, it } from 'vitest';
import nextConfig from '../../../next.config';

describe('next.config', () => {
  it('keeps React strict mode enabled', () => {
    expect(nextConfig.reactStrictMode).toBe(true);
  });

  it('does not grant microphone access globally in static security headers', async () => {
    const headers = await nextConfig.headers?.();
    const rootHeaders = headers?.find((entry) => entry.source === '/(.*)')?.headers ?? [];
    const permissionsPolicy = rootHeaders.find((entry) => entry.key === 'Permissions-Policy')?.value;

    expect(permissionsPolicy).toContain('camera=()');
    expect(permissionsPolicy).toContain('geolocation=()');
    expect(permissionsPolicy).not.toContain('microphone=(self)');
  });
});
