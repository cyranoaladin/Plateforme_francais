'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Sparkles,
  Star,
  Target,
  Type,
} from 'lucide-react';
import { useTrackInteraction } from '@/components/tracking/tracking-provider';
import { StateNotice } from '@/components/ui/state-notice';
import { buildLangueExerciseSeries } from '@/lib/langue/exercise-bank';
import { getCsrfTokenFromDocument } from '@/lib/security/csrf-client';

type Exercise = {
  id: string;
  sentence: string;
  question: string;
  correction: string;
  axe?: string;
};

type LangueFeedback = {
  score: number;
  max: number;
  status: 'success' | 'warning' | 'error';
  message: string;
  missing: string[];
};

type ThemeKey = 'mixte' | 'subordonnees' | 'relations_logiques' | 'systeme_verbal';

type ThemeOption = {
  value: ThemeKey;
  label: string;
  eyebrow: string;
  description: string;
};

const THEME_OPTIONS: ThemeOption[] = [
  {
    value: 'mixte',
    label: 'Mixte',
    eyebrow: 'Rotation complete',
    description: 'Alterne syntaxe, relations logiques et systeme verbal pour reviser les trois axes du programme.',
  },
  {
    value: 'subordonnees',
    label: 'Subordonnees',
    eyebrow: 'Axe 1',
    description: 'Travaille les relatives, conjonctives, interrogatives indirectes et les fonctions dans la phrase complexe.',
  },
  {
    value: 'relations_logiques',
    label: 'Relations logiques',
    eyebrow: 'Axe 2',
    description: 'Cause, consequence, opposition, concession, but et condition dans des phrases courtes d oral EAF.',
  },
  {
    value: 'systeme_verbal',
    label: 'Systeme verbal',
    eyebrow: 'Axe 3',
    description: 'Valeurs des temps, subjonctif, conditionnel et concordance pour securiser la reponse de grammaire.',
  },
];

const EDITORIAL_HEADING = {
  fontFamily: "'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, serif",
};

const METHOD_MARKERS = [
  'Identifier le fait de langue exact',
  'Nommer avec la terminologie du programme',
  'Interpreter l effet dans le contexte',
];

