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
import { createBrowserStt } from '@/lib/stt/browser';
import { getCsrfTokenFromDocument } from '@/lib/security/csrf-client';

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

const EDITORIAL_HEADING = {
  fontFamily: "'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, serif",
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
    body: 'Réponds nettement, repars de l œuvre choisie et garde une logique de dialogue plutôt qu une mini dissertation flottante.',
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
  { id: 'contexte', label: "Identifier le contexte de l'extrait (auteur, œuvre, mouvement)" },
  { id: 'mouvement', label: "Repérer les mouvements du texte et l'articulation des parties" },
  { id: 'problematique', label: 'Formuler une problématique d analyse' },
  { id: 'procedes', label: 'Relever les procédés clés + citations à commenter' },
  { id: 'grammaire', label: 'Anticiper la question de grammaire (nature, fonction, analyse)' },
];

const OEUVRES_PROGRAMME_2025_2026 = [
  'Cahier de Douai — Arthur Rimbaud',
  'La rage de l expression — Francis Ponge',
  'Mes forets — Helene Dorion',
  'Discours de la servitude volontaire — Etienne de La Boetie',
  'Entretiens sur la pluralite des mondes — Fontenelle',
  'Lettres d une Peruvienne — Francoise de Graffigny',
  'Le Menteur — Pierre Corneille',
  'On ne badine pas avec l amour — Alfred de Musset',
  'Pour un oui ou pour un non — Nathalie Sarraute',
  'Manon Lescaut — Abbe Prevost',
  'La Peau de chagrin — Honore de Balzac',
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
  if (remaining <= 120) return 'border-[#f2c7bf] bg-[#fff0ed] text-[#c44f3c]';
  if (remaining <= 600) return 'border-[#efd9b4] bg-[#fff7ea] text-[#af7a20]';
  return 'border-[#cde5de] bg-[#edf7f3] text-[#0f766e]';
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
  const [badgeToasts, setBadgeToasts] = useState<string[]>([]);
  const [examinerProfile, setExaminerProfile] = useState<ExaminerProfile>('NEUTRE');
  const [juryTurns, setJuryTurns] = useState<JuryTurn[]>([]);
  const [isJuryLoading, setIsJuryLoading] = useState(false);

  const stepStartRef = useRef<number>(Date.now());
  const sttRef = useRef<ReturnType<typeof createBrowserStt> | null>(null);

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
    sttRef.current = createBrowserStt();
    sttRef.current?.onResult((text: string) => setTranscript(text));
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

  const toggleMic = useCallback(() => {
    if (!sttRef.current) return;
    if (isMicOn) {
      sttRef.current.stop();
      setIsMicOn(false);
      return;
    }
    sttRef.current.start();
    setIsMicOn(true);
  }, [isMicOn]);

  const submitStep = useCallback(async () => {
    if (!session || !currentStep || transcript.trim().length === 0) return;
    setIsLoading(true);
    setError(null);
    try {
      const duration = Math.max(1, Math.floor((Date.now() - stepStartRef.current) / 1000));
      const response = await fetch(`/api/v1/oral/session/${session.sessionId}/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': getCsrfTokenFromDocument() },
        body: JSON.stringify({ step: currentStep, transcript, duration }),
      });
      if (!response.ok) throw new Error("Échec de l'analyse de la prestation.");
      const payload = (await response.json()) as StepFeedback;
      setFeedbacks((prev) => ({ ...prev, [currentStep]: payload }));
      if (currentStep === 'ENTRETIEN' && payload.relance) speakText(payload.relance);

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
        sttRef.current?.stop();
        setIsMicOn(false);
      }
    }
  }, [currentStep, currentStepIndex, isMicOn, prepNotes, session, transcript]);

  const askExaminerFollowUp = useCallback(async () => {
    if (!session || currentStep !== 'ENTRETIEN' || transcript.trim().length === 0) {
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
          message: transcript,
          oeuvreChoisie: session.oeuvreChoisie,
          examinerProfile,
          conversationHistory: juryTurns,
        }),
      });
      if (!response.ok) {
        throw new Error('Impossible de générer une relance examinateur.');
      }
      const payload = (await response.json()) as { juryText: string };
      setJuryTurns((prev) => [
        ...prev,
        { role: 'eleve', content: transcript },
        { role: 'jury', content: payload.juryText },
      ]);
      speakText(payload.juryText);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erreur inconnue.');
    } finally {
      setIsJuryLoading(false);
    }
  }, [currentStep, examinerProfile, juryTurns, session, transcript]);

  const resetAll = useCallback(() => {
    setSession(null);
    setBilan(null);
    setWizardPhase('TIRAGE');
    setExaminerProfile('NEUTRE');
    setJuryTurns([]);
    setTranscript('');
    setPrepNotes('');
    setPrepChecklist(new Set());
    setCurrentStepIndex(0);
    setError(null);
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[#17324d] px-6 py-7 text-[#f7f2ea] shadow-[0_32px_90px_rgba(23,50,77,0.22)] md:px-8 md:py-8 lg:px-10 lg:py-10">
        <div className="absolute inset-y-0 right-[-10%] hidden w-[42%] rounded-full bg-[radial-gradient(circle_at_center,_rgba(126,212,194,0.24),_transparent_72%)] blur-2xl lg:block" />
        <div className="absolute left-[-5%] top-[-20%] h-44 w-44 rounded-full bg-[rgba(216,163,99,0.16)] blur-3xl" />

        <div className="relative grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[#d7c4aa]">
              <BookOpen className="h-4 w-4" />
              Oral EAF
            </div>
            <h1 style={EDITORIAL_HEADING} className="mt-5 max-w-4xl text-4xl leading-tight tracking-[-0.03em] text-white md:text-5xl lg:text-6xl">
              Une simulation officielle pensée comme un cockpit d entraînement, pas comme un outil brut.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#dfe8f0] md:text-base">
              Tirage, préparation, passage puis bilan. Tout est réuni dans un seul espace pour te garder concentré sur la qualité de ta prise de parole, la precision des attendus officiels et les points a retravailler la seance suivante.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {[
              { label: 'Préparation', value: isSimulation ? '30 min' : 'Libre' },
              { label: 'Passage', value: isSimulation ? '20 min' : 'Libre' },
              { label: 'Barème', value: '2 + 8 + 2 + 8' },
            ].map((item) => (
              <div key={item.label} className="rounded-[24px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d7c4aa]">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <div data-testid="error-alert" className="rounded-[24px] border border-[#f0c7bf] bg-[#fff0ed] px-5 py-4 text-sm text-[#c44f3c]" role="alert">
          {error}
        </div>
      )}

      {session && (
        <section className="rounded-[26px] border border-[#e7dac6] bg-[#fffaf4] px-5 py-4 shadow-[0_14px_35px_rgba(23,50,77,0.05)]">
          <div className="flex flex-wrap items-center gap-3">
            {(['TIRAGE', 'PREP', 'PASSAGE', 'BILAN'] as WizardPhase[]).map((phase) => {
              const active = wizardPhase === phase;
              return (
                <span
                  key={phase}
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${active ? 'bg-[#17324d] text-white' : 'border border-[#dfd1bc] bg-white text-[#6d7e8d]'}`}
                >
                  {phase === 'TIRAGE' ? 'Tirage' : phase === 'PREP' ? "Prépa 30'" : phase === 'PASSAGE' ? "Passage 20'" : 'Bilan'}
                </span>
              );
            })}
          </div>
        </section>
      )}

      {wizardPhase === 'TIRAGE' && !session && (
        <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
          <section className="rounded-[30px] border border-[#e7dac6] bg-[linear-gradient(180deg,#fffdfa_0%,#fbf5ec_100%)] p-6 shadow-[0_20px_70px_rgba(23,50,77,0.08)] md:p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#17324d]/8 text-[#17324d]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#9a6a37]">Démarrage</p>
                <h2 style={EDITORIAL_HEADING} className="mt-2 text-3xl leading-tight tracking-[-0.02em] text-[#17324d]">
                  Tirage au sort de l extrait
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5d7287]">
                  Choisis ton œuvre et le niveau de contrainte. La plateforme tire l extrait, la question de grammaire puis t installe directement dans le rythme de l épreuve.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setMode('SIMULATION')}
                data-testid="mode-simulation-btn"
                className={`inline-flex items-center gap-2 rounded-[18px] px-4 py-3 text-sm font-semibold transition ${mode === 'SIMULATION' ? 'bg-[#17324d] text-white' : 'border border-[#dfd1bc] bg-white text-[#17324d]'}`}
                aria-pressed={mode === 'SIMULATION'}
              >
                <Shield className="h-4 w-4" />
                Simulation examen
              </button>
              <button
                onClick={() => setMode('FREE_PRACTICE')}
                data-testid="mode-practice-btn"
                className={`inline-flex items-center gap-2 rounded-[18px] px-4 py-3 text-sm font-semibold transition ${mode === 'FREE_PRACTICE' ? 'bg-[#0f766e] text-white' : 'border border-[#dfd1bc] bg-white text-[#17324d]'}`}
                aria-pressed={mode === 'FREE_PRACTICE'}
              >
                <Zap className="h-4 w-4" />
                Entraînement libre
              </button>
            </div>

            {mode === 'FREE_PRACTICE' && (
              <p className="mt-4 rounded-[18px] border border-[#d8e8e3] bg-[#edf7f3] px-4 py-3 text-sm text-[#0f766e]">
                Mode libre : les timers sont désactivés, tu peux prendre ton temps.
              </p>
            )}

            <div className="mt-6 max-w-xl">
              <label htmlFor="oeuvre-select" className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-[#7a6858]">
                Œuvre du programme
              </label>
              <select
                id="oeuvre-select"
                data-testid="oeuvre-select"
                className="w-full rounded-[18px] border border-[#dfd1bc] bg-white px-4 py-3 text-sm text-[#17324d] outline-none transition focus:border-[#17324d]/20 focus:ring-2 focus:ring-[#17324d]/8"
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

            <button
              data-testid="start-session-btn"
              onClick={startSession}
              disabled={isLoading}
              className="mt-6 inline-flex items-center gap-2 rounded-[20px] bg-[#17324d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#244a6d] disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Tirer un extrait
            </button>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[28px] border border-[#d8e8e3] bg-[#edf7f3] p-5 shadow-[0_18px_55px_rgba(15,118,110,0.08)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#0f766e]">Ce qui va suivre</p>
              <div className="mt-4 space-y-3">
                {[
                  'Préparation structurée de 30 minutes avec notes personnelles.',
                  'Passage en quatre temps : lecture, explication, grammaire, entretien.',
                  'Bilan final /20 avec conseil concret pour la prochaine séance.',
                ].map((item, index) => (
                  <div key={item} className="rounded-[20px] border border-[#d3e7e1] bg-white/88 px-4 py-4 text-sm leading-7 text-[#33536f]">
                    <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0f766e]/10 text-xs font-semibold text-[#0f766e]">{index + 1}</span>
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[28px] border border-[#e7dac6] bg-[#f8f1e7] p-5 shadow-[0_18px_55px_rgba(122,75,36,0.08)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#9a6a37]">Usage premium</p>
              <p className="mt-4 text-sm leading-7 text-[#5d7287]">
                Une bonne simulation orale ne cherche pas à parler beaucoup. Elle cherche à rendre la parole plus nette, plus articulée et plus défendable étape après étape.
              </p>
              <Link
                href={oralTutorHref}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#17324d] transition-colors hover:text-[#0f766e]"
              >
                Préparer cette œuvre avec le guidage
              </Link>
            </section>
          </aside>
        </div>
      )}

      {wizardPhase === 'PREP' && session && (
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <section className="rounded-[30px] border border-[#e7dac6] bg-[linear-gradient(180deg,#fffdfa_0%,#fbf5ec_100%)] p-6 shadow-[0_20px_70px_rgba(23,50,77,0.08)] md:p-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#9a6a37]">Préparation</p>
                <h2 style={EDITORIAL_HEADING} className="mt-2 text-3xl leading-tight tracking-[-0.02em] text-[#17324d]">
                  Préparation
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5d7287]">
                  Lis, structure, choisis tes procédés et prépare la grammaire. Les notes restent un brouillon de travail, pas un objet évalué.
                </p>
              </div>
              {isSimulation ? (
                <div className={`inline-flex items-center gap-2 rounded-[18px] border px-4 py-3 font-mono text-lg font-semibold ${timerTone(prepRemaining)}`} role="timer" aria-live="polite" aria-label={`Temps restant : ${formatTimer(prepRemaining)}`}>
                  <Clock className="h-5 w-5" />
                  {formatTimer(prepRemaining)}
                </div>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-[18px] border border-[#d8e8e3] bg-[#edf7f3] px-4 py-3 text-sm font-medium text-[#0f766e]">
                  <Zap className="h-4 w-4" />
                  Mode libre
                </span>
              )}
            </div>

            <div className="mt-6 rounded-[24px] border border-[#eadbc5] bg-white p-5 shadow-[0_12px_30px_rgba(23,50,77,0.05)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#9a6a37]">Extrait tiré</p>
              <p data-testid="extrait-texte" className="mt-4 font-serif text-base leading-8 text-[#17324d]">{session.texte}</p>
              <div className="mt-5 space-y-2 text-sm leading-7 text-[#33536f]">
                <p><span className="font-semibold text-[#17324d]">Question de grammaire :</span> {session.questionGrammaire}</p>
                {session.phraseGrammaire && (
                  <p><span className="font-semibold text-[#17324d]">Phrase cible :</span> {session.phraseGrammaire}</p>
                )}
                {session.oeuvreChoisie && (
                  <p><span className="font-semibold text-[#17324d]">Œuvre choisie (entretien) :</span> {session.oeuvreChoisie}</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <label htmlFor="prep-notes" className="mb-2 block text-sm font-semibold text-[#17324d]">
                Notes de préparation (brouillon — non évaluées)
              </label>
              <textarea
                id="prep-notes"
                value={prepNotes}
                onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setPrepNotes(event.target.value)}
                className="min-h-60 w-full rounded-[24px] border border-[#dfd1bc] bg-white px-4 py-4 text-sm leading-7 text-[#17324d] outline-none transition placeholder:text-[#8b95a1] focus:border-[#17324d]/20 focus:ring-2 focus:ring-[#17324d]/8"
                placeholder="Structure ton explication linéaire, prépare tes axes, note les procédés..."
              />
            </div>

            <button
              onClick={startPassage}
              className="mt-6 inline-flex items-center gap-2 rounded-[20px] bg-[#17324d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#244a6d]"
            >
              <Play className="h-4 w-4" />
              Commencer le passage (20 min)
            </button>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[28px] border border-[#d8e8e3] bg-[#edf7f3] p-5 shadow-[0_18px_55px_rgba(15,118,110,0.08)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#0f766e]">Checklist de préparation</p>
              <div className="mt-4 space-y-3">
                {PREP_CHECKLIST.map((item) => (
                  <label key={item.id} className="flex cursor-pointer items-start gap-3 rounded-[20px] border border-[#d3e7e1] bg-white/88 px-4 py-4 text-sm leading-7 text-[#33536f]">
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
                      className="mt-1 h-4 w-4 rounded border-[#cfe2dc] text-[#0f766e] focus:ring-[#0f766e]"
                    />
                    <span className={prepChecklist.has(item.id) ? 'text-[#7f918d] line-through' : ''}>{item.label}</span>
                  </label>
                ))}
              </div>
              <p className="mt-4 text-sm font-medium text-[#0f766e]">{prepChecklist.size}/{PREP_CHECKLIST.length} étapes complétées</p>
            </section>

            <section className="rounded-[28px] border border-[#e7dac6] bg-[#f8f1e7] p-5 shadow-[0_18px_55px_rgba(122,75,36,0.08)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#9a6a37]">Rappel</p>
              <p className="mt-4 text-sm leading-7 text-[#5d7287]">
                La préparation utile ne cherche pas à tout écrire. Elle cherche à sécuriser les mouvements du texte, deux ou trois procédés décisifs et une réponse propre à la grammaire.
              </p>
              <Link
                href={oralTutorHref}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#17324d] transition-colors hover:text-[#0f766e]"
              >
                Débloquer un point avant le passage
              </Link>
            </section>
          </aside>
        </div>
      )}

      {wizardPhase === 'PASSAGE' && session && currentStep && (
        <div className="grid gap-6 xl:grid-cols-[1.04fr_0.96fr]">
          <section className="rounded-[30px] border border-[#e7dac6] bg-[linear-gradient(180deg,#fffdfa_0%,#fbf5ec_100%)] p-6 shadow-[0_20px_70px_rgba(23,50,77,0.08)] md:p-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#9a6a37]">Passage oral</p>
                <h2 style={EDITORIAL_HEADING} className="mt-2 text-3xl leading-tight tracking-[-0.02em] text-[#17324d]">
                  {STEP_GUIDANCE[currentStep].title}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[#5d7287]">{STEP_GUIDANCE[currentStep].body}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {isSimulation && (
                  <span className={`inline-flex items-center gap-2 rounded-[18px] border px-4 py-3 font-mono text-lg font-semibold ${timerTone(passageRemaining)}`} role="timer" aria-live="polite" aria-label={`Temps restant passage : ${formatTimer(passageRemaining)}`}>
                    <Clock className="h-5 w-5" />
                    {formatTimer(passageRemaining)}
                  </span>
                )}
                {isSimulation && (
                  <span className="rounded-[16px] border border-[#dfd1bc] bg-white px-3 py-2 text-xs font-mono text-[#6d7e8d]">
                    {formatTimer(phaseRemaining)} phase
                  </span>
                )}
                {!isSimulation && (
                  <span className="inline-flex items-center gap-2 rounded-[18px] border border-[#d8e8e3] bg-[#edf7f3] px-4 py-3 text-sm font-medium text-[#0f766e]">
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
                    className={`rounded-[22px] border px-4 py-4 text-center ${active ? 'border-[#17324d]/18 bg-white shadow-[0_12px_24px_rgba(23,50,77,0.06)]' : complete ? 'border-[#d8e8e3] bg-[#edf7f3]' : 'border-[#e7dac6] bg-[#fbf5ec]'}`}
                  >
                    <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${active ? 'bg-[#17324d] text-white' : complete ? 'bg-[#0f766e]/10 text-[#0f766e]' : 'bg-white text-[#6d7e8d]'}`}>
                      {complete ? <CheckCircle2 className="h-5 w-5" /> : index + 1}
                    </div>
                    <p className={`mt-3 text-xs font-semibold uppercase tracking-[0.14em] ${active ? 'text-[#17324d]' : 'text-[#7a6858]'}`}>{STEP_LABELS[stepName]}</p>
                  </div>
                );
              })}
            </div>

            <details className="mt-6 rounded-[24px] border border-[#eadbc5] bg-white p-5 shadow-[0_12px_30px_rgba(23,50,77,0.05)]">
              <summary className="cursor-pointer text-sm font-semibold text-[#17324d]">Extrait & question de grammaire</summary>
              <p className="mt-3 font-serif text-sm leading-7 text-[#17324d]">{session.texte}</p>
              <div className="mt-3 space-y-2 text-sm leading-7 text-[#33536f]">
                <p><span className="font-semibold text-[#17324d]">Grammaire :</span> {session.questionGrammaire}</p>
                {session.phraseGrammaire && <p><span className="font-semibold text-[#17324d]">Phrase cible :</span> {session.phraseGrammaire}</p>}
                {session.oeuvreChoisie && <p><span className="font-semibold text-[#17324d]">Entretien sur :</span> {session.oeuvreChoisie}</p>}
              </div>
            </details>

            <div className="mt-6 space-y-5">
              <div className="flex flex-col items-center rounded-[26px] border border-[#d8e8e3] bg-[#edf7f3] px-5 py-6 text-center">
                {!isMicOn ? (
                  <>
                    <button onClick={toggleMic} className="flex h-20 w-20 items-center justify-center rounded-full bg-[#17324d] text-white shadow-[0_16px_34px_rgba(23,50,77,0.18)] transition hover:bg-[#244a6d]">
                      <Mic className="h-9 w-9" />
                    </button>
                    <p className="mt-4 text-sm font-semibold text-[#17324d]">Clique pour enregistrer — {STEP_LABELS[currentStep]}</p>
                  </>
                ) : (
                  <>
                    <div className="relative flex h-24 w-24 items-center justify-center">
                      <div className="absolute inset-0 animate-ping rounded-full bg-[#c44f3c] opacity-20" />
                      <button onClick={toggleMic} className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-[#c44f3c] text-white shadow-[0_16px_34px_rgba(196,79,60,0.22)] transition hover:bg-[#b33f30]">
                        <Square className="h-8 w-8" fill="currentColor" />
                      </button>
                    </div>
                    <p className="mt-4 text-sm font-bold text-[#c44f3c]">Enregistrement en cours...</p>
                  </>
                )}
              </div>

              <div>
                <label htmlFor="oral-transcript" className="mb-2 block text-sm font-semibold text-[#17324d]">
                  Transcription / réponse
                </label>
                <textarea
                  id="oral-transcript"
                  value={transcript}
                  onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setTranscript(event.target.value)}
                  className="min-h-40 w-full rounded-[24px] border border-[#dfd1bc] bg-white px-4 py-4 text-sm leading-7 text-[#17324d] outline-none transition placeholder:text-[#8b95a1] focus:border-[#17324d]/20 focus:ring-2 focus:ring-[#17324d]/8"
                  placeholder="Le transcript micro apparaît ici, vous pouvez le corriger avant envoi..."
                />
              </div>

              {currentStep === 'ENTRETIEN' && (
                <div className="rounded-[24px] border border-[#d8e8e3] bg-[#edf7f3] p-5">
                  <p className="text-sm font-semibold text-[#17324d]">Simulation examinateur dialoguant</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(['BIENVEILLANT', 'NEUTRE', 'HOSTILE'] as ExaminerProfile[]).map((profile) => (
                      <button
                        key={profile}
                        type="button"
                        onClick={() => setExaminerProfile(profile)}
                        className={`rounded-[16px] border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${examinerProfile === profile ? 'border-[#17324d] bg-[#17324d] text-white' : 'border-[#cfe2dc] bg-white text-[#17324d]'}`}
                      >
                        {profile}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={askExaminerFollowUp}
                    disabled={isJuryLoading || transcript.trim().length === 0}
                    className="mt-4 inline-flex items-center gap-2 rounded-[18px] border border-[#cfe2dc] bg-white px-4 py-2.5 text-sm font-medium text-[#17324d] transition hover:border-[#17324d]/18 disabled:opacity-50"
                  >
                    {isJuryLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Headphones className="h-4 w-4" />}
                    Obtenir une relance examinateur
                  </button>

                  {juryTurns.length > 0 && (
                    <div className="mt-4 max-h-52 space-y-2 overflow-auto rounded-[20px] border border-[#d3e7e1] bg-white p-4">
                      {juryTurns.slice(-6).map((turn, idx) => (
                        <p key={`${turn.role}-${idx}`} className="text-sm leading-7 text-[#33536f]">
                          <span className="font-semibold text-[#17324d]">{turn.role === 'jury' ? 'Examinateur' : 'Vous'} :</span> {turn.content}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={submitStep}
                  disabled={isLoading || transcript.trim().length === 0}
                  className="inline-flex items-center gap-2 rounded-[20px] bg-[#17324d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#244a6d] disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  Soumettre — {STEP_LABELS[currentStep]}
                </button>
                <p className="text-xs text-[#6d7e8d]">Votre voix est traitée localement. Aucun audio n est envoyé à nos serveurs.</p>
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[28px] border border-[#d8e8e3] bg-[#edf7f3] p-5 shadow-[0_18px_55px_rgba(15,118,110,0.08)]">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#0f766e]">Feedbacks intermédiaires</p>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#0f766e]">
                  {aggregated.totalScore.toFixed(1)} / {aggregated.totalMax.toFixed(1) || 20}
                </span>
              </div>

              <div className="mt-4 space-y-4" role="status" aria-live="polite">
                {STEPS.map((step) => {
                  const item = feedbacks[step];
                  if (!item) return null;
                  return (
                    <div key={step} className="rounded-[22px] border border-[#d3e7e1] bg-white p-4 shadow-[0_10px_24px_rgba(15,118,110,0.05)]">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-[#17324d]">{STEP_LABELS[step]}</p>
                        <span className="rounded-full bg-[#17324d]/8 px-3 py-1 text-sm font-semibold text-[#17324d]">
                          {item.score}/{item.max}
                        </span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-[#33536f]">{item.feedback}</p>

                      {item.points_forts.length > 0 && (
                        <div className="mt-4 rounded-[18px] border border-[#d3e7e1] bg-[#edf7f3] p-3">
                          <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-[#0f766e]">Points forts</p>
                          <ul className="space-y-1 text-xs leading-6 text-[#33536f]">
                            {item.points_forts.map((point) => (
                              <li key={point} className="flex gap-2"><Star className="mt-1 h-3.5 w-3.5 shrink-0 text-[#0f766e]" /> <span>{point}</span></li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {item.axes.length > 0 && (
                        <div className="mt-4 rounded-[18px] border border-[#efd9b4] bg-[#fff7ea] p-3">
                          <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-[#af7a20]">Axes d amélioration</p>
                          <ul className="space-y-1 text-xs leading-6 text-[#6b5735]">
                            {item.axes.map((axis) => (
                              <li key={axis} className="flex gap-2"><AlertCircle className="mt-1 h-3.5 w-3.5 shrink-0 text-[#af7a20]" /> <span>{axis}</span></li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button onClick={() => speakText(item.feedback)} className="inline-flex items-center gap-1.5 rounded-[16px] border border-[#dfd1bc] bg-[#fffaf4] px-3 py-2 text-xs font-medium text-[#17324d] transition hover:border-[#17324d]/18">
                          <Volume2 className="h-3.5 w-3.5" />
                          Écouter
                        </button>
                        {item.relance && <span className="text-xs font-medium text-[#0f766e]">Relance de l examinateur : {item.relance}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[28px] border border-[#e7dac6] bg-[#f8f1e7] p-5 shadow-[0_18px_55px_rgba(122,75,36,0.08)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#9a6a37]">Principe de séance</p>
              <p className="mt-4 text-sm leading-7 text-[#5d7287]">
                Mieux vaut quatre prises de parole nettes avec un vrai retour intermédiaire qu une longue réponse confuse. Le cockpit est conçu pour rendre cette discipline plus facile.
              </p>
              <Link
                href={oralTutorHref}
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#17324d] transition-colors hover:text-[#0f766e]"
              >
                Reprendre cette phase avec le guidage
              </Link>
            </section>
          </aside>
        </div>
      )}

      {wizardPhase === 'BILAN' && bilan && (
        <section className="rounded-[32px] border border-[#e7dac6] bg-[linear-gradient(180deg,#fffdfa_0%,#fbf5ec_100%)] p-6 shadow-[0_20px_70px_rgba(23,50,77,0.08)] md:p-8">
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#edf7f3] text-[#0f766e] shadow-[0_12px_28px_rgba(15,118,110,0.12)]">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.24em] text-[#9a6a37]">Bilan officiel</p>
            <h2 style={EDITORIAL_HEADING} className="mt-2 text-4xl leading-tight tracking-[-0.02em] text-[#17324d]">
              {bilan.note}/{bilan.maxNote}
            </h2>
            <span className={`mt-4 inline-flex rounded-full px-4 py-2 text-sm font-semibold ${bilan.note >= 16 ? 'bg-[#edf7f3] text-[#0f766e]' : bilan.note >= 12 ? 'bg-[#eef3f8] text-[#17324d]' : bilan.note >= 10 ? 'bg-[#fff7ea] text-[#af7a20]' : 'bg-[#fff0ed] text-[#c44f3c]'}`}>
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
              <div key={key} className="rounded-[24px] border border-[#eadbc5] bg-white p-4 text-center shadow-[0_10px_24px_rgba(23,50,77,0.05)]">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7a6858]">{label}</p>
                <p className="mt-3 text-3xl font-semibold text-[#17324d]">
                  {data.note}
                  <span className="text-sm text-[#7c8792]">/{data.max}</span>
                </p>
                <p className="mt-3 text-xs leading-6 text-[#5d7287]">{data.commentaire}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[24px] border border-[#d8e8e3] bg-[#edf7f3] p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#0f766e]">Bilan global</p>
              <p className="mt-3 text-sm leading-7 text-[#33536f]">{bilan.bilan_global}</p>
            </div>
            <div className="rounded-[24px] border border-[#efd9b4] bg-[#fff7ea] p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#af7a20]">Conseil final</p>
              <p className="mt-3 text-sm leading-7 text-[#6b5735]">{bilan.conseil_final}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              onClick={resetAll}
              className="inline-flex items-center gap-2 rounded-[20px] bg-[#17324d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#244a6d]"
            >
              Nouvelle simulation
            </button>
            <Link
              href={oralTutorHref}
              className="inline-flex items-center justify-center rounded-[20px] border border-[#d8ccb9] bg-white px-6 py-3 text-sm font-semibold text-[#17324d] transition hover:border-[#0f766e] hover:text-[#0f766e]"
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
            className="rounded-[18px] border border-[#d8e8e3] bg-[#edf7f3] px-4 py-3 text-sm font-medium text-[#0f766e] shadow-[0_16px_32px_rgba(15,118,110,0.12)]"
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
