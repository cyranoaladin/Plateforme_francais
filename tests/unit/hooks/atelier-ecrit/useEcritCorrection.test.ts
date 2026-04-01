import { describe, expect, it } from 'vitest';
import { shouldUseEventSource } from '@/app/atelier-ecrit/hooks/useEcritCorrection';

describe('useEcritCorrection helpers', () => {
  it('utilise EventSource seulement quand le navigateur le supporte', () => {
    expect(shouldUseEventSource(undefined)).toBe(false);
    expect(shouldUseEventSource({ EventSource: undefined })).toBe(false);
    expect(
      shouldUseEventSource({
        EventSource: class FakeEventSource {},
      }),
    ).toBe(true);
  });
});
