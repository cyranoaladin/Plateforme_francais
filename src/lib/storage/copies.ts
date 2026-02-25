import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

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

export async function saveCopieFile(input: {
  userId: string;
  fileType: string;
  bytes: Uint8Array;
}): Promise<SavedFile> {
  if ((process.env.STORAGE_PROVIDER ?? 'local') === 's3') {
    throw new Error('STORAGE_PROVIDER=s3 non implémenté dans cette version.');
  }

  const ext = resolveExtension(input.fileType);
  const relativePath = path.join('uploads', 'copies', input.userId, `${randomUUID()}.${ext}`);
  const absolutePath = path.join(process.cwd(), '.data', relativePath);

  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, input.bytes);

  return {
    filePath: relativePath,
    absolutePath,
    fileType: input.fileType,
  };
}

export function resolveCopieAbsolutePath(filePath: string): string {
  return path.join(process.cwd(), '.data', filePath);
}
