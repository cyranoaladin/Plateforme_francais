import { randomUUID } from 'crypto';
import path from 'path';
import { resolveUploadsPath } from './paths';

type SavedFile = {
  filePath: string;
  absolutePath: string;
  fileType: string;
};

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
]);

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

export function validateCopieFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { valid: false, error: `Type de fichier non supporté : ${file.type}` };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { valid: false, error: `Fichier trop volumineux (max 20 Mo)` };
  }
  return { valid: true };
}

function resolveExtension(contentType: string): string {
  switch (contentType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'application/pdf':
      return 'pdf';
    default:
      return 'bin';
  }
}

import { getStorageProvider } from './provider';

export async function saveCopieFile(input: {
  userId: string;
  fileType: string;
  bytes: Uint8Array;
}): Promise<SavedFile> {
  const provider = getStorageProvider();
  const ext = resolveExtension(input.fileType);
  const relativePath = path.join('copies', input.userId, `${randomUUID()}.${ext}`);

  const key = await provider.uploadFile(relativePath, input.bytes, input.fileType);

  return {
    filePath: key,
    absolutePath: resolveUploadsPath(key),
    fileType: input.fileType,
  };
}

export function resolveCopieAbsolutePath(filePath: string): string {
  // If local, it's relative to .data/uploads
  if (!filePath.startsWith('http')) {
    return resolveUploadsPath(filePath);
  }
  return filePath;
}
