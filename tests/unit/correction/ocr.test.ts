import { describe, expect, it, vi } from 'vitest';
import { extractTextFromCopie, getUserSafeOcrText, isOcrFailureText } from '@/lib/correction/ocr';

describe('OCR correction', () => {
  it('retourne un message explicite sans clé Mistral', async () => {
    const old = process.env.MISTRAL_API_KEY;
    delete process.env.MISTRAL_API_KEY;
    const text = await extractTextFromCopie({ bytes: new TextEncoder().encode('img'), mimeType: 'image/jpeg' });
    expect(text).toContain('[ocr indisponible');
    process.env.MISTRAL_API_KEY = old;
  });

  it('utilise OCR mistral si clé présente', async () => {
    const old = process.env.MISTRAL_API_KEY;
    process.env.MISTRAL_API_KEY = 'test';
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ pages: [{ markdown: 'Texte OCR' }] }),
    } as never);

    const text = await extractTextFromCopie({ bytes: new TextEncoder().encode('img'), mimeType: 'image/jpeg' });
    expect(text).toContain('Texte OCR');
    fetchSpy.mockRestore();
    process.env.MISTRAL_API_KEY = old;
  });

  it('détecte et neutralise les messages OCR techniques', () => {
    const raw = '[ocr pixtral: erreur serveur 500]';
    expect(isOcrFailureText(raw)).toBe(true);
    expect(getUserSafeOcrText(raw)).toBeNull();
  });
});
