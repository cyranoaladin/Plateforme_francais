'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { type ExamPersona } from '@/lib/agents/prompts/examiner-persona';
import { buildTuteurHref } from '@/lib/navigation/tuteur-link';
import { createAudioRecorder, type BrowserAudioRecorder } from '@/lib/oral/audio-recorder';
import { PASSAGE_DURATION_MS, PHASE_DURATIONS_S, PREP_DURATION_MS } from '@/lib/oral/state-machine';
import { getCsrfToken } from '@/lib/security/csrf-client';
import { createBrowserStt } from '@/lib/stt/browser';
import { useOralApi } from './useOralApi';
import { useOralQuota } from './useOralQuota';
import { createEmptyFeedbacks, useOralSessionState } from './useOralSessionState';
import { useVoiceMode } from './useVoiceMode';
import { usePrepChecklist } from './usePrepChecklist';
import { useCountdown } from './useCountdown';
import { type JuryTurn, type OralStep, type StepFeedback } from '../types';

export const STEPS: OralStep[] = ['LECTURE', 'EXPLICATION', 'GRAMMAIRE', 'ENTRETIEN'];
export const STEP_LABELS: Record<OralStep, string> = {
  LECTURE: 'Lecture /2',
  EXPLICATION: 'Explication /8',
  GRAMMAIRE: 'Grammaire /2',
  ENTRETIEN: 'Entretien /8',
};
export const STEP_GUIDANCE: Record<OralStep, { title: string; body: string }> = {
  LECTURE: {
    title: 'Lecture expressive',
    body: 'Soigne le débit, les ponctuations et les respirations. La note vient autant de la netteté que de la simple fluidité.',
  },
  EXPLICATION: {
    title: 'Explication linéaire',
    body: 'Reste sur une problématique claire, des mouvements lisibles et des procédés commentés plutôt que simplement listés.',
  },
  GRAMMAIRE: {
    title: 'Question de grammaire',
    body: 'Nomme précisément le fait de langue, rattache-le à la phrase, puis explique brièvement son effet.',
  },
  ENTRETIEN: {
    title: 'Entretien examinateur',
    body: "Réponds nettement, repars de l'œuvre choisie et garde une logique de dialogue plutôt qu'une mini dissertation flottante.",
  },
};
export const PREP_CHECKLIST = [
  { id: 'contexte', label: "Identifier le contexte de l’extrait (auteur, œuvre, mouvement)" },
  { id: 'mouvement', label: "Repérer les mouvements du texte et l’articulation des parties" },
  { id: 'problematique', label: "Formuler une problématique d'analyse" },
  { id: 'procedes', label: 'Relever les procédés clés + citations à commenter' },
  { id: 'grammaire', label: 'Anticiper la question de grammaire (nature, fonction, analyse)' },
] as const;

const PREP_DURATION_S = PREP_DURATION_MS / 1000;
const PASSAGE_DURATION_S = PASSAGE_DURATION_MS / 1000;

function speakText(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'fr-FR';
  const synth = window.speechSynthesis;
  const voices = synth.getVoices();
  const preferred =
    voices.find(
      (voice) =>
        voice.lang.toLowerCase().startsWith('fr') &&
        voice.name.toLowerCase().includes('google'),
    ) ?? voices.find((voice) => voice.lang.toLowerCase().startsWith('fr'));
  if (preferred) {
    utterance.voice = preferred;
  }
  synth.speak(utterance);
}

function speakTextSafe(text: string) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    speakText(text);
  }
}

function playAudioBase64(base64: string, mimeType: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
      }
      const blob = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => {
        URL.revokeObjectURL(url);
        resolve();
      };
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Lecture audio impossible.'));
      };
      audio.play().catch(reject);
    } catch (error) {
      reject(error);
    }
  });
}

