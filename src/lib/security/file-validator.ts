import path from 'path';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

export class InvalidFileTypeError extends Error {
  constructor(public readonly detectedMime: string) {
    super(`Type de fichier non supporte: ${detectedMime}`);
    this.name = 'InvalidFileTypeError';
  }
}

function isJpeg(buffer: Uint8Array): boolean {
  return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}

function isPng(buffer: Uint8Array): boolean {
  return (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  );
}

function isPdf(buffer: Uint8Array): boolean {
  return (
    buffer.length >= 5 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46 &&
    buffer[4] === 0x2d
  );
}

function isWebp(buffer: Uint8Array): boolean {
  if (buffer.length < 12) {
    return false;
  }
  const riff = String.fromCharCode(buffer[0], buffer[1], buffer[2], buffer[3]);
  const webp = String.fromCharCode(buffer[8], buffer[9], buffer[10], buffer[11]);
  return riff === 'RIFF' && webp === 'WEBP';
}

export function detectMimeFromMagicBytes(buffer: Uint8Array): string | null {
  if (isJpeg(buffer)) return 'image/jpeg';
  if (isPng(buffer)) return 'image/png';
  if (isWebp(buffer)) return 'image/webp';
  if (isPdf(buffer)) return 'application/pdf';
  return null;
}

export function sanitizeUploadFileName(declaredName: string): string {
  const base = path.basename(declaredName);
  return base.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export function validateUpload(buffer: Uint8Array, declaredName: string): {
  mime: string;
  safeName: string;
} {
  const mime = detectMimeFromMagicBytes(buffer) ?? 'unknown';
  if (!ALLOWED_MIME.has(mime)) {
    throw new InvalidFileTypeError(mime);
  }
  return {
    mime,
    safeName: sanitizeUploadFileName(declaredName),
  };
}

