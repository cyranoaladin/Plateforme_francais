'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  Clock,
  Headphones,
  Loader2,
  Mic,
  Play,
  Shield,
  Sparkles,
  Square,
  Star,
  Volume2,
  Zap,
} from 'lucide-react';
import { buildTuteurHref } from '@/lib/navigation/tuteur-link';
import { sanitizeLlmText } from '@/lib/ui/sanitize-llm';
import { createAudioRecorder, type BrowserAudioRecorder } from '@/lib/oral/audio-recorder';
import { createBrowserStt } from '@/lib/stt/browser';
import { getCsrfTokenFromDocument } from '@/lib/security/csrf-client';
import { Button, Badge } from '@/components/ui';

type VoiceMode = 'browser' | 'server' | 'auto';

type OralStep = 'LECTURE' | 'EXPLICATION' | 'GRAMMAIRE' | 'ENTRETIEN';
type WizardPhase = 'TIRAGE' | 'PREP' | 'PASSAGE' | 'BILAN';
type OralMode = 'SIMULATION' | 'FREE_PRACTICE';

type SessionPayload = {
  sessionId: string;
  texte: string;
  questionGrammaire: string;
  phraseGrammaire?: string;
  oeuvreChoisie?: string;
  instructions: string;
};

type StepFeedback = {
  feedback: string;
  score: number;
  max: number;
  points_forts: string[];
  axes: string[];
  relance?: string;
};

type ExaminerProfile = 'BIENVEILLANT' | 'NEUTRE' | 'HOSTILE';

type JuryTurn = {
  role: 'jury' | 'eleve';
  content: string;
};

type BilanResult = {
  note: number;
  maxNote: number;
  mention: string;
  phases: {
    lecture: { note: number; max: number; commentaire: string };
    explication: { note: number; max: number; commentaire: string };
    grammaire: { note: number; max: number; commentaire: string };
    entretien: { note: number; max: number; commentaire: string };
  };
  bilan_global: string;
  conseil_final: string;
  newBadges?: string[];
};

const STEPS: OralStep[] = ['LECTURE', 'EXPLICATION', 'GRAMMAIRE', 'ENTRETIEN'];
const STEP_LABELS: Record<OralStep, string> = {
  LECTURE: 'Lecture /2',
  EXPLICATION: 'Explication /8',
  GRAMMAIRE: 'Grammaire /2',
  ENTRETIEN: 'Entretien /8',
};

const STEP_GUIDANCE: Record<OralStep, { title: string; body: string }> = {
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

const PHASE_DURATIONS_S: Record<OralStep, number> = {
  LECTURE: 2 * 60,
  EXPLICATION: 8 * 60,
  GRAMMAIRE: 2 * 60,
  ENTRETIEN: 8 * 60,
};

const PREP_DURATION_S = 30 * 60;
const PASSAGE_DURATION_S = 20 * 60;

const PREP_CHECKLIST = [
  { id: 'contexte', label: "Identifier le contexte de l’extrait (auteur, œuvre, mouvement)" },
  { id: 'mouvement', label: "Repérer les mouvements du texte et l’articulation des parties" },
  { id: 'problematique', label: "Formuler une problématique d'analyse" },
  { id: 'procedes', label: 'Relever les procédés clés + citations à commenter' },
  { id: 'grammaire', label: 'Anticiper la question de grammaire (nature, fonction, analyse)' },
];

const OEUVRES_PROGRAMME_2025_2026 = [
  'Cahier de Douai — Arthur Rimbaud',
  "La rage de l'expression — Francis Ponge",
  'Mes forêts — Hélène Dorion',
  'Discours de la servitude volontaire — Étienne de La Boétie',
  'Entretiens sur la pluralité des mondes — Fontenelle',
  "Lettres d'une Péruvienne — Françoise de Graffigny",
  'Le Menteur — Pierre Corneille',
  "On ne badine pas avec l'amour — Alfred de Musset",
  'Pour un oui ou pour un non — Nathalie Sarraute',
  'Manon Lescaut — Abbé Prévost',
  'La Peau de chagrin — Honoré de Balzac',
  'Sido suivi de Les Vrilles de la vigne — Colette',
];

function speakText(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'fr-FR';
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find((voice) => voice.lang.toLowerCase().startsWith('fr') && voice.name.toLowerCase().includes('google'));
  if (preferred) utterance.voice = preferred;
  window.speechSynthesis.speak(utterance);
}

function playAudioBase64(base64: string, mimeType: string): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
      audio.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Lecture audio impossible.')); };
      audio.play().catch(reject);
    } catch (err) {
      reject(err);
    }
  });
}

function playAlert() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    // Audio not available.
  }
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function timerTone(remaining: number): string {
  if (remaining <= 120) return 'border-[var(--border-accent)] bg-[var(--c-accent-subtle)] text-[var(--c-accent-text)]';
  if (remaining <= 600) return 'border-[var(--border-reward)] bg-[var(--bg-reward)] text-[var(--c-reward)]';
  return 'border-[var(--border-success)] bg-[var(--bg-success)] text-[var(--c-success)]';
}

function useCountdown(totalSeconds: number, running: boolean, persistenceKey?: string) {
  const [remaining, setRemaining] = useState(totalSeconds);

  const alertedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!running) {
      alertedRef.current.clear();
      if (persistenceKey) localStorage.removeItem(`timer_start_${persistenceKey}`);
      return;
    }

    let startTime = Date.now();
    if (persistenceKey) {
      const stored = localStorage.getItem(`timer_start_${persistenceKey}`);
      if (stored) {
        startTime = parseInt(stored, 10);
      } else {
        localStorage.setItem(`timer_start_${persistenceKey}`, startTime.toString());
      }
    }

    const tick = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const left = Math.max(0, totalSeconds - elapsed);
      setRemaining(left);
      if ((left === 600 || left === 120 || left === 0) && !alertedRef.current.has(left)) {
        alertedRef.current.add(left);
        playAlert();
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [running, totalSeconds, persistenceKey]);

  return running ? remaining : totalSeconds;
}

