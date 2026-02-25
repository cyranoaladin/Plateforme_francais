'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Mic, Play, Volume2, Loader2, CheckCircle2, Square, Headphones, Star, AlertCircle } from 'lucide-react';
import { createBrowserStt } from '@/lib/stt/browser';
import { getCsrfTokenFromDocument } from '@/lib/security/csrf-client';

type OralStep = 'LECTURE' | 'EXPLICATION' | 'GRAMMAIRE' | 'ENTRETIEN';

type SessionPayload = {
  sessionId: string;
  texte: string;
  questionGrammaire: string;
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

const STEPS: OralStep[] = ['LECTURE', 'EXPLICATION', 'GRAMMAIRE', 'ENTRETIEN'];
const STEP_LABELS: Record<OralStep, string> = {
  LECTURE: 'Lecture (2min)',
  EXPLICATION: 'Explication (8min)',
  GRAMMAIRE: 'Grammaire (2min)',
  ENTRETIEN: 'Entretien (8min)',
};

function speakText(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'fr-FR';

  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find((voice) =>
    voice.lang.toLowerCase().startsWith('fr') && voice.name.toLowerCase().includes('google'),
  );

  if (preferred) {
    utterance.voice = preferred;
  }

  window.speechSynthesis.speak(utterance);
}

export default function AtelierOralPage() {
  const [oeuvre, setOeuvre] = useState('Le Mariage forcé');
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [isMicOn, setIsMicOn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbacks, setFeedbacks] = useState<Record<OralStep, StepFeedback | undefined>>({
    LECTURE: undefined,
    EXPLICATION: undefined,
    GRAMMAIRE: undefined,
    ENTRETIEN: undefined,
  });
  const [finalResult, setFinalResult] = useState<{ note: number; bilan: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [badgeToasts, setBadgeToasts] = useState<string[]>([]);

  const stepStartRef = useRef<number>(Date.now());
  const sttRef = useRef<ReturnType<typeof createBrowserStt> | null>(null);

  const currentStep = STEPS[currentStepIndex] ?? null;

  useEffect(() => {
    sttRef.current = createBrowserStt();
    sttRef.current?.onResult((text) => setTranscript(text));
  }, []);

  const aggregated = useMemo(() => {
    const list = STEPS.map((step) => feedbacks[step]).filter(Boolean) as StepFeedback[];
    const totalScore = list.reduce((sum, item) => sum + item.score, 0);
    const totalMax = list.reduce((sum, item) => sum + item.max, 0);
    return { totalScore, totalMax };
  }, [feedbacks]);

  const startSession = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/oral/session/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfTokenFromDocument(),
        },
        body: JSON.stringify({ oeuvre }),
      });

      if (!response.ok) {
        throw new Error('Impossible de démarrer la session orale.');
      }

      const payload = (await response.json()) as SessionPayload;
      setSession(payload);
      setCurrentStepIndex(0);
      setTranscript('');
      setFinalResult(null);
      setFeedbacks({ LECTURE: undefined, EXPLICATION: undefined, GRAMMAIRE: undefined, ENTRETIEN: undefined });
      stepStartRef.current = Date.now();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Erreur inconnue.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMic = () => {
    if (!sttRef.current) {
      return;
    }

    if (isMicOn) {
      sttRef.current.stop();
      setIsMicOn(false);
      return;
    }

    sttRef.current.start();
    setIsMicOn(true);
  };

  const submitStep = async () => {
    if (!session || !currentStep || transcript.trim().length === 0) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const duration = Math.max(1, Math.floor((Date.now() - stepStartRef.current) / 1000));
      const response = await fetch(`/api/v1/oral/session/${session.sessionId}/interact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfTokenFromDocument(),
        },
        body: JSON.stringify({
          step: currentStep,
          transcript,
          duration,
        }),
      });

      if (!response.ok) {
        throw new Error('Échec de l\'analyse IA.');
      }

      const payload = (await response.json()) as StepFeedback;
      setFeedbacks((prev) => ({ ...prev, [currentStep]: payload }));

      if (currentStep === 'ENTRETIEN' && payload.relance) {
        speakText(payload.relance);
      }

      if (currentStepIndex < STEPS.length - 1) {
        setCurrentStepIndex((prev) => prev + 1);
        setTranscript('');
        stepStartRef.current = Date.now();
        return;
      }

      const endResponse = await fetch(`/api/v1/oral/session/${session.sessionId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfTokenFromDocument(),
        },
        body: JSON.stringify({}),
      });

      if (!endResponse.ok) {
        throw new Error('Échec de finalisation de la session.');
      }

      const endPayload = (await endResponse.json()) as { note: number; bilan: string; newBadges?: string[] };
      setFinalResult(endPayload);
      setCurrentStepIndex(STEPS.length);
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
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Atelier Oral (Simulateur)</h1>
        <p className="text-muted-foreground mt-2">Entraîne-toi en conditions réelles. L&apos;IA joue le rôle de l&apos;examinateur.</p>
      </header>

      {error && <div className="rounded-xl border border-error/30 bg-error/10 p-3 text-error text-sm" role="alert">{error}</div>}

      {/* ─── Session Start ─── */}
      {!session && (
        <section className="bg-card rounded-3xl border border-border p-8 md:p-10 shadow-sm text-center">
          <div className="w-20 h-20 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mic className="w-9 h-9" />
          </div>
          <h2 className="text-xl font-bold text-foreground mb-2">Prêt pour une simulation orale ?</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">Choisis ton oeuvre, puis démarre. L&apos;IA te guidera à travers les 4 phases de l&apos;épreuve.</p>
          <label htmlFor="oeuvre-select" className="sr-only">Choisir une oeuvre</label>
          <select id="oeuvre-select" className="border border-border rounded-xl bg-muted/30 px-4 py-3 mb-4 w-full max-w-sm mx-auto block text-foreground text-sm focus:ring-2 focus:ring-primary focus:outline-none" value={oeuvre} onChange={(event) => setOeuvre(event.target.value)}>
            <option>Le Mariage forcé</option>
            <option>La Surprise de l&apos;amour</option>
            <option>Déclaration des droits de la femme</option>
            <option>Les Contemplations</option>
            <option>Cahier de Douai</option>
            <option>Sido / Les Vrilles de la vigne</option>
            <option>Le Rouge et le Noir</option>
            <option>La Peau de chagrin</option>
            <option>La Peste</option>
          </select>
          <button onClick={startSession} disabled={isLoading} className="px-8 py-3 rounded-xl bg-purple-600 text-white font-bold inline-flex items-center gap-2 hover:bg-purple-700 transition-colors disabled:opacity-50 shadow-md">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Démarrer la simulation
          </button>
        </section>
      )}

      {/* ─── Active Session ─── */}
      {session && (
        <div className="bg-card rounded-3xl border border-border p-6 md:p-8 shadow-sm space-y-6">
          {/* Timeline */}
          <div className="flex justify-between items-center relative">
            <div className="absolute left-0 right-0 h-0.5 bg-border top-5 z-0" />
            {STEPS.map((stepName, i) => (
              <div key={stepName} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-all text-sm ${
                  i === currentStepIndex ? 'bg-purple-600 border-purple-600 text-white shadow-md' :
                  i < currentStepIndex ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-600 text-purple-600' : 'bg-card border-border text-muted-foreground'
                }`}>
                  {i < currentStepIndex ? <CheckCircle2 className="w-5 h-5" /> : i + 1}
                </div>
                <span className={`text-[10px] md:text-xs font-medium text-center ${i === currentStepIndex ? 'text-purple-600 dark:text-purple-400' : 'text-muted-foreground'}`}>
                  {STEP_LABELS[stepName]}
                </span>
              </div>
            ))}
          </div>

          {/* Extrait */}
          <div className="rounded-2xl border border-border bg-muted/20 p-5 shadow-inner">
            <p className="font-bold text-foreground text-sm mb-2">Extrait</p>
            <p className="font-serif text-base leading-relaxed text-foreground">{session.texte}</p>
            <p className="text-sm mt-3 text-muted-foreground"><span className="font-semibold text-foreground">Question de grammaire :</span> {session.questionGrammaire}</p>
          </div>

          {/* Current step input area */}
          {!finalResult && currentStep && (
            <div className="space-y-4">
              <div className="flex flex-col items-center text-center">
                {!isMicOn ? (
                  <>
                    <button onClick={toggleMic} className="w-20 h-20 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center hover:bg-purple-500/20 transition-colors mb-3">
                      <Mic className="w-9 h-9" />
                    </button>
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Clique pour enregistrer</p>
                  </>
                ) : (
                  <>
                    <div className="relative w-24 h-24 flex items-center justify-center mb-3">
                      <div className="absolute inset-0 bg-rose-500 rounded-full animate-ping opacity-20" />
                      <button onClick={toggleMic} className="relative z-10 w-20 h-20 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors">
                        <Square className="w-8 h-8" fill="currentColor" />
                      </button>
                    </div>
                    <p className="text-sm font-bold text-rose-500 animate-pulse">Enregistrement en cours...</p>
                  </>
                )}
              </div>

              <div>
                <label htmlFor="oral-transcript" className="sr-only">Transcription de votre réponse</label>
                <textarea
                  id="oral-transcript"
                  value={transcript}
                  onChange={(event) => setTranscript(event.target.value)}
                  className="w-full min-h-36 border border-border rounded-2xl bg-muted/20 p-4 text-sm text-foreground focus:ring-2 focus:ring-primary/50 focus:outline-none shadow-inner"
                  placeholder="Le transcript micro apparaît ici, vous pouvez le corriger avant envoi..."
                />
              </div>

              <div className="flex justify-center">
                <button onClick={submitStep} disabled={isLoading || transcript.trim().length === 0} className="px-6 py-3 rounded-xl bg-purple-600 text-white font-bold inline-flex items-center gap-2 disabled:opacity-50 hover:bg-purple-700 transition-colors shadow-md">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Soumettre l&apos;étape
                </button>
              </div>

              <p className="text-xs text-muted-foreground text-center">Votre voix est traitée localement. Aucun audio n&apos;est envoyé à nos serveurs.</p>
            </div>
          )}

          {/* Feedbacks */}
          <div className="space-y-4" role="status" aria-live="polite">
            {STEPS.map((step) => {
              const item = feedbacks[step];
              if (!item) return null;

              return (
                <div key={step} className="rounded-2xl border border-border p-5 bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Headphones className="w-4 h-4 text-purple-500" />
                      <p className="font-bold text-foreground text-sm">{STEP_LABELS[step]}</p>
                    </div>
                    <span className="font-bold text-foreground bg-card px-3 py-1 rounded-xl border border-border text-sm">{item.score}/{item.max}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.feedback}</p>

                  {item.points_forts.length > 0 && (
                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1"><Star className="w-3 h-3" /> Points forts</p>
                      <ul className="text-xs text-foreground/80 space-y-0.5">{item.points_forts.map((p) => <li key={p}>- {p}</li>)}</ul>
                    </div>
                  )}

                  {item.axes.length > 0 && (
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Axes d&apos;amélioration</p>
                      <ul className="text-xs text-foreground/80 space-y-0.5">{item.axes.map((a) => <li key={a}>- {a}</li>)}</ul>
                    </div>
                  )}

                  <button onClick={() => speakText(item.feedback)} className="text-xs px-3 py-1.5 rounded-xl border border-border inline-flex items-center gap-1.5 hover:bg-muted transition-colors">
                    <Volume2 className="w-3 h-3" /> Écouter
                  </button>
                  {item.relance && <p className="text-sm text-primary font-medium">Relance IA : {item.relance}</p>}
                </div>
              );
            })}
          </div>

          {/* Final result */}
          {finalResult && (
            <div className="rounded-2xl border border-success/30 bg-success/10 p-6 text-center animate-in slide-in-from-bottom-8 duration-500">
              <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-3" />
              <h3 className="text-lg font-bold text-foreground mb-1">Bilan final</h3>
              <p className="text-4xl font-bold text-foreground mb-3">{finalResult.note}/20</p>
              <p className="text-sm text-foreground/80 max-w-lg mx-auto leading-relaxed">{finalResult.bilan}</p>
              <button onClick={() => { setSession(null); setFinalResult(null); }} className="mt-6 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
                Nouvelle simulation
              </button>
            </div>
          )}

          {!finalResult && (
            <p className="text-sm text-muted-foreground text-center">Progression : {aggregated.totalScore.toFixed(1)} / {aggregated.totalMax.toFixed(1)} points</p>
          )}
        </div>
      )}

      <div className="fixed bottom-24 md:bottom-6 right-6 z-50 space-y-2">
        {badgeToasts.map((badge) => (
          <div key={badge} className="rounded-xl border border-success/30 bg-success/10 px-4 py-2.5 text-sm shadow-lg font-medium" role="status" aria-live="polite">
            Badge débloqué : {badge}
          </div>
        ))}
      </div>
    </div>
  );
}
