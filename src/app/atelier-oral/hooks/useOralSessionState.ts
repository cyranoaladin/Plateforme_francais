'use client';

import { useCallback, useState } from 'react';
import { type BilanResult, type ExaminerProfile, type JuryTurn, type OralMode, type OralStep, type SessionPayload, type StepFeedback, type WizardPhase } from '../types';

export function createEmptyFeedbacks(): Record<OralStep, StepFeedback | undefined> {
  return {
    LECTURE: undefined,
    EXPLICATION: undefined,
    GRAMMAIRE: undefined,
    ENTRETIEN: undefined,
  };
}

export function useOralSessionState(initialWork: string) {
  const [oeuvre, setOeuvre] = useState(initialWork);
  const [mode, setMode] = useState<OralMode>('SIMULATION');
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [wizardPhase, setWizardPhase] = useState<WizardPhase>('TIRAGE');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [prepNotes, setPrepNotes] = useState('');
  const [isMicOn, setIsMicOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Record<OralStep, StepFeedback | undefined>>(
    createEmptyFeedbacks(),
  );
  const [bilan, setBilan] = useState<BilanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [upgradeUrl, setUpgradeUrl] = useState<string | null>(null);
  const [badgeToasts, setBadgeToasts] = useState<string[]>([]);
  const [examinerProfile, setExaminerProfile] = useState<ExaminerProfile>('NEUTRE');
  const [juryTurns, setJuryTurns] = useState<JuryTurn[]>([]);
  const [isJuryLoading, setIsJuryLoading] = useState(false);

  const resetRuntimeState = useCallback(() => {
    setCurrentStepIndex(0);
    setTranscript('');
    setPrepNotes('');
    setBilan(null);
    setFeedbacks(createEmptyFeedbacks());
    setExaminerProfile('NEUTRE');
    setJuryTurns([]);
    setIsJuryLoading(false);
    setError(null);
    setUpgradeUrl(null);
  }, []);

  return {
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
  };
}
