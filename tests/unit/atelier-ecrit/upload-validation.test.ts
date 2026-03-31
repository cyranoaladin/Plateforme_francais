import { describe, expect, it } from 'vitest';
import {
  ALLOWED_COPIE_MIME_TYPES,
  MAX_COPIE_UPLOAD_BYTES,
  validateCopieUploadFile,
} from '@/lib/atelier-ecrit/upload-validation';

describe('validateCopieUploadFile', () => {
  it('accepts supported MIME types under the size limit', () => {
    for (const type of ALLOWED_COPIE_MIME_TYPES) {
      expect(validateCopieUploadFile({ type, size: 1024 })).toBeNull();
    }
  });

  it('rejects unsupported MIME types', () => {
    expect(validateCopieUploadFile({ type: 'text/plain', size: 1024 }))
      .toBe('Format non supporté. Utilise un PDF ou une image (JPEG, PNG, WebP).');
  });

  it('rejects files above the maximum size', () => {
    expect(validateCopieUploadFile({ type: 'application/pdf', size: MAX_COPIE_UPLOAD_BYTES + 1 }))
      .toBe('Fichier trop volumineux (max 10 Mo).');
  });
});