export default function AtelierLangue() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<LangueFeedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [theme, setTheme] = useState<ThemeKey>('mixte');
  const trackInteraction = useTrackInteraction();

  const loadExercises = async (selectedTheme: ThemeKey) => {
    setIsLoading(true);
    setLoadError(null);
    setCurrentIndex(0);
    setCompletedCount(0);
    setFeedback(null);
    setUserAnswer('');

    try {
      const response = await fetch('/api/v1/langue/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfTokenFromDocument(),
        },
        body: JSON.stringify({ theme: selectedTheme, count: 5 }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Erreur de generation');
      }

      const payload = (await response.json()) as { exercises: Exercise[] };
      if (payload.exercises.length > 0) {
        setExercises(payload.exercises);
      } else {
        setExercises(buildLangueExerciseSeries(selectedTheme, 5));
        setLoadError('Serie locale chargee. Une nouvelle selection a ete composee depuis la banque interne.');
      }
    } catch {
      setExercises(buildLangueExerciseSeries(selectedTheme, 5));
      setLoadError('Serie locale chargee. Une nouvelle selection a ete composee depuis la banque interne.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadExercises(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentExercise = exercises[currentIndex];
  const safeCompletedCount = Math.min(completedCount, exercises.length);
  const progressPercent = exercises.length > 0 ? Math.round((safeCompletedCount / exercises.length) * 100) : 0;
  const activeTheme = THEME_OPTIONS.find((item) => item.value === theme) ?? THEME_OPTIONS[0];

  const scoreLabel = useMemo(() => {
    if (!feedback) return 'En attente';
    return `${feedback.score}/${feedback.max}`;
  }, [feedback]);

  const handleSubmit = async () => {
    if (!currentExercise) return;
    trackInteraction('atelier_langue_submit_click', {
      exerciseId: currentExercise.id,
    });
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/v1/evaluations/langue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfTokenFromDocument(),
        },
        body: JSON.stringify({
          exerciseId: currentExercise.id,
          sentence: currentExercise.sentence,
          question: currentExercise.question,
          answer: userAnswer,
        }),
      });

      if (!response.ok) {
        throw new Error('API error');
      }

      const result = (await response.json()) as LangueFeedback;
      setFeedback(result);
      setCompletedCount((prev) => Math.min(prev + 1, exercises.length || prev + 1));
      trackInteraction('atelier_langue_feedback_received', {
        exerciseId: currentExercise.id,
        score: result.score,
        status: result.status,
      });
    } catch {
      setFeedback({
        score: 0,
        max: 2,
        status: 'error',
        message:
          'Impossible d\u2019évaluer ta réponse pour le moment. Réessaie dans quelques secondes.',
        missing: [],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    if (!currentExercise) return;
    trackInteraction('atelier_langue_next_exercise', {
      currentExerciseId: currentExercise.id,
    });
    setCurrentIndex((prev) => (prev + 1) % exercises.length);
    setUserAnswer('');
    setFeedback(null);
  };

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 md:p-8">
      <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[#17324d] px-6 py-7 text-[#f6efe4] shadow-[0_28px_90px_rgba(23,50,77,0.22)] md:px-8 md:py-8 lg:px-10 lg:py-10">
        <div className="absolute inset-y-0 right-[-8%] hidden w-[38%] rounded-full bg-[radial-gradient(circle_at_center,_rgba(126,212,194,0.24),_transparent_72%)] blur-2xl lg:block" />
        <div className="absolute left-[-4%] top-[-22%] h-40 w-40 rounded-full bg-[rgba(216,163,99,0.15)] blur-3xl" />

        <div className="relative grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[#d7c4aa]">
              <Type className="h-4 w-4" />
              Atelier langue
            </div>
            <h1 style={EDITORIAL_HEADING} className="mt-5 max-w-4xl text-4xl leading-tight tracking-[-0.03em] text-white md:text-5xl lg:text-6xl">
              Un entraînement court pour verrouiller les 2 points de grammaire qui font basculer une prestation orale.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#dfe8f0] md:text-base">
              Nexus compose des phrases-cibles à partir de la banque interne, recentre la terminologie du programme et t&apos;oblige à nommer le fait de langue avant de commenter son effet.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {[
              { label: 'Serie', value: `${safeCompletedCount}/${exercises.length || 5}` },
              { label: 'Axe actif', value: activeTheme.eyebrow },
              { label: 'Derniere note', value: scoreLabel },
            ].map((item) => (
              <div key={item.label} className="rounded-[26px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d7c4aa]">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {loadError && (
        <StateNotice title="Serie locale chargee" description={loadError} variant="warning" />
      )}

      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <section className="rounded-[30px] border border-[#e7dac6] bg-[linear-gradient(180deg,#fffdfa_0%,#fbf5ec_100%)] p-5 shadow-[0_20px_70px_rgba(23,50,77,0.08)]">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#17324d]/8 text-[#17324d]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#9a6a37]">Serie de travail</p>
                <h2 style={EDITORIAL_HEADING} className="mt-2 text-3xl leading-tight tracking-[-0.02em] text-[#17324d]">
                  Regler la seance
                </h2>
              </div>
            </div>

            <label className="mt-5 block text-xs font-bold uppercase tracking-[0.2em] text-[#8a704b]">
              Axe du programme
            </label>
            <select
              value={theme}
              onChange={(event) => setTheme(event.target.value as ThemeKey)}
              className="mt-2 w-full rounded-[18px] border border-[#dfd1bc] bg-white px-4 py-3 text-sm text-[#17324d] outline-none transition focus:border-[#17324d]/30"
              disabled={isLoading}
            >
              {THEME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="mt-4 rounded-[22px] border border-[#dfd1bc] bg-white/80 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#9a6a37]">{activeTheme.eyebrow}</p>
              <p className="mt-2 text-sm font-semibold text-[#17324d]">{activeTheme.label}</p>
              <p className="mt-2 text-sm leading-6 text-[#33536f]">{activeTheme.description}</p>
            </div>

            <button
              onClick={() => void loadExercises(theme)}
              disabled={isLoading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-[18px] bg-[#17324d] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#22486b] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Generation...' : 'Composer une nouvelle serie'}
            </button>
          </section>

          <section className="rounded-[30px] border border-[#d7e6e1] bg-[#edf7f3] p-5 shadow-[0_20px_70px_rgba(15,118,110,0.08)]">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0f766e]/10 text-[#0f766e]">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#0f766e]">Methode attendue</p>
                <h2 className="mt-2 text-lg font-semibold text-[#17324d]">Ce que l examinateur veut entendre</h2>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {METHOD_MARKERS.map((marker, index) => (
                <div key={marker} className="rounded-[20px] border border-[#d0e8df] bg-white/85 px-4 py-3 text-sm text-[#33536f]">
                  <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0f766e]/10 text-xs font-bold text-[#0f766e]">
                    {index + 1}
                  </span>
                  {marker}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[28px] border border-[#e8dcc8] bg-[#f8f1e7] p-5 shadow-[0_18px_55px_rgba(122,75,36,0.08)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#9a6a37]">Progression</p>
            <div className="mt-4 rounded-full bg-white/75 p-1">
              <div className="h-3 overflow-hidden rounded-full bg-[#efe3d2]">
                <div className="h-3 rounded-full bg-[#17324d] transition-all duration-500" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-[#5b6f82]">
              <span>{safeCompletedCount} exercice(s) valides</span>
              <span>{progressPercent}%</span>
            </div>
          </section>
        </aside>

        <section className="overflow-hidden rounded-[30px] border border-[#e6dccb] bg-[linear-gradient(180deg,#fffdfa_0%,#fbf5ec_100%)] shadow-[0_20px_70px_rgba(23,50,77,0.10)]">
          <div className="border-b border-[#efe3d2] bg-white/85 px-5 py-4 md:px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#17324d]/10 text-[#17324d]">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#9a6a37]">Phrase cible</p>
                  <h2 className="text-lg font-semibold text-[#17324d]">
                    {currentExercise ? `Exercice ${currentIndex + 1}/${exercises.length}` : 'Atelier en attente'}
                  </h2>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#dfd1bc] bg-[#fffaf4] px-3 py-1.5 text-xs font-medium text-[#17324d]">
                <Activity className="h-3.5 w-3.5 text-[#9a6a37]" />
                Terminologie EAF premiere
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="p-6 md:p-8">
              <StateNotice
                title="Generation de la serie en cours"
                description="Nexus compose une petite suite d exercices sur le theme choisi pour garder un rythme court et exploitable."
                variant="loading"
              />
            </div>
          ) : !currentExercise ? (
            <div className="p-6 md:p-8">
              <StateNotice
                title="Aucun exercice disponible"
                description="Utilisez le composeur de serie pour relancer une session sur un axe du programme."
                variant="info"
              />
            </div>
          ) : (
            <div className="space-y-6 p-5 md:p-8">
              <section className="rounded-[28px] border border-[#e7dac6] bg-white/85 p-5 shadow-[0_10px_24px_rgba(23,50,77,0.05)] md:p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#9a6a37]">Phrase a analyser</p>
                <p style={EDITORIAL_HEADING} className="mt-4 text-2xl leading-10 tracking-[-0.02em] text-[#17324d] md:text-3xl">
                  « {currentExercise.sentence} »
                </p>
                <div className="mt-5 rounded-[22px] border border-[#dfe7ef] bg-[#f4f8fb] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6d7f90]">Question d oral</p>
                  <p className="mt-2 text-sm leading-7 text-[#33536f]">{currentExercise.question}</p>
                </div>
              </section>

              <section className="rounded-[28px] border border-[#e7dac6] bg-white/85 p-5 shadow-[0_10px_24px_rgba(23,50,77,0.05)] md:p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#9a6a37]">Ton analyse</p>
                    <h3 className="mt-2 text-lg font-semibold text-[#17324d]">Reste court, exact, exploitable à l&apos;oral</h3>
                  </div>
                  <p className="text-sm text-[#5b6f82]">Formule : identification, dénomination, interprétation.</p>
                </div>

                <textarea
                  data-testid="langue-answer"
                  className="mt-5 min-h-[180px] w-full rounded-[24px] border border-[#dfd1bc] bg-[#fffaf4] px-4 py-4 text-sm leading-7 text-[#17324d] outline-none transition placeholder:text-[#8d8173] focus:border-[#17324d]/30"
                  placeholder="Rédige ton analyse grammaticale complète ici..."
                  value={userAnswer}
                  onChange={(event) => setUserAnswer(event.target.value)}
                  disabled={feedback !== null}
                />

                {!feedback ? (
                  <div className="mt-6 flex justify-end">
                    <button
                      data-testid="langue-submit"
                      onClick={handleSubmit}
                      disabled={userAnswer.length === 0 || isSubmitting}
                      className="inline-flex items-center gap-2 rounded-[18px] bg-[#17324d] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#22486b] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      {isSubmitting ? 'Evaluation...' : 'Soumettre la reponse'}
                    </button>
                  </div>
                ) : (
                  <div className="mt-8 space-y-5 animate-in slide-in-from-bottom-4 duration-500">
                    <div
                      data-testid="langue-feedback"
                      className={`rounded-[24px] border p-6 ${
                        feedback.status === 'success'
                          ? 'border-[#d6e8df] bg-[#edf7f3]'
                          : feedback.status === 'warning'
                            ? 'border-[#efd9b4] bg-[#fff7ea]'
                            : 'border-[#f1c8c0] bg-[#fff0ed]'
                      }`}
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#9a6a37]">Retour de seance</p>
                          <h4 className="mt-2 flex items-center gap-2 text-base font-semibold text-[#17324d]">
                            {feedback.status === 'success' && <CheckCircle2 className="h-5 w-5 text-[#0f766e]" />}
                            {feedback.status === 'warning' && <RefreshCw className="h-5 w-5 text-[#af7a20]" />}
                            {feedback.status === 'error' && <Type className="h-5 w-5 text-[#b24838]" />}
                            Retour sur la reponse
                          </h4>
                        </div>
                        <span className="inline-flex rounded-full border border-white/70 bg-white/80 px-3 py-1 text-sm font-semibold text-[#17324d]">
                          {feedback.score}/{feedback.max}
                        </span>
                      </div>
                      <p className="mt-4 text-sm leading-7 text-[#33536f]">{feedback.message}</p>
                    </div>

                    {feedback.missing.length > 0 && (
                      <div className="rounded-[24px] border border-[#efd9b4] bg-[#fff7ea] p-5">
                        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#af7a20]">
                          <AlertCircle className="h-4 w-4" />
                          Axes a reprendre
                        </p>
                        <ul className="mt-3 space-y-2 text-sm leading-7 text-[#6b5735]">
                          {feedback.missing.map((item) => (
                            <li key={item} className="flex gap-2">
                              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#af7a20]" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="rounded-[24px] border border-[#d7e6e1] bg-[#edf7f3] p-5">
                      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#0f766e]">
                        <Star className="h-4 w-4" />
                        Correction attendue
                      </p>
                      <p className="mt-3 text-sm leading-7 text-[#33536f]">{currentExercise.correction}</p>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={handleNext}
                        className="inline-flex items-center gap-2 rounded-[18px] border border-[#dfd1bc] bg-[#fffaf4] px-6 py-3 text-sm font-semibold text-[#17324d] transition hover:border-[#17324d]/25 hover:bg-white"
                      >
                        Exercice suivant
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
