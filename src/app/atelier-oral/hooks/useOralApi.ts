'use client';

import { useCallback } from 'react';
import { getCsrfToken } from '@/lib/security/csrf-client';
import { type VoiceMode } from './useVoiceMode';
import { type BilanResult, type ExaminerProfile, type OralMode, type OralStep, type SessionPayload, type StepFeedback } from '../types';
import { type OralQuotaError } from './useOralQuota';

const MAX_RETRY_ATTEMPTS = 2;

type ResolveError = (payload: unknown, fallbackMessage: string) => OralQuotaError;

type RequestOptions = {
  path: string;
  method?: 'GET' | 'POST';
  body?: BodyInit | null;
  headers?: HeadersInit;
  fallbackMessage: string;
  resolveError: ResolveError;
  onUpgradeUrl?: (url: string | null) => void;
  maxAttempts?: number;
  fetchImpl?: typeof fetch;
};

type AudioTurnResult = {
  evaluation: StepFeedback;
  transcript?: string;
  fallbackToWebSpeech?: boolean;
  juryAudioBase64?: string;
  juryAudioMimeType?: string;
};

export function shouldRetryOralRequest(
  status: number,
  attempt: number,
  maxAttempts: number,
): boolean {
  return status === 503 && attempt + 1 < maxAttempts;
}

async function readJson(response: Response) {
  return response.json().catch(() => null);
}

async function delay(ms: number) {
  await new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function requestOralJson<T>({
  path,
  method = 'POST',
  body = null,
  headers,
  fallbackMessage,
  resolveError,
  onUpgradeUrl,
  maxAttempts = MAX_RETRY_ATTEMPTS,
  fetchImpl = fetch,
}: RequestOptions): Promise<T> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const response = await fetchImpl(path, {
      method,
      headers,
      body,
    });

    if (response.ok) {
      return (await readJson(response)) as T;
    }

    if (shouldRetryOralRequest(response.status, attempt, maxAttempts)) {
      await delay(250);
      continue;
    }

    const payload = await readJson(response);
    const error = resolveError(payload, fallbackMessage);
    onUpgradeUrl?.(error.upgradeUrl);
    throw new Error(error.message);
  }

  throw new Error(fallbackMessage);
}

export function useOralApi(input: {
  resolveError: ResolveError;
  onUpgradeUrl: (url: string | null) => void;
  onVoiceModeDetected: (mode: VoiceMode) => void;
}) {
  const syncCapabilities = useCallback(async () => {
    const response = await fetch('/api/v1/oral/capabilities').catch(() => null);
    if (!response?.ok) return null;
    const data = (await response.json().catch(() => null)) as
      | { effectiveVoiceMode?: VoiceMode; voiceMode?: VoiceMode }
      | null;
    if (data?.effectiveVoiceMode) {
      input.onVoiceModeDetected(data.effectiveVoiceMode);
    } else if (data?.voiceMode) {
      input.onVoiceModeDetected(data.voiceMode);
    }
    return data;
  }, [input]);

  const startSession = useCallback(
    async (payload: { oeuvre: string; mode: OralMode }) => {
      const csrfToken = await getCsrfToken();
      const sessionPayload = await requestOralJson<SessionPayload>({
        path: '/api/v1/oral/session/start',
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        fallbackMessage: 'Impossible de démarrer la session orale.',
        resolveError: input.resolveError,
        onUpgradeUrl: input.onUpgradeUrl,
      });

      await fetch(`/api/v1/oral/session/${sessionPayload.sessionId}/start-prep`, {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrfToken },
      }).catch((syncError) => {
        console.warn('[oral] sync non-bloquant échoué:', syncError);
      });

      return sessionPayload;
    },
    [input],
  );

  const startPassage = useCallback(async (sessionId: string) => {
    const csrfToken = await getCsrfToken();
    await fetch(`/api/v1/oral/session/${sessionId}/start-passage`, {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken },
    }).catch((syncError) => {
      console.warn('[oral] sync non-bloquant échoué:', syncError);
    });
  }, []);

  const submitAudioTurn = useCallback(
    async (payload: {
      sessionId: string;
      step: OralStep;
      duration: number;
      examinerProfile: ExaminerProfile;
      audio: { blob: Blob; mimeType: string };
    }) => {
      const csrfToken = await getCsrfToken();
      const formData = new FormData();
      formData.append('audio', payload.audio.blob, 'recording.webm');
      formData.append('step', payload.step);
      formData.append('duration', String(payload.duration));
      if (payload.step === 'ENTRETIEN') {
        formData.append('examinerProfile', payload.examinerProfile);
      }

      return requestOralJson<AudioTurnResult>({
        path: `/api/v1/oral/session/${payload.sessionId}/audio-turn`,
        body: formData,
        headers: { 'X-CSRF-Token': csrfToken },
        fallbackMessage: "Échec de l’analyse de la prestation.",
        resolveError: input.resolveError,
        onUpgradeUrl: input.onUpgradeUrl,
      });
    },
    [input],
  );

  const submitTextTurn = useCallback(
    async (payload: {
      sessionId: string;
      step: OralStep;
      transcript: string;
      duration: number;
      examinerProfile: ExaminerProfile;
    }) => {
      return requestOralJson<StepFeedback>({
        path: `/api/v1/oral/session/${payload.sessionId}/interact`,
        body: JSON.stringify({
          step: payload.step,
          transcript: payload.transcript,
          duration: payload.duration,
          ...(payload.step === 'ENTRETIEN' ? { examinerProfile: payload.examinerProfile } : {}),
        }),
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': await getCsrfToken(),
        },
        fallbackMessage: "Échec de l’analyse de la prestation.",
        resolveError: input.resolveError,
        onUpgradeUrl: input.onUpgradeUrl,
      });
    },
    [input],
  );

  const endSession = useCallback(
    async (payload: {
      sessionId: string;
      notes: string;
      examinerProfile: ExaminerProfile;
    }) => {
      return requestOralJson<BilanResult>({
        path: `/api/v1/oral/session/${payload.sessionId}/end`,
        body: JSON.stringify({
          notes: payload.notes,
          examinerProfile: payload.examinerProfile,
        }),
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': await getCsrfToken(),
        },
        fallbackMessage: 'Échec de finalisation de la session.',
        resolveError: input.resolveError,
        onUpgradeUrl: input.onUpgradeUrl,
      });
    },
    [input],
  );

  return {
    syncCapabilities,
    startSession,
    startPassage,
    submitAudioTurn,
    submitTextTurn,
    endSession,
  };
}
