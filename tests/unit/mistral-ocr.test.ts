import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { extractTextFromCopie } from '@/lib/correction/ocr';

describe('extractTextFromCopie — Mistral OCR', () => {
  const originalEnv = { ...process.env };
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('utilise Mistral OCR si MISTRAL_API_KEY présente', async () => {
    process.env.MISTRAL_API_KEY = 'test-key';
    process.env.MISTRAL_BASE_URL = 'https://api.mistral.ai/v1';

    global.fetch = (vi.fn(async () => ({
      ok: true,
      json: async () => ({
        pages: [{ markdown: 'Introduction : La problématique...' }],
      }),
    })) as unknown) as typeof fetch;

    const result = await extractTextFromCopie({
      bytes: new TextEncoder().encode('fake-image'),
      mimeType: 'image/jpeg',
    });

    expect(result).toContain('Introduction');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/ocr'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('fallback Gemini si MISTRAL_API_KEY absente', async () => {
    delete process.env.MISTRAL_API_KEY;
    delete process.env.GEMINI_API_KEY;
    const result = await extractTextFromCopie({
      bytes: new TextEncoder().encode('fake-image'),
      mimeType: 'image/jpeg',
    });
    expect(result).toContain('[ocr indisponible');
  });

  it('fallback Pixtral si MIME non supporté par Mistral OCR', async () => {
    process.env.MISTRAL_API_KEY = 'test-key';

    const result = await extractTextFromCopie({
      bytes: new TextEncoder().encode('fake-image'),
      mimeType: 'image/tiff',
    });

    // image/tiff → Pixtral fallback → réseau absent → erreur serveur ou indisponible
    expect(result).toMatch(/\[ocr pixtral:|ocr indisponible/);
  });
});