export default function AtelierOralPage() {
  const [oeuvre, setOeuvre] = useState(OEUVRES_PROGRAMME_2025_2026[0]);
  const [mode, setMode] = useState<OralMode>('SIMULATION');
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [wizardPhase, setWizardPhase] = useState<WizardPhase>('TIRAGE');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [prepNotes, setPrepNotes] = useState('');
  const [prepChecklist, setPrepChecklist] = useState<Set<string>>(new Set());
  const [isMicOn, setIsMicOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Record<OralStep, StepFeedback | undefined>>({
    LECTURE: undefined,
    EXPLICATION: undefined,
    GRAMMAIRE: undefined,
    ENTRETIEN: undefined,
  });
  const [bilan, setBilan] = useState<BilanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [upgradeUrl, setUpgradeUrl] = useState<string | null>(null);
  const [badgeToasts, setBadgeToasts] = useState<string[]>([]);
  const [examinerProfile, setExaminerProfile] = useState<ExaminerProfile>('NEUTRE');
  const [juryTurns, setJuryTurns] = useState<JuryTurn[]>([]);
  const [isJuryLoading, setIsJuryLoading] = useState(false);

  const [voiceMode, setVoiceMode] = useState<VoiceMode>('browser');
  const stepStartRef = useRef<number>(Date.now());
  const sttRef = useRef<ReturnType<typeof createBrowserStt> | null>(null);
  const audioRecorderRef = useRef<BrowserAudioRecorder | null>(null);
  const pendingAudioRef = useRef<{ blob: Blob; mimeType: string } | null>(null);
  const hasRequestedInitialJuryPromptRef = useRef(false);

  const currentStep = STEPS[currentStepIndex] ?? null;
  const isSimulation = mode === 'SIMULATION';
  const prepRunning = wizardPhase === 'PREP';
  const passageRunning = wizardPhase === 'PASSAGE';
  const prepRemaining = useCountdown(PREP_DURATION_S, prepRunning && isSimulation, session?.sessionId ? `prep_${session.sessionId}` : undefined);
  const passageRemaining = useCountdown(PASSAGE_DURATION_S, passageRunning && isSimulation, session?.sessionId ? `pass_${session.sessionId}` : undefined);
  const phaseRemaining = useCountdown(
    currentStep ? PHASE_DURATIONS_S[currentStep] : 0,
    passageRunning && isSimulation && Boolean(currentStep),
    session?.sessionId && currentStep ? `phase_${session.sessionId}_${currentStep}` : undefined,
  );

  useEffect(() => {
    // Detect effective voice mode from capabilities endpoint
    fetch('/api/v1/oral/capabilities')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.effectiveVoiceMode) {
          setVoiceMode(data.effectiveVoiceMode as VoiceMode);
        } else if (data?.voiceMode) {
          setVoiceMode(data.voiceMode as VoiceMode);
        }
      })
      .catch(() => { /* keep browser mode */ });

    // Always set up browser STT as fallback
    sttRef.current = createBrowserStt();
    sttRef.current?.onResult((text: string) => setTranscript(text));

    // Set up audio recorder for server mode
    if (typeof window !== 'undefined' && typeof MediaRecorder !== 'undefined') {
      audioRecorderRef.current = createAudioRecorder({
        mediaDevices: navigator.mediaDevices,
        MediaRecorderCtor: MediaRecorder,
      });
    }
  }, []);

  const aggregated = useMemo(() => {
    const list = STEPS.map((step) => feedbacks[step]).filter(Boolean) as StepFeedback[];
    const totalScore = list.reduce((sum, item) => sum + item.score, 0);
    const totalMax = list.reduce((sum, item) => sum + item.max, 0);
    return { totalScore, totalMax };
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
      const response = await fetch('/api/v1/oral/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrfTokenFromDocument() },
        body: JSON.stringify({ oeuvre, mode }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (errData.upgradeUrl) setUpgradeUrl(errData.upgradeUrl);
        throw new Error(errData.error || 'Impossible de démarrer la session orale.');
      }
      const payload = (await response.json()) as SessionPayload;
      setSession(payload);
      try {
        await fetch(`/api/v1/oral/session/${payload.sessionId}/start-prep`, {
          method: 'POST',
          headers: { 'X-CSRF-Token': getCsrfTokenFromDocument() },
        });
      } catch {
        // Sync failure is non-blocking for the UI.
      }
      setWizardPhase('PREP');
      setCurrentStepIndex(0);
      setTranscript('');
      setPrepNotes('');
      setPrepChecklist(new Set());
      setBilan(null);
      setFeedbacks({ LECTURE: undefined, EXPLICATION: undefined, GRAMMAIRE: undefined, ENTRETIEN: undefined });
      setExaminerProfile('NEUTRE');
      setJuryTurns([]);
      stepStartRef.current = Date.now();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erreur inconnue.');
    } finally {
      setIsLoading(false);
    }
  }, [mode, oeuvre]);

  const startPassage = useCallback(async () => {
    if (!session) return;
    try {
      await fetch(`/api/v1/oral/session/${session.sessionId}/start-passage`, {
        method: 'POST',
        headers: { 'X-CSRF-Token': getCsrfTokenFromDocument() },
      });
    } catch {
      // Sync failure is non-blocking for the UI.
    }
    setWizardPhase('PASSAGE');
    stepStartRef.current = Date.now();
  }, [session]);

  const useServerVoice = voiceMode === 'server' && audioRecorderRef.current !== null;

  const toggleMic = useCallback(async () => {
    if (isMicOn) {
      // Stop recording
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

    // Start recording
    if (useServerVoice && audioRecorderRef.current) {
      try {
        await audioRecorderRef.current.start();
        setIsMicOn(true);
      } catch {
        // Fallback to browser STT if recorder fails
        sttRef.current?.start();
        setIsMicOn(true);
      }
    } else {
      sttRef.current?.start();
      setIsMicOn(true);
    }
  }, [isMicOn, useServerVoice]);

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
        // ── Server voice mode: send audio to audio-turn endpoint ──
        const formData = new FormData();
        formData.append('audio', audioData.blob, 'recording.webm');
        formData.append('step', currentStep);
        formData.append('duration', String(duration));

        const response = await fetch(`/api/v1/oral/session/${session.sessionId}/audio-turn`, {
          method: 'POST',
          headers: { 'X-CSRF-Token': getCsrfTokenFromDocument() },
          body: formData,
        });
        if (!response.ok) throw new Error("Échec de l’analyse de la prestation.");

        const result = await response.json();

        if (result.fallbackToWebSpeech && !result.transcript) {
          // STT failed — fallback: user must use browser speech
          setError('Transcription serveur indisponible. Utilise le micro pour dicter ta réponse.');
          pendingAudioRef.current = null;
          return;
        }

        // Update transcript from server STT
        if (result.transcript) setTranscript(result.transcript);

        payload = result.evaluation;

        // Play jury audio if available, otherwise use browser TTS
        if (result.juryAudioBase64 && result.juryAudioMimeType) {
          playAudioBase64(result.juryAudioBase64, result.juryAudioMimeType).catch(() => {
            if (payload.relance) speakText(payload.relance);
            else if (payload.feedback) speakText(payload.feedback);
          });
        } else if (currentStep === 'ENTRETIEN' && payload.relance) {
          speakText(payload.relance);
        }
      } else {
        // ── Browser mode: send text to interact endpoint ──
        const response = await fetch(`/api/v1/oral/session/${session.sessionId}/interact`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrfTokenFromDocument() },
          body: JSON.stringify({ step: currentStep, transcript, duration }),
        });
        if (!response.ok) throw new Error("Échec de l’analyse de la prestation.");
        payload = (await response.json()) as StepFeedback;
        if (currentStep === 'ENTRETIEN' && payload.relance) speakText(payload.relance);
      }

      pendingAudioRef.current = null;
      setFeedbacks((prev) => ({ ...prev, [currentStep]: payload }));

      if (currentStepIndex < STEPS.length - 1) {
        setCurrentStepIndex((prev) => prev + 1);
        setTranscript('');
        stepStartRef.current = Date.now();
        return;
      }

      const endResponse = await fetch(`/api/v1/oral/session/${session.sessionId}/end`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrfTokenFromDocument() },
        body: JSON.stringify({ notes: prepNotes }),
      });
      if (!endResponse.ok) throw new Error('Échec de finalisation de la session.');
      const endPayload = (await endResponse.json()) as BilanResult;
      setBilan(endPayload);
      setWizardPhase('BILAN');
      if (endPayload.newBadges && endPayload.newBadges.length > 0) {
        setBadgeToasts(endPayload.newBadges);
        setTimeout(() => setBadgeToasts([]), 4500);
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
  }, [currentStep, currentStepIndex, isMicOn, prepNotes, session, transcript, useServerVoice]);

  const requestJuryPrompt = useCallback(async (input: {
    message: string;
    conversationHistory: JuryTurn[];
    includeStudentTurn: boolean;
  }) => {
    if (!session || currentStep !== 'ENTRETIEN') {
      return;
    }

    setIsJuryLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/oral/jury-respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfTokenFromDocument(),
        },
        body: JSON.stringify({
          message: input.message,
          oeuvreChoisie: session.oeuvreChoisie,
          examinerProfile,
          conversationHistory: input.conversationHistory,
        }),
      });
      if (!response.ok) {
        throw new Error('Impossible de générer une relance examinateur.');
      }
      const payload = (await response.json()) as { juryText: string };
      setJuryTurns((prev) => [
        ...prev,
        ...(input.includeStudentTurn ? [{ role: 'eleve' as const, content: input.message }] : []),
        { role: 'jury' as const, content: payload.juryText },
      ]);
      speakText(payload.juryText);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erreur inconnue.');
    } finally {
      setIsJuryLoading(false);
    }
  }, [currentStep, examinerProfile, session]);

  const askExaminerFollowUp = useCallback(async () => {
    const userAnswer = transcript.trim();
    if (!session || currentStep !== 'ENTRETIEN' || userAnswer.length === 0) {
      return;
    }

    await requestJuryPrompt({
      message: userAnswer,
      conversationHistory: juryTurns,
      includeStudentTurn: true,
    });
  }, [currentStep, juryTurns, requestJuryPrompt, session, transcript]);

  useEffect(() => {
    if (!session || currentStep !== 'ENTRETIEN' || juryTurns.length > 0 || hasRequestedInitialJuryPromptRef.current) {
      return;
    }

    hasRequestedInitialJuryPromptRef.current = true;
    void requestJuryPrompt({
      message: "L'entretien officiel commence. Pose immédiatement une première question d'examinateur sur l'œuvre choisie, claire, directe et exploitable à l'oral.",
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
    setExaminerProfile('NEUTRE');
    setJuryTurns([]);
    hasRequestedInitialJuryPromptRef.current = false;
    setTranscript('');
    setPrepNotes('');
    setPrepChecklist(new Set());
    setCurrentStepIndex(0);
    setError(null);
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <section className="hero-premium-panel relative overflow-hidden rounded-[24px] px-6 py-7 md:px-8 md:py-8 lg:px-10 lg:py-10">
        <div className="absolute inset-y-0 right-[-10%] hidden w-[42%] rounded-full bg-[radial-gradient(circle_at_center,_rgba(126,212,194,0.24),_transparent_72%)] blur-2xl lg:block" />
        <div className="absolute left-[-5%] top-[-20%] h-44 w-44 rounded-full bg-[rgba(216,163,99,0.16)] blur-3xl" />

        <div className="relative grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
          <div>
            <div className="hero-kicker">
              <BookOpen className="h-4 w-4" />
              Oral EAF
            </div>
            <h1 className="font-display mt-5 max-w-4xl text-4xl leading-tight tracking-[-0.03em] text-white md:text-5xl lg:text-6xl">
              Une simulation officielle pensée comme un espace d’entraînement, pas comme un outil brut.
            </h1>
            <p className="hero-body mt-4 max-w-3xl text-sm leading-7 md:text-base">
              Tirage, préparation, passage puis bilan. Tout est réuni dans un seul espace pour te garder concentré sur la qualité de ta prise de parole, la précision des attendus officiels et les points à retravailler la séance suivante.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {[
              { label: 'Préparation', value: isSimulation ? '30 min' : 'Libre' },
              { label: 'Passage', value: isSimulation ? '20 min' : 'Libre' },
              { label: 'Barème', value: '2 + 8 + 2 + 8' },
            ].map((item) => (
              <div key={item.label} className="hero-glass-card rounded-[24px] px-4 py-4">
                <p className="ui-stat-label text-[var(--hero-kicker-text)]">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <div data-testid="error-alert" className="space-y-3 rounded-[24px] border border-[var(--border-accent)] bg-[var(--c-accent-subtle)] px-5 py-4 text-sm text-[var(--c-accent-text)]" role="alert">
          <p>{error}</p>
          {upgradeUrl && (
            <Link href={upgradeUrl} className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-[var(--c-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--text-on-primary)] shadow-[var(--shadow-md)] transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-success)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-page)]">
              Découvrir les plans
            </Link>
          )}
        </div>
      )}

      {session && (
        <section className="rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-surface-secondary)] px-5 py-4 shadow-[var(--shadow-md)]">
          <div className="flex flex-wrap items-center gap-3">
            {(['TIRAGE', 'PREP', 'PASSAGE', 'BILAN'] as WizardPhase[]).map((phase) => {
              const active = wizardPhase === phase;
              return (
                <Badge
                  key={phase}
                  variant={active ? 'navy' : 'default'}
                  size="md"
                  className="uppercase tracking-[0.16em]"
                >
                  {phase === 'TIRAGE' ? 'Tirage' : phase === 'PREP' ? "Prépa 30'" : phase === 'PASSAGE' ? "Passage 20'" : 'Bilan'}
                </Badge>
              );
            })}
          </div>
        </section>
      )}

      {wizardPhase === 'TIRAGE' && !session && (
        <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
          <section className="rounded-[24px] border border-[var(--border-default)] bg-[linear-gradient(180deg,var(--bg-surface)_0%,var(--bg-surface-secondary)_100%)] p-6 shadow-[var(--shadow-md)] md:p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--c-primary)]/8 text-[var(--c-primary)]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-reward)]">Démarrage</p>
                <h2 className="font-display mt-2 text-3xl leading-tight tracking-[-0.02em] text-[var(--c-primary)]">
                  Tirage au sort de l’extrait
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
                  Choisis ton œuvre et le niveau de contrainte. La plateforme tire l’extrait, la question de grammaire puis t’installe directement dans le rythme de l’épreuve.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setMode('SIMULATION')}
                data-testid="mode-simulation-btn"
                className={`inline-flex items-center gap-2 rounded-[var(--radius-lg)] px-4 py-3 text-sm font-semibold transition-all duration-[var(--transition-normal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--c-success)] ${mode === 'SIMULATION' ? 'bg-[var(--c-primary)] text-[var(--text-on-primary)]' : 'border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--c-primary)]'}`}
                aria-pressed={mode === 'SIMULATION'}
              >
                <Shield className="h-4 w-4" />
                Simulation examen
              </button>
              <button
                onClick={() => setMode('FREE_PRACTICE')}
                data-testid="mode-practice-btn"
                className={`inline-flex items-center gap-2 rounded-[var(--radius-lg)] px-4 py-3 text-sm font-semibold transition-all duration-[var(--transition-normal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--c-success)] ${mode === 'FREE_PRACTICE' ? 'bg-[var(--c-success)] text-[var(--text-on-primary)]' : 'border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--c-primary)]'}`}
                aria-pressed={mode === 'FREE_PRACTICE'}
              >
                <Zap className="h-4 w-4" />
                Entraînement libre
              </button>
            </div>

            {mode === 'FREE_PRACTICE' && (
              <p className="mt-4 rounded-[16px] border border-[var(--border-success)] bg-[var(--bg-success)] px-4 py-3 text-sm text-[var(--c-success)]">
                Mode libre : les timers sont désactivés, tu peux prendre ton temps.
              </p>
            )}

            <div className="mt-6 max-w-xl">
              <label htmlFor="oeuvre-select" className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-body)]">
                Œuvre du programme
              </label>
              <select
                id="oeuvre-select"
                data-testid="oeuvre-select"
                className="w-full appearance-none rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-3 text-sm text-[var(--c-primary)] outline-none transition-all duration-[var(--transition-normal)] focus-visible:border-[var(--c-success)] focus-visible:ring-2 focus-visible:ring-[var(--c-success)]/20"
                value={oeuvre}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setOeuvre(event.target.value)}
              >
                {OEUVRES_PROGRAMME_2025_2026.map((work) => (
                  <option key={work} value={work}>
                    {work}
                  </option>
                ))}
              </select>
            </div>

            <Button
              data-testid="start-session-btn"
              onClick={startSession}
              disabled={isLoading}
              variant="primary"
              size="md"
              loading={isLoading}
              icon={!isLoading ? <Play className="h-4 w-4" /> : undefined}
              className="mt-6"
            >
              Tirer un extrait
            </Button>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[24px] border border-[var(--border-success)] bg-[var(--bg-success)] p-5 shadow-[var(--shadow-md)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-success)]">Ce qui va suivre</p>
              <div className="mt-4 space-y-3">
                {[
                  'Préparation structurée de 30 minutes avec notes personnelles.',
                  'Passage en quatre temps : lecture, explication, grammaire, entretien.',
                  'Bilan final /20 avec conseil concret pour la prochaine séance.',
                ].map((item, index) => (
                  <div key={item} className="rounded-[16px] border border-[var(--border-success)] bg-[var(--bg-surface)]/88 px-4 py-4 text-sm leading-7 text-[var(--text-body)]">
                    <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--c-success)]/10 text-xs font-semibold text-[var(--c-success)]">{index + 1}</span>
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-surface-secondary)] p-5 shadow-[var(--shadow-md)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-reward)]">Bon usage</p>
              <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
                Une bonne simulation orale ne cherche pas à parler beaucoup. Elle cherche à rendre la parole plus nette, plus articulée et plus défendable étape après étape.
              </p>
              <Link
                href={oralTutorHref}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--c-primary)] transition-colors hover:text-[var(--c-success)]"
              >
                Préparer cette œuvre avec le guidage
              </Link>
            </section>
          </aside>
        </div>
      )}

      {wizardPhase === 'PREP' && session && (
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <section className="rounded-[24px] border border-[var(--border-default)] bg-[linear-gradient(180deg,var(--bg-surface)_0%,var(--bg-surface-secondary)_100%)] p-6 shadow-[var(--shadow-md)] md:p-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-reward)]">Préparation</p>
                <h2 className="font-display mt-2 text-3xl leading-tight tracking-[-0.02em] text-[var(--c-primary)]">
                  Préparation
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">
                  Lis, structure, choisis tes procédés et prépare la grammaire. Les notes restent un brouillon de travail, pas un objet évalué.
                </p>
              </div>
              {isSimulation ? (
                <div className={`inline-flex items-center gap-2 rounded-[16px] border px-4 py-3 font-mono text-lg font-semibold ${timerTone(prepRemaining)}`} role="timer" aria-live="polite" aria-label={`Temps restant : ${formatTimer(prepRemaining)}`}>
                  <Clock className="h-5 w-5" />
                  {formatTimer(prepRemaining)}
                </div>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-[16px] border border-[var(--border-success)] bg-[var(--bg-success)] px-4 py-3 text-sm font-medium text-[var(--c-success)]">
                  <Zap className="h-4 w-4" />
                  Mode libre
                </span>
              )}
            </div>

            <div className="mt-6 rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-md)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--c-reward)]">Extrait tiré</p>
              <p data-testid="extrait-texte" className="mt-4 font-serif text-base leading-8 text-[var(--c-primary)]">{session.texte}</p>
              <div className="mt-5 space-y-2 text-sm leading-7 text-[var(--text-body)]">
                <p><span className="font-semibold text-[var(--c-primary)]">Question de grammaire :</span> {session.questionGrammaire}</p>
                {session.phraseGrammaire && (
                  <p><span className="font-semibold text-[var(--c-primary)]">Phrase cible :</span> {session.phraseGrammaire}</p>
                )}
                {session.oeuvreChoisie && (
                  <p><span className="font-semibold text-[var(--c-primary)]">Œuvre choisie (entretien) :</span> {session.oeuvreChoisie}</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="prep-notes" className="mb-2 block text-sm font-semibold text-[var(--c-primary)]">
                Notes de préparation (brouillon — non évaluées)
              </label>
              <textarea
                id="prep-notes"
                value={prepNotes}
                onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setPrepNotes(event.target.value)}
                className="min-h-60 w-full rounded-[var(--radius-xl)] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-4 text-sm leading-7 text-[var(--c-primary)] outline-none transition-all duration-[var(--transition-normal)] placeholder:text-[var(--text-muted)] focus-visible:border-[var(--c-success)] focus-visible:ring-2 focus-visible:ring-[var(--c-success)]/20"
                placeholder="Structure ton explication linéaire, prépare tes axes, note les procédés..."
              />
            </div>

            <Button
              onClick={startPassage}
              variant="primary"
              size="md"
              icon={<Play className="h-4 w-4" />}
              className="mt-6"
            >
              Commencer le passage (20 min)
            </Button>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[24px] border border-[var(--border-success)] bg-[var(--bg-success)] p-5 shadow-[var(--shadow-md)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-success)]">Checklist de préparation</p>
              <div className="mt-4 space-y-3">
                {PREP_CHECKLIST.map((item) => (
                  <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-[16px] border border-[var(--border-success)] bg-[var(--bg-surface)]/88 px-4 py-4 text-sm leading-7 text-[var(--text-body)]">
                    <input
                      type="checkbox"
                      checked={prepChecklist.has(item.id)}
                      onChange={() =>
                        setPrepChecklist((prev) => {
                          const next = new Set(prev);
                          if (next.has(item.id)) {
                            next.delete(item.id);
                          } else {
                            next.add(item.id);
                          }
                          return next;
                        })
                      }
                      className="mt-1 h-4 w-4 rounded border-[var(--border-success)] text-[var(--c-success)] focus:ring-[var(--c-success)]"
                    />
                    <span className={prepChecklist.has(item.id) ? 'text-[var(--text-muted)] line-through' : ''}>{item.label}</span>
                  </label>
                ))}
              </div>
              <p className="mt-4 text-sm font-medium text-[var(--c-success)]">{prepChecklist.size}/{PREP_CHECKLIST.length} étapes complétées</p>
            </section>

            <section className="rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-surface-secondary)] p-5 shadow-[var(--shadow-md)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-reward)]">Rappel</p>
              <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
                La préparation utile ne cherche pas à tout écrire. Elle cherche à sécuriser les mouvements du texte, deux ou trois procédés décisifs et une réponse propre à la grammaire.
              </p>
              <Link
                href={oralTutorHref}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--c-primary)] transition-colors hover:text-[var(--c-success)]"
              >
                Débloquer un point avant le passage
              </Link>
            </section>
          </aside>
        </div>
      )}

      {wizardPhase === 'PASSAGE' && session && currentStep && (
        <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
          <section className="rounded-[24px] border border-[var(--border-default)] bg-[linear-gradient(180deg,var(--bg-surface)_0%,var(--bg-surface-secondary)_100%)] p-6 shadow-[var(--shadow-md)] md:p-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-reward)]">Passage oral</p>
                <h2 className="font-display mt-2 text-3xl leading-tight tracking-[-0.02em] text-[var(--c-primary)]">
                  {STEP_GUIDANCE[currentStep].title}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-secondary)]">{STEP_GUIDANCE[currentStep].body}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {isSimulation && (
                  <span className={`inline-flex items-center gap-2 rounded-[16px] border px-4 py-3 font-mono text-lg font-semibold ${timerTone(passageRemaining)}`} role="timer" aria-live="polite" aria-label={`Temps restant passage : ${formatTimer(passageRemaining)}`}>
                    <Clock className="h-5 w-5" />
                    {formatTimer(passageRemaining)}
                  </span>
                )}
                {isSimulation && (
                  <span className="rounded-[16px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-xs font-mono text-[var(--text-muted)]">
                    {formatTimer(phaseRemaining)} phase
                  </span>
                )}
                {!isSimulation && (
                  <span className="inline-flex items-center gap-2 rounded-[16px] border border-[var(--border-success)] bg-[var(--bg-success)] px-4 py-3 text-sm font-medium text-[var(--c-success)]">
                    <Zap className="h-4 w-4" />
                    Mode libre
                  </span>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-4">
              {STEPS.map((stepName, index) => {
                const complete = index < currentStepIndex;
                const active = index === currentStepIndex;
                return (
                  <div
                    key={stepName}
                    className={`rounded-[22px] border px-4 py-4 text-center ${active ? 'border-[var(--c-primary)]/18 bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]' : complete ? 'border-[var(--border-success)] bg-[var(--bg-success)]' : 'border-[var(--border-default)] bg-[var(--bg-surface)]'}`}
                  >
                    <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${active ? 'bg-[var(--c-primary)] text-[var(--text-on-primary)]' : complete ? 'bg-[var(--c-success)]/10 text-[var(--c-success)]' : 'bg-[var(--bg-surface)] text-[var(--text-muted)]'}`}>
                      {complete ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                    </div>
                    <p className={`mt-3 text-xs font-semibold uppercase tracking-[0.14em] ${active ? 'text-[var(--c-primary)]' : 'text-[var(--text-body)]'}`}>{STEP_LABELS[stepName]}</p>
                  </div>
                );
              })}
            </div>

            <details className="mt-6 rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 shadow-[var(--shadow-md)]">
              <summary className="cursor-pointer text-sm font-semibold text-[var(--c-primary)]">Extrait & question de grammaire</summary>
              <p className="mt-3 font-serif text-sm leading-7 text-[var(--c-primary)]">{session.texte}</p>
              <div className="mt-3 space-y-2 text-sm leading-7 text-[var(--text-body)]">
                <p><span className="font-semibold text-[var(--c-primary)]">Grammaire :</span> {session.questionGrammaire}</p>
                {session.phraseGrammaire && <p><span className="font-semibold text-[var(--c-primary)]">Phrase cible :</span> {session.phraseGrammaire}</p>}
                {session.oeuvreChoisie && <p><span className="font-semibold text-[var(--c-primary)]">Entretien sur :</span> {session.oeuvreChoisie}</p>}
              </div>
            </details>

            <div className="mt-6 space-y-5">
              <div className="flex flex-col items-center rounded-[24px] border border-[var(--border-success)] bg-[var(--bg-success)] px-5 py-6 text-center">
                {!isMicOn ? (
                  <>
                    <button onClick={toggleMic} className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--c-primary)] text-[var(--text-on-primary)] shadow-[var(--shadow-md)] transition hover:bg-[var(--c-primary-active)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-success)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-success)]">
                      <Mic className="h-9 w-9" />
                    </button>
                    <p className="mt-4 text-sm font-semibold text-[var(--c-primary)]">Clique pour enregistrer — {STEP_LABELS[currentStep]}</p>
                  </>
                ) : (
                  <>
                    <div className="relative flex h-24 w-24 items-center justify-center">
                      <div className="absolute inset-0 animate-ping rounded-full bg-[var(--c-accent-text)] opacity-20" />
                      <button onClick={toggleMic} className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--c-accent-text)] text-[var(--text-on-primary)] shadow-[var(--shadow-md)] transition hover:bg-[var(--c-accent-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--c-accent-text)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-success)]">
                        <Square className="h-8 w-8" fill="currentColor" />
                      </button>
                    </div>
                    <p className="mt-4 text-sm font-bold text-[var(--c-accent-text)]">Enregistrement en cours...</p>
                  </>
                )}
              </div>

              <div>
                <label htmlFor="oral-transcript" className="mb-2 block text-sm font-semibold text-[var(--c-primary)]">
                  Transcription / réponse
                </label>
                <textarea
                  id="oral-transcript"
                  value={transcript}
                  onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setTranscript(event.target.value)}
                  className="min-h-40 w-full rounded-[var(--radius-xl)] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-4 text-sm leading-7 text-[var(--c-primary)] outline-none transition-all duration-[var(--transition-normal)] placeholder:text-[var(--text-muted)] focus-visible:border-[var(--c-success)] focus-visible:ring-2 focus-visible:ring-[var(--c-success)]/20"
                  placeholder="Le transcript micro apparaît ici, tu peux le corriger avant envoi..."
                />
              </div>

              {currentStep === 'ENTRETIEN' && (
                <div className="rounded-[24px] border border-[var(--border-success)] bg-[var(--bg-success)] p-5">
                  <p className="text-sm font-semibold text-[var(--c-primary)]">Simulation examinateur dialoguant</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(['BIENVEILLANT', 'NEUTRE', 'HOSTILE'] as ExaminerProfile[]).map((profile) => (
                      <button
                        key={profile}
                        type="button"
                        onClick={() => setExaminerProfile(profile)}
                        className={`rounded-[var(--radius-lg)] border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-all duration-[var(--transition-normal)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--c-success)] ${examinerProfile === profile ? 'border-[var(--c-primary)] bg-[var(--c-primary)] text-[var(--text-on-primary)]' : 'border-[var(--border-success)] bg-[var(--bg-surface)] text-[var(--c-primary)]'}`}
                      >
                        {profile}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={askExaminerFollowUp}
                    disabled={isJuryLoading || transcript.trim().length === 0}
                    className="mt-4 inline-flex items-center gap-2 rounded-[var(--radius-lg)] border border-[var(--border-success)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm font-medium text-[var(--c-primary)] transition-all duration-[var(--transition-normal)] hover:border-[var(--c-primary)]/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--c-success)] disabled:opacity-50"
                  >
                    {isJuryLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Headphones className="h-4 w-4" />}
                    Obtenir une relance examinateur
                  </button>

                  {juryTurns.length > 0 && (
                    <div className="mt-4 max-h-52 space-y-2 overflow-auto rounded-[16px] border border-[var(--border-success)] bg-[var(--bg-surface)] p-4">
                      {juryTurns.slice(-6).map((turn, idx) => (
                        <p key={`${turn.role}-${idx}`} className="text-sm leading-7 text-[var(--text-body)]">
                          <span className="font-semibold text-[var(--c-primary)]">{turn.role === 'jury' ? 'Examinateur' : 'Toi'} :</span> {turn.role === 'jury' ? sanitizeLlmText(turn.content) : turn.content}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={submitStep}
                  disabled={isLoading || transcript.trim().length === 0}
                  variant="primary"
                  size="md"
                  loading={isLoading}
                  icon={!isLoading ? <Play className="h-4 w-4" /> : undefined}
                >
                  Soumettre — {STEP_LABELS[currentStep]}
                </Button>
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-[var(--text-placeholder)]">{useServerVoice ? 'Mode vocal serveur' : 'Mode vocal navigateur'}</p>
                  <p className="text-xs text-[var(--text-muted)]">{useServerVoice ? 'Ton audio est envoyé pour transcription (service IA) puis immédiatement supprimé. Seul le texte transcrit est conservé.' : "La reconnaissance vocale est assurée par ton navigateur. Aucun audio n'est envoyé à nos serveurs."}</p>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[24px] border border-[var(--border-success)] bg-[var(--bg-success)] p-5 shadow-[var(--shadow-md)]">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-success)]">Feedbacks intermédiaires</p>
                <span className="rounded-full bg-[var(--bg-surface)] px-3 py-1 text-xs font-semibold text-[var(--c-success)]">
                  {aggregated.totalScore.toFixed(1)} / {aggregated.totalMax.toFixed(1) || 20}
                </span>
              </div>

              <div className="mt-4 space-y-4" role="status" aria-live="polite">
                {STEPS.map((step) => {
                  const item = feedbacks[step];
                  if (!item) return null;
                  return (
                    <div key={step} className="rounded-[22px] border border-[var(--border-success)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-sm)]">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-[var(--c-primary)]">{STEP_LABELS[step]}</p>
                        <span className="rounded-full bg-[var(--c-primary)]/8 px-3 py-1 text-sm font-semibold text-[var(--c-primary)]">
                          {item.score}/{item.max}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-[var(--text-body)]">{sanitizeLlmText(item.feedback)}</p>

                      {item.points_forts.length > 0 && (
                        <div className="mt-4 rounded-[16px] border border-[var(--border-success)] bg-[var(--bg-success)] p-3">
                          <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-[var(--c-success)]">Points forts</p>
                          <ul className="space-y-1 text-xs leading-6 text-[var(--text-body)]">
                            {item.points_forts.map((point) => (
                              <li key={point} className="flex gap-2"><Star className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--c-success)]" /> <span>{sanitizeLlmText(point)}</span></li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {item.axes.length > 0 && (
                        <div className="mt-4 rounded-[16px] border border-[var(--border-reward)] bg-[var(--bg-reward)] p-3">
                          <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-[var(--c-reward)]">Axes d’amélioration</p>
                          <ul className="space-y-1 text-xs leading-6 text-[var(--text-reward-on-subtle)]">
                            {item.axes.map((axis) => (
                              <li key={axis} className="flex gap-2"><AlertCircle className="mt-1 h-3.5 w-3.5 shrink-0 text-[var(--c-reward)]" /> <span>{sanitizeLlmText(axis)}</span></li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button onClick={() => speakText(item.feedback)} className="inline-flex items-center gap-1.5 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface-secondary)] px-3 py-2 text-xs font-medium text-[var(--c-primary)] transition-all duration-[var(--transition-normal)] hover:border-[var(--c-primary)]/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--c-success)]">
                          <Volume2 className="h-3.5 w-3.5" />
                          Écouter
                        </button>
                        {item.relance && <span className="text-xs font-medium text-[var(--c-success)]">Relance de l’examinateur : {sanitizeLlmText(item.relance)}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-surface-secondary)] p-5 shadow-[var(--shadow-md)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-reward)]">Principe de séance</p>
              <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
                Mieux vaut quatre prises de parole nettes avec un vrai retour intermédiaire qu’une longue réponse confuse. L’espace oral est conçu pour rendre cette discipline plus facile.
              </p>
              <Link
                href={oralTutorHref}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--c-primary)] transition-colors hover:text-[var(--c-success)]"
              >
                Reprendre cette phase avec le guidage
              </Link>
            </section>
          </aside>
        </div>
      )}

      {wizardPhase === 'BILAN' && bilan && (
        <section className="rounded-[24px] border border-[var(--border-default)] bg-[linear-gradient(180deg,var(--bg-surface)_0%,var(--bg-surface-secondary)_100%)] p-6 shadow-[var(--shadow-md)] md:p-8">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg-success)] text-[var(--c-success)] shadow-[var(--shadow-md)]">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-reward)]">Bilan officiel</p>
            <h2 className="font-display mt-2 text-4xl leading-tight tracking-[-0.02em] text-[var(--c-primary)]">
              {bilan.note}/{bilan.maxNote}
            </h2>
            <span className={`mt-4 inline-flex rounded-full px-4 py-2 text-sm font-semibold ${bilan.note >= 16 ? 'bg-[var(--bg-success)] text-[var(--c-success)]' : bilan.note >= 12 ? 'bg-[var(--bg-primary)] text-[var(--c-primary)]' : bilan.note >= 10 ? 'bg-[var(--bg-reward)] text-[var(--c-reward)]' : 'bg-[var(--c-accent-subtle)] text-[var(--c-accent-text)]'}`}>
              {bilan.mention}
            </span>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {([
              { key: 'lecture', label: 'Lecture', data: bilan.phases.lecture },
              { key: 'explication', label: 'Explication', data: bilan.phases.explication },
              { key: 'grammaire', label: 'Grammaire', data: bilan.phases.grammaire },
              { key: 'entretien', label: 'Entretien', data: bilan.phases.entretien },
            ] as const).map(({ key, label, data }) => (
              <div key={key} className="rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 text-center shadow-[var(--shadow-sm)]">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-body)]">{label}</p>
                <p className="mt-3 text-3xl font-semibold text-[var(--c-primary)]">
                  {data.note}
                  <span className="text-sm text-[var(--text-icon)]">/{data.max}</span>
                </p>
                <p className="mt-3 text-xs leading-6 text-[var(--text-secondary)]">{sanitizeLlmText(data.commentaire)}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[24px] border border-[var(--border-success)] bg-[var(--bg-success)] p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-success)]">Bilan global</p>
              <p className="mt-3 text-sm leading-7 text-[var(--text-body)]">{sanitizeLlmText(bilan.bilan_global)}</p>
            </div>
            <div className="rounded-[24px] border border-[var(--border-reward)] bg-[var(--bg-reward)] p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-reward)]">Conseil final</p>
              <p className="mt-3 text-sm leading-7 text-[var(--text-reward-on-subtle)]">{sanitizeLlmText(bilan.conseil_final)}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              onClick={resetAll}
              variant="primary"
              size="md"
            >
              Nouvelle simulation
            </Button>
            <Link
              href={oralTutorHref}
              className="inline-flex items-center justify-center rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-6 py-3 text-sm font-semibold text-[var(--c-primary)] transition-all duration-[var(--transition-normal)] hover:border-[var(--c-success)] hover:text-[var(--c-success)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--c-success)]"
            >
              Débriefer cette simulation
            </Link>
          </div>
        </section>
      )}

      <div className="fixed bottom-24 right-6 z-50 space-y-2 md:bottom-6">
        {badgeToasts.map((badge) => (
          <div
            key={badge}
            className="rounded-[16px] border border-[var(--border-success)] bg-[var(--bg-success)] px-4 py-3 text-sm font-medium text-[var(--c-success)] shadow-[var(--shadow-md)]"
            role="status"
            aria-live="polite"
          >
            Badge débloqué : {badge}
          </div>
        ))}
      </div>
    </div>
  );
}
