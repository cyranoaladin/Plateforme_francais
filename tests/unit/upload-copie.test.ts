import { describe, it, expect } from 'vitest';
import { validateCopieFile } from '@/lib/storage/copies';

describe('validateCopieFile', () => {
  it('accepte image/jpeg', () => {
    const file = new File(['data'], 'test.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 1024 * 1024 });
    const result = validateCopieFile(file);
    expect(result.valid).toBe(true);
  });

  it('accepte image/png', () => {
    const file = new File(['data'], 'test.png', { type: 'image/png' });
    Object.defineProperty(file, 'size', { value: 2 * 1024 * 1024 });
    const result = validateCopieFile(file);
    expect(result.valid).toBe(true);
  });

  it('accepte application/pdf', () => {
    const file = new File(['data'], 'test.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 });
    const result = validateCopieFile(file);
    expect(result.valid).toBe(true);
  });

  it('rejette les types non autorisés', () => {
    const file = new File(['data'], 'test.exe', { type: 'application/octet-stream' });
    Object.defineProperty(file, 'size', { value: 1024 });
    const result = validateCopieFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('non supporté');
  });

  it('rejette les fichiers trop volumineux', () => {
    const file = new File(['data'], 'big.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 25 * 1024 * 1024 });
    const result = validateCopieFile(file);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('volumineux');
  });

  it('accepte un fichier de 20 Mo exactement', () => {
    const file = new File(['data'], 'exact.jpg', { type: 'image/jpeg' });
    Object.defineProperty(file, 'size', { value: 20 * 1024 * 1024 });
    const result = validateCopieFile(file);
    expect(result.valid).toBe(true);
  });
});
