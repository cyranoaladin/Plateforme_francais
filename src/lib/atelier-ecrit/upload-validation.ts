export const ALLOWED_COPIE_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const MAX_COPIE_UPLOAD_BYTES = 10 * 1024 * 1024;

export function validateCopieUploadFile(file: Pick<File, 'type' | 'size'>): string | null {
  if (!ALLOWED_COPIE_MIME_TYPES.includes(file.type as (typeof ALLOWED_COPIE_MIME_TYPES)[number])) {
    return 'Format non supporté. Utilise un PDF ou une image (JPEG, PNG, WebP).';
  }

  if (file.size > MAX_COPIE_UPLOAD_BYTES) {
    return 'Fichier trop volumineux (max 10 Mo).';
  }

  return null;
}