export function useOralSession(input: { initialWork: string }) {
  const {
    oeuvre,
    setOeuvre,
    mode,
    setMode,
    session,
    setSession,
    wizardPhase,
    setWizardPhase,
    currentStepIndex,
    setCurrentStepIndex,
    transcript,
    setTranscript,
    prepNotes,
    setPrepNotes,
    isMicOn,
    setIsMicOn,
    isLoading,
    setIsLoading,
    feedbacks,
    setFeedbacks,
    bilan,
    setBilan,
    error,
    setError,
    upgradeUrl,
    setUpgradeUrl,
    badgeToasts,
    setBadgeToasts,
    examinerProfile,
    setExaminerProfile,
    juryTurns,
    setJuryTurns,
    isJuryLoading,
    setIsJuryLoading,
    resetRuntimeState,
  } = useOralSessionState(input.initialWork);
  const quota = useOralQuota();
  const [voiceMode, setVoiceMode] = useVoiceMode();
  const api = useOralApi({
    resolveError: quota.resolveError,
    onUpgradeUrl: setUpgradeUrl,
    onVoiceModeDetected: setVoiceMode,
  });
  const prepChecklistKey = useMemo(() => session?.sessionId ?? 'global', [session?.sessionId]);
  const {
    checked: prepChecklist,
    isChecked: prepChecklistSet,
    toggle: togglePrepChecklist,
    reset: resetPrepChecklist,
  } = usePrepChecklist(prepChecklistKey);

  const stepStartRef = useRef<number>(Date.now());
  const sttRef = useRef<ReturnType<typeof createBrowserStt> | null>(null);
  const audioRecorderRef = useRef<BrowserAudioRecorder | null>(null);
  const pendingAudioRef = useRef<{ blob: Blob; mimeType: string } | null>(null);
  const hasRequestedInitialJuryPromptRef = useRef(false);
  const juryContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setOeuvre(input.initialWork);
  }, [input.initialWork, setOeuvre]);

  const currentStep = STEPS[currentStepIndex] ?? null;
  const isSimulation = mode === 'SIMULATION';
  const prepRunning = wizardPhase === 'PREP';
  const passageRunning = wizardPhase === 'PASSAGE';
  const prepRemaining = useCountdown(
    PREP_DURATION_S,
    prepRunning && isSimulation,
    session?.sessionId ? `prep_${session.sessionId}` : undefined,
  );
  const passageRemaining = useCountdown(
    PASSAGE_DURATION_S,
    passageRunning && isSimulation,
    session?.sessionId ? `pass_${session.sessionId}` : undefined,
  );
  const phaseRemaining = useCountdown(
    currentStep ? PHASE_DURATIONS_S[currentStep] : 0,
    passageRunning && isSimulation && Boolean(currentStep),
    session?.sessionId && currentStep ? `phase_${session.sessionId}_${currentStep}` : undefined,
  );

  useEffect(() => {
    void api.syncCapabilities();

    sttRef.current = createBrowserStt();
    sttRef.current?.onResult((text: string) => setTranscript(text));

    if (typeof window !== 'undefined' && typeof MediaRecorder !== 'undefined') {
      audioRecorderRef.current = createAudioRecorder({
        mediaDevices: navigator.mediaDevices,
        MediaRecorderCtor: MediaRecorder,
      });
    }

    return () => {
      sttRef.current?.stop();
      audioRecorderRef.current?.dispose();
      pendingAudioRef.current = null;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [api, setTranscript]);

  useEffect(() => {
    if (!juryContainerRef.current) return;
    juryContainerRef.current.scrollTop = juryContainerRef.current.scrollHeight;
  }, [juryTurns]);

  const aggregated = useMemo(() => {
    const items = STEPS.map((step) => feedbacks[step]).filter(Boolean) as StepFeedback[];
    return {
      totalScore: items.reduce((sum, item) => sum + item.score, 0),
      totalMax: items.reduce((sum, item) => sum + item.max, 0),
    };
  }, [feedbacks]);

  const oralTutorHref = useMemo(
    () =>
      buildTuteurHref({
        workId: session?.oeuvreChoisie ?? oeuvre,
        sessionId: session?.sessionId ?? null,
      }),
    [oeuvre, session?.oeuvreChoisie, session?.sessionId],
  );

  const startSession = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      setUpgradeUrl(null);
      const payload = await api.startSession({ oeuvre, mode });
      setSession(payload);
      setWizardPhase('PREP');
      resetRuntimeState();
      resetPrepChecklist();
      hasRequestedInitialJuryPromptRef.current = false;
      stepStartRef.current = Date.now();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erreur inconnue.');
    } finally {
      setIsLoading(false);
    }
  }, [
    api,
    mode,
    oeuvre,
    resetPrepChecklist,
    resetRuntimeState,
    setError,
    setIsLoading,
    setSession,
    setUpgradeUrl,
    setWizardPhase,
  ]);

  const startPassage = useCallback(async () => {
    if (!session) return;
    await api.startPassage(session.sessionId);
    setWizardPhase('PASSAGE');
    stepStartRef.current = Date.now();
  }, [api, session, setWizardPhase]);

  const useServerVoice = voiceMode === 'server' && audioRecorderRef.current !== null;

  const toggleMic = useCallback(async () => {
    if (isMicOn) {
      if (useServerVoice && audioRecorderRef.current) {
        try {
          const recorded = await audioRecorderRef.current.stop();
          pendingAudioRef.current = recorded;
        } catch {
          pendingAudioRef.current = null;
        }
      } else {
        sttRef.current?.stop();
      }
      setIsMicOn(false);
      return;
    }

    if (useServerVoice && audioRecorderRef.current) {
      try {
        await audioRecorderRef.current.start();
        setIsMicOn(true);
      } catch {
        sttRef.current?.start();
        setIsMicOn(true);
      }
      return;
    }

    sttRef.current?.start();
    setIsMicOn(true);
  }, [isMicOn, setIsMicOn, useServerVoice]);

  const submitStep = useCallback(async () => {
    if (!session || !currentStep) return;

    const audioData = pendingAudioRef.current;
    const hasAudio = useServerVoice && audioData !== null;
    const hasText = transcript.trim().length > 0;
    if (!hasAudio && !hasText) return;

    setIsLoading(true);
    setError(null);

    try {
      const duration = Math.max(1, Math.floor((Date.now() - stepStartRef.current) / 1000));
      let payload: StepFeedback;

      if (hasAudio) {
        const result = await api.submitAudioTurn({
          sessionId: session.sessionId,
          step: currentStep,
          duration,
          examinerProfile,
          audio: audioData,
        });
        if (result.fallbackToWebSpeech && !result.transcript) {
          setError('Transcription serveur indisponible. Utilise le micro pour dicter ta réponse.');
          pendingAudioRef.current = null;
          return;
        }

        if (result.transcript) {
          setTranscript(result.transcript);
        }

        payload = result.evaluation as StepFeedback;

        if (result.juryAudioBase64 && result.juryAudioMimeType) {
          playAudioBase64(result.juryAudioBase64, result.juryAudioMimeType).catch(() => {
            if (payload.relance) {
              speakTextSafe(payload.relance);
            } else if (payload.feedback) {
              speakTextSafe(payload.feedback);
            }
          });
        } else if (currentStep === 'ENTRETIEN' && payload.relance) {
          speakTextSafe(payload.relance);
        }
      } else {
        payload = await api.submitTextTurn({
          sessionId: session.sessionId,
          step: currentStep,
          transcript,
          duration,
          examinerProfile,
        });
        if (currentStep === 'ENTRETIEN' && payload.relance) {
          speakTextSafe(payload.relance);
        }
      }

      pendingAudioRef.current = null;
      setFeedbacks((prev) => ({ ...prev, [currentStep]: payload }));

      if (currentStepIndex < STEPS.length - 1) {
        setCurrentStepIndex((prev) => prev + 1);
        setTranscript('');
        stepStartRef.current = Date.now();
        return;
      }

      const endPayload = await api.endSession({
        sessionId: session.sessionId,
        notes: prepNotes,
        examinerProfile,
      });
      setBilan(endPayload);
      setWizardPhase('BILAN');
      if (endPayload.newBadges?.length) {
        setBadgeToasts(endPayload.newBadges);
        window.setTimeout(() => setBadgeToasts([]), 4500);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erreur inconnue.');
    } finally {
      setIsLoading(false);
      if (isMicOn) {
        if (useServerVoice && audioRecorderRef.current) {
          audioRecorderRef.current.stop().catch(() => {});
        } else {
          sttRef.current?.stop();
        }
        setIsMicOn(false);
      }
    }
  }, [
    api,
    currentStep,
    currentStepIndex,
    examinerProfile,
    isMicOn,
    prepNotes,
    session,
    setBadgeToasts,
    setBilan,
    setCurrentStepIndex,
    setError,
    setFeedbacks,
    setIsLoading,
    setIsMicOn,
    setTranscript,
    setWizardPhase,
    transcript,
    useServerVoice,
  ]);

  const requestJuryPrompt = useCallback(
    async (input: {
      message: string;
      conversationHistory: JuryTurn[];
      includeStudentTurn: boolean;
    }) => {
      if (!session || currentStep !== 'ENTRETIEN') return;

      setIsJuryLoading(true);
      setError(null);
      try {
        const csrfToken = await getCsrfToken();
        const response = await fetch('/api/v1/oral/jury-respond', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken,
          },
          body: JSON.stringify({
            message: input.message,
            oeuvreChoisie: session.oeuvreChoisie,
            examinerProfile,
            conversationHistory: input.conversationHistory,
          }),
        });
        if (!response.ok) {
          throw new Error("Impossible de générer une question de l'examinateur.");
        }

        const payload = (await response.json()) as { juryText: string };
        setJuryTurns((prev) => [
          ...prev,
          ...(input.includeStudentTurn ? [{ role: 'eleve' as const, content: input.message }] : []),
          { role: 'jury' as const, content: payload.juryText },
        ]);
        speakTextSafe(payload.juryText);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Erreur inconnue.');
      } finally {
        setIsJuryLoading(false);
      }
    },
    [currentStep, examinerProfile, session, setError, setIsJuryLoading, setJuryTurns],
  );

  const askExaminerFollowUp = useCallback(async () => {
    const userAnswer = transcript.trim();
    if (!session || currentStep !== 'ENTRETIEN' || userAnswer.length === 0) return;

    await requestJuryPrompt({
      message: userAnswer,
      conversationHistory: juryTurns,
      includeStudentTurn: true,
    });
  }, [currentStep, juryTurns, requestJuryPrompt, session, transcript]);

  useEffect(() => {
    if (
      !session ||
      currentStep !== 'ENTRETIEN' ||
      juryTurns.length > 0 ||
      hasRequestedInitialJuryPromptRef.current
    ) {
      return;
    }

    hasRequestedInitialJuryPromptRef.current = true;
    void requestJuryPrompt({
      message:
        "L'entretien officiel commence. Pose immédiatement une première question d'examinateur sur l'œuvre choisie, claire, directe et exploitable à l'oral.",
      conversationHistory: [],
      includeStudentTurn: false,
    }).catch(() => {
      hasRequestedInitialJuryPromptRef.current = false;
    });
  }, [currentStep, juryTurns.length, requestJuryPrompt, session]);

  const resetAll = useCallback(() => {
    setSession(null);
    setBilan(null);
    setWizardPhase('TIRAGE');
    setFeedbacks(createEmptyFeedbacks());
    setExaminerProfile('NEUTRE');
    setJuryTurns([]);
    setIsJuryLoading(false);
    setVoiceMode('browser');
    hasRequestedInitialJuryPromptRef.current = false;
    setTranscript('');
    setPrepNotes('');
    resetPrepChecklist();
    setCurrentStepIndex(0);
    setError(null);
    setUpgradeUrl(null);
  }, [
    resetPrepChecklist,
    setBilan,
    setCurrentStepIndex,
    setError,
    setExaminerProfile,
    setFeedbacks,
    setIsJuryLoading,
    setJuryTurns,
    setPrepNotes,
    setSession,
    setTranscript,
    setUpgradeUrl,
    setVoiceMode,
    setWizardPhase,
  ]);

  return {
    oeuvre,
    setOeuvre,
    mode,
    setMode,
    session,
    wizardPhase,
    currentStep,
    currentStepIndex,
    transcript,
    setTranscript,
    prepNotes,
    setPrepNotes,
    isMicOn,
    isLoading,
    feedbacks,
    bilan,
    error,
    upgradeUrl,
    badgeToasts,
    examinerProfile,
    setExaminerProfile: setExaminerProfile as (profile: ExamPersona) => void,
    juryTurns,
    isJuryLoading,
    prepChecklist,
    prepChecklistSet,
    togglePrepChecklist,
    resetPrepChecklist,
    prepRemaining,
    passageRemaining,
    phaseRemaining,
    isSimulation,
    aggregated,
    oralTutorHref,
    useServerVoice,
    juryContainerRef,
    startSession,
    startPassage,
    toggleMic,
    submitStep,
    askExaminerFollowUp,
    resetAll,
  };
}
