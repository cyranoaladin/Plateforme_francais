import { describe, it, expect } from 'vitest';
import {
  detectMimeFromMagicBytes,
  InvalidFileTypeError,
  sanitizeUploadFileName,
  validateUpload,
} from '@/lib/security/file-validator';

describe('file-validator', () => {
  it('detecte jpeg via magic bytes', () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0x00, 0x01]);
    expect(detectMimeFromMagicBytes(bytes)).toBe('image/jpeg');
  });

  it('detecte png via magic bytes', () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    expect(detectMimeFromMagicBytes(bytes)).toBe('image/png');
  });

  it('detecte pdf via magic bytes', () => {
    const bytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);
    expect(detectMimeFromMagicBytes(bytes)).toBe('application/pdf');
  });

  it('sanitise les noms de fichiers (path traversal)', () => {
    const safe = sanitizeUploadFileName('../../etc/passwd;rm -rf');
    expect(safe).toBe('passwd_rm_-rf');
  });

  it('rejette un type invalide', () => {
    const bytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00]); // MZ / exécutable
    expect(() => validateUpload(bytes, 'fake.exe.jpg')).toThrow(InvalidFileTypeError);
  });
});

