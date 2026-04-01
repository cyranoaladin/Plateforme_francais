'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { MAX_COPIE_UPLOAD_BYTES, validateCopieUploadFile } from '@/lib/atelier-ecrit/upload-validation';
import { type CopieCreatePayload } from '../types';

export function normaliseUploadFailure(error: unknown): { message: string; upgradeUrl: string | null } {
  if (error instanceof Error) {
    return {
      message: error.message,
      upgradeUrl: typeof (error as Error & { upgradeUrl?: string }).upgradeUrl === 'string'
        ? (error as Error & { upgradeUrl?: string }).upgradeUrl ?? null
        : null,
    };
  }

  return {
    message: 'Le dépôt de la copie a rencontré un problème. Vérifie ta connexion et réessaie.',
    upgradeUrl: null,
  };
}

export function uploadCopieWithProgress(input: {
  epreuveId: string;
  file: File;
  csrf: string;
  onProgress: (value: number) => void;
}): Promise<CopieCreatePayload> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', input.file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/v1/epreuves/${input.epreuveId}/copie`);
    xhr.setRequestHeader('X-CSRF-Token', input.csrf);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        input.onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        try {
          const body = JSON.parse(xhr.responseText);
          if (xhr.status === 402 && body.error) {
            const err = new Error(body.error);
            (err as Error & { upgradeUrl?: string; code?: string }).upgradeUrl = body.upgradeUrl;
            (err as Error & { code?: string }).code = body.code;
            reject(err);
            return;
          }
          reject(new Error(body.error || "Le dépôt de la copie n'a pas abouti."));
        } catch {
          reject(new Error("Le dépôt de la copie n'a pas abouti. Vérifie le format du fichier et réessaie."));
        }
        return;
      }

      try {
        resolve(JSON.parse(xhr.responseText) as CopieCreatePayload);
      } catch {
        reject(new Error("La réponse du serveur n'a pas pu être lue. Réessaie dans un instant."));
      }
    };

    xhr.onerror = () => reject(new Error('La connexion a été interrompue pendant le dépôt. Vérifie ta connexion et réessaie.'));
    xhr.send(formData);
  });
}

export function useEcritUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mobileInputRef = useRef<HTMLInputElement | null>(null);

  const previewUrl = useMemo(() => {
    if (!selectedFile) return null;
    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  const resetUploadState = useCallback(() => {
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
  }, []);

  const validateSelectedFile = useCallback(() => {
    if (!selectedFile) return 'Sélectionne une copie avant de lancer la correction.';
    return validateCopieUploadFile(selectedFile);
  }, [selectedFile]);

  return {
    selectedFile,
    setSelectedFile,
    uploadProgress,
    setUploadProgress,
    isUploading,
    setIsUploading,
    fileInputRef,
    mobileInputRef,
    previewUrl,
    resetUploadState,
    validateSelectedFile,
    maxUploadBytes: MAX_COPIE_UPLOAD_BYTES,
  };
}
