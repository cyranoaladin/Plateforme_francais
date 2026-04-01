'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PROCESSING_STEPS, type CopieLink } from '../types';

export function shouldUseEventSource(
  target:
    | {
        EventSource?: typeof EventSource | undefined;
      }
    | undefined,
) {
  return Boolean(target?.EventSource);
}

export function useEcritCorrection(input: {
  onError: (message: string) => void;
}) {
  const [pollingStatus, setPollingStatus] = useState<string | null>(null);
  const [processingStepIndex, setProcessingStepIndex] = useState(0);
  const [copieLink, setCopieLink] = useState<CopieLink | null>(null);
  const correctionPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const processingStepTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const stopCorrectionWatch = useCallback(() => {
    if (correctionPollRef.current) {
      clearInterval(correctionPollRef.current);
      correctionPollRef.current = null;
    }
    if (processingStepTimerRef.current) {
      clearInterval(processingStepTimerRef.current);
      processingStepTimerRef.current = null;
    }
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
  }, []);

  const markDone = useCallback((inputLink: CopieLink) => {
    setPollingStatus('done');
    stopCorrectionWatch();
    setCopieLink(inputLink);
  }, [stopCorrectionWatch]);

  const markError = useCallback(() => {
    stopCorrectionWatch();
    setPollingStatus('error');
    input.onError("L'analyse de ta copie n'a pas pu aboutir cette fois. Tu peux déposer à nouveau ta copie ou en soumettre une autre.");
  }, [input, stopCorrectionWatch]);

  const pollCorrection = useCallback((inputLink: CopieLink) => {
    stopCorrectionWatch();
    setPollingStatus('pending');
    setCopieLink(null);

    processingStepTimerRef.current = setInterval(() => {
      setProcessingStepIndex((prev) => (prev + 1) % PROCESSING_STEPS.length);
    }, 2000);

    correctionPollRef.current = setInterval(async () => {
      const response = await fetch(`/api/v1/epreuves/${inputLink.epreuveId}/copie/${inputLink.copieId}`);
      if (!response.ok) {
        return;
      }

      const payload = (await response.json()) as { status: string };
      setPollingStatus(payload.status);

      if (payload.status === 'done') {
        markDone(inputLink);
      }

      if (payload.status === 'error') {
        markError();
      }
    }, 3000);
  }, [markDone, markError, stopCorrectionWatch]);

  const watchCorrectionProgress = useCallback((inputLink: CopieLink) => {
    if (typeof window === 'undefined' || typeof window.EventSource === 'undefined') {
      pollCorrection(inputLink);
      return;
    }

    stopCorrectionWatch();
    setPollingStatus('pending');
    setCopieLink(null);

    processingStepTimerRef.current = setInterval(() => {
      setProcessingStepIndex((prev) => (prev + 1) % PROCESSING_STEPS.length);
    }, 2000);

    eventSourceRef.current = new EventSource(`/api/v1/epreuves/copies/${inputLink.copieId}/events`);
    eventSourceRef.current.addEventListener('progress', (event) => {
      const messageEvent = event as MessageEvent<string>;
      const parsed = JSON.parse(messageEvent.data) as {
        type: 'progress';
        event: { stage: string; message: string };
      };

      if (parsed.type !== 'progress') {
        return;
      }

      if (parsed.event.stage === 'queued') {
        setPollingStatus('pending');
        return;
      }

      if (
        parsed.event.stage === 'ocr_started' ||
        parsed.event.stage === 'ocr_done' ||
        parsed.event.stage === 'correction_started'
      ) {
        setPollingStatus('processing');
        return;
      }

      if (parsed.event.stage === 'correction_done' || parsed.event.stage === 'report_ready') {
        markDone(inputLink);
        return;
      }

      if (parsed.event.stage === 'failed') {
        markError();
      }
    });

    eventSourceRef.current.onerror = () => {
      stopCorrectionWatch();
      pollCorrection(inputLink);
    };
  }, [markDone, markError, pollCorrection, stopCorrectionWatch]);

  useEffect(() => {
    return () => {
      stopCorrectionWatch();
    };
  }, [stopCorrectionWatch]);

  return {
    pollingStatus,
    processingStepIndex,
    processingLabel: PROCESSING_STEPS[processingStepIndex] ?? PROCESSING_STEPS[0],
    copieLink,
    setCopieLink,
    stopCorrectionWatch,
    watchCorrectionProgress,
    pollCorrection,
  };
}
