'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildTuteurHref } from '@/lib/navigation/tuteur-link';
import { getCsrfToken } from '@/lib/security/csrf-client';
import { useEcritCorrection } from './useEcritCorrection';
import { normaliseUploadFailure, uploadCopieWithProgress, useEcritUpload } from './useEcritUpload';
import { type EpreuvePayload, type EpreuveType } from '../types';

export function useEcritSession() {
  const [type, setType] = useState<EpreuveType>('commentaire');
  const [oeuvre, setOeuvre] = useState('');
  const [theme, setTheme] = useState('');
  const [epreuve, setEpreuve] = useState<EpreuvePayload | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgradeUrl, setUpgradeUrl] = useState<string | null>(null);
  const [badgeToasts, setBadgeToasts] = useState<string[]>([]);

  const upload = useEcritUpload();
  const correction = useEcritCorrection({
    onError: setError,
  });

  const tutorHref = useMemo(
    () =>
      buildTuteurHref({
        workId: oeuvre || null,
        parcours: theme || null,
      }),
    [oeuvre, theme],
  );

  useEffect(() => {
    return () => {
      if (upload.previewUrl) {
        URL.revokeObjectURL(upload.previewUrl);
      }
    };
  }, [upload.previewUrl]);

  const handleGenerate = useCallback(async () => {
    setError(null);
    setUpgradeUrl(null);
    setIsGenerating(true);

    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch('/api/v1/epreuves/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ type, oeuvre: oeuvre || undefined, theme: theme || undefined }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        if (response.status === 402 && errBody.error) {
          const err = new Error(errBody.error);
          (err as Error & { upgradeUrl?: string }).upgradeUrl = errBody.upgradeUrl;
          throw err;
        }
        throw new Error(errBody.error || "La génération du sujet n'a pas abouti. Réessaie dans quelques instants.");
      }

      const payload = (await response.json()) as EpreuvePayload;
      correction.stopCorrectionWatch();
      correction.setCopieLink(null);
      upload.resetUploadState();
      setEpreuve(payload);
    } catch (cause) {
      const err = normaliseUploadFailure(cause);
      setError(err.message);
      setUpgradeUrl(err.upgradeUrl);
    } finally {
      setIsGenerating(false);
    }
  }, [correction, oeuvre, theme, type, upload]);

  const handleUpload = useCallback(async () => {
    if (!epreuve || !upload.selectedFile) {
      return;
    }

    const fileError = upload.validateSelectedFile();
    if (fileError) {
      setError(fileError);
      return;
    }

    setError(null);
    setUpgradeUrl(null);
    upload.setIsUploading(true);

    try {
      const csrfToken = await getCsrfToken();
      const created = await uploadCopieWithProgress({
        epreuveId: epreuve.epreuveId,
        file: upload.selectedFile,
        csrf: csrfToken,
        onProgress: upload.setUploadProgress,
      });

      if (created.newBadges && created.newBadges.length > 0) {
        setBadgeToasts(created.newBadges);
        window.setTimeout(() => setBadgeToasts([]), 4500);
      }

      correction.watchCorrectionProgress({
        epreuveId: epreuve.epreuveId,
        copieId: created.copieId,
      });
    } catch (cause) {
      const err = normaliseUploadFailure(cause);
      setError(err.message);
      setUpgradeUrl(err.upgradeUrl);
    } finally {
      upload.setIsUploading(false);
    }
  }, [correction, epreuve, upload]);

  return {
    type,
    setType,
    oeuvre,
    setOeuvre,
    theme,
    setTheme,
    epreuve,
    setEpreuve,
    isGenerating,
    error,
    upgradeUrl,
    badgeToasts,
    tutorHref,
    baremeEntries: epreuve ? Object.entries(epreuve.bareme) : [],
    upload,
    correction,
    handleGenerate,
    handleUpload,
  };
}
