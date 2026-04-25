'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Star,
  Target,
  Type,
} from '@/components/ui/icons';
import { useTrackInteraction } from '@/components/tracking/tracking-provider';
import { Button, StateNotice } from '@/components/ui';
import { buildLangueExerciseSeries } from '@/lib/langue/exercise-bank';
import { getCsrfToken } from '@/lib/security/csrf-client';
import { sanitizeLlmText } from '@/lib/ui/sanitize-llm';

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
    eyebrow: 'Rotation complète',
    description: 'Alterne syntaxe, relations logiques et système verbal pour réviser les trois axes du programme.',
  },
  {
    value: 'subordonnees',
    label: 'Subordonnées',
    eyebrow: 'Axe 1',
    description: 'Travaille les relatives, conjonctives, interrogatives indirectes et les fonctions dans la phrase complexe.',
  },
  {
    value: 'relations_logiques',
    label: 'Relations logiques',
    eyebrow: 'Axe 2',
    description: "Cause, conséquence, opposition, concession, but et condition dans des phrases courtes d'oral EAF.",
  },
  {
    value: 'systeme_verbal',
    label: 'Système verbal',
    eyebrow: 'Axe 3',
    description: 'Valeurs des temps, subjonctif, conditionnel et concordance pour sécuriser la réponse de grammaire.',
  },
];

const METHOD_MARKERS = [
  'Identifier le fait de langue exact',
  'Nommer avec la terminologie du programme',
  'Préciser la fonction syntaxique dans la phrase',
];

const LANGUE_COPY = {
  heroBody:
    "Nexus compose des phrases-cibles à partir de la banque interne, recentre la terminologie du programme et t'oblige à nommer le fait de langue puis à préciser sa fonction syntaxique.",
  answerTitle: 'Reste syntaxique, précis, complet en 2-3 phrases',
} as const;

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
      const csrfToken = await getCsrfToken();
      const response = await fetch('/api/v1/langue/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ theme: selectedTheme, count: 5 }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? 'Erreur de génération');
      }

      const payload = (await response.json()) as { exercises: Exercise[] };
      if (payload.exercises.length > 0) {
        setExercises(payload.exercises);
      } else {
        setExercises(buildLangueExerciseSeries(selectedTheme, 5));
        setLoadError('Série locale chargée. Une nouvelle sélection a été composée depuis la banque interne.');
      }
    } catch {
      setExercises(buildLangueExerciseSeries(selectedTheme, 5));
      setLoadError('Série locale chargée. Une nouvelle sélection a été composée depuis la banque interne.');
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
  const feedbackDescriptionId = feedback ? 'atelier-langue-feedback' : undefined;

  const handleSubmit = async () => {
    if (!currentExercise) return;
    trackInteraction('atelier_langue_submit_click', {
      exerciseId: currentExercise.id,
    });
    setIsSubmitting(true);
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch('/api/v1/evaluations/langue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          exerciseId: currentExercise.id,
          sentence: currentExercise.sentence,
          question: currentExercise.question,
          answer: userAnswer,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'évaluation.");
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
          "Impossible d'évaluer ta réponse pour le moment. Réessaie dans quelques secondes.",
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
      {/* Hero - Gradient bleu-nuit */}
      <section
        className="relative overflow-hidden rounded-2xl px-6 py-7 md:px-8 md:py-8 lg:px-10 lg:py-10"
        style={{
          background: 'linear-gradient(135deg, #0d1a35 0%, #111c30 60%, #0f1629 100%)',
          border: '1px solid rgba(123, 142, 255, 0.15)',
        }}
      >
        {/* Glow effects */}
        <div
          className="absolute -right-[5%] top-1/2 hidden h-[60%] w-[30%] -translate-y-1/2 rounded-full blur-3xl lg:block"
          style={{ background: 'radial-gradient(circle at center, rgba(123, 142, 255, 0.12), transparent 70%)' }}
        />
        <div
          className="absolute -left-[3%] -top-[15%] h-36 w-36 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle at center, rgba(255, 181, 71, 0.12), transparent 60%)' }}
        />

        <div className="relative grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
          <div>
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em]"
              style={{
                background: 'rgba(26, 213, 160, 0.12)',
                color: 'var(--eaf-teal)',
              }}
            >
              <Type className="h-4 w-4" />
              Atelier langue
            </div>
            <h1
              className="text-on-dark-h1 mt-5 max-w-4xl text-4xl leading-tight md:text-[44px]"
              style={{ fontFamily: 'var(--font-heading, Fraunces, serif)', letterSpacing: '-1.5px' }}
            >
              Un entraînement court pour verrouiller les 2 points de grammaire qui font basculer une prestation orale.
            </h1>
            <p className="text-on-dark-body mt-4 max-w-3xl text-sm leading-7 md:text-base">
              {LANGUE_COPY.heroBody}
            </p>
          </div>

          {/* Stats */}
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {[
              { label: 'Série', value: `${safeCompletedCount}/${exercises.length || 5}`, color: 'gold' as const },
              { label: 'Axe actif', value: activeTheme.eyebrow, color: 'indigo' as const },
              { label: 'Dernière note', value: scoreLabel, color: feedback ? 'teal' : ('fg3' as const) },
            ].map((item) => (
              <div
                key={item.label}
                className="stat-card-dark rounded-xl px-4 py-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <p
                  className="stat-label text-[11px] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: item.color === 'fg3' ? 'var(--eaf-fg3)' : `var(--eaf-${item.color})` }}
                >
                  {item.label}
                </p>
                <p className="stat-value mt-2 text-2xl font-semibold">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {loadError && (
        <div
          className="rounded-xl border px-4 py-3 text-sm"
          style={{
            background: 'var(--eaf-bg2)',
            borderColor: 'var(--eaf-gold)/30',
            color: 'var(--eaf-gold)',
          }}
        >
          {loadError}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Série de travail */}
          <section
            className="rounded-xl p-5"
            style={{
              background: 'var(--eaf-bg2)',
              border: '1px solid rgba(123, 142, 255, 0.12)',
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                style={{ background: 'var(--eaf-indigo)/10', color: 'var(--eaf-indigo)' }}
              >
                <Sparkles className="h-5 w-5" style={{ color: 'var(--eaf-indigo)' }} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--eaf-indigo)]">
                  Série de travail
                </p>
                <h2
                  className="mt-2 text-3xl leading-tight text-[var(--eaf-fg0)]"
                  style={{ fontFamily: 'var(--font-heading, Fraunces, serif)', letterSpacing: '-1px' }}
                >
                  Régler la séance
                </h2>
              </div>
            </div>

            {/* Select Axe du programme */}
            <div className="mt-5">
              <label
                htmlFor="langue-theme"
                className="mb-1.5 block text-sm font-medium text-[var(--eaf-fg2)]"
              >
                Axe du programme
              </label>
              <select
                id="langue-theme"
                value={theme}
                onChange={(event) => setTheme(event.target.value as ThemeKey)}
                disabled={isLoading}
                className="w-full appearance-none rounded-lg border px-3 py-3 text-sm outline-none transition-all focus:border-[var(--eaf-indigo)] focus:ring-2 focus:ring-[var(--eaf-indigo)]/20 disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  borderColor: 'rgba(123, 142, 255, 0.2)',
                  background: 'var(--eaf-bg1)',
                  color: 'var(--eaf-fg0)',
                }}
              >
                {THEME_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Card ROTATION COMPLÈTE */}
            <div
              className="mt-4 rounded-lg p-4"
              style={{
                background: 'var(--eaf-bg1)',
                borderLeft: '3px solid var(--eaf-gold)',
                borderTopRightRadius: '10px',
                borderBottomRightRadius: '10px',
              }}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--eaf-gold)]">
                {activeTheme.eyebrow}
              </p>
              <p className="mt-1 text-sm font-semibold text-[var(--eaf-fg0)]">{activeTheme.label}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--eaf-fg2)]">{activeTheme.description}</p>
            </div>

            {/* Bouton Composer */}
            <button
              onClick={() => void loadExercises(theme)}
              disabled={isLoading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all hover:border-[var(--eaf-indigo)]/30 hover:bg-[var(--eaf-indigo)]/5 disabled:opacity-50"
              style={{
                borderColor: 'rgba(123, 142, 255, 0.2)',
                background: 'var(--eaf-bg1)',
                color: 'var(--eaf-fg1)',
              }}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Génération...' : 'Composer une nouvelle série'}
            </button>
          </section>

          {/* Méthode attendue */}
          <section
            className="rounded-xl p-5"
            style={{
              background: 'var(--eaf-bg2)',
              border: '1px solid rgba(123, 142, 255, 0.15)',
            }}
          >
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                style={{ background: 'var(--eaf-indigo)/10', color: 'var(--eaf-indigo)' }}
              >
                <Target className="h-5 w-5" style={{ color: 'var(--eaf-indigo)' }} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--eaf-indigo)]">
                  Méthode attendue
                </p>
                <h2 className="mt-2 text-lg font-semibold text-[var(--eaf-indigo)]">
                  Ce que l'examinateur veut entendre
                </h2>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {METHOD_MARKERS.map((marker, index) => (
                <div
                  key={marker}
                  className="flex items-center gap-3 rounded-lg border px-4 py-3"
                  style={{
                    background: 'var(--eaf-bg1)',
                    borderColor: 'rgba(123, 142, 255, 0.1)',
                  }}
                >
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      background: 'var(--eaf-indigo)/15',
                      color: 'var(--eaf-indigo)',
                    }}
                  >
                    {index + 1}
                  </span>
                  <span className="text-sm text-[var(--eaf-fg1)]">{marker}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Progression */}
          <section
            className="rounded-xl p-5"
            style={{
              background: 'var(--eaf-bg2)',
              border: '1px solid rgba(123, 142, 255, 0.12)',
            }}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--eaf-indigo)]">
              Progression
            </p>
            <div className="mt-4 rounded-full p-1" style={{ background: 'var(--eaf-bg3)' }}>
              <div
                className="h-2 overflow-hidden rounded-full transition-all duration-500"
                style={{
                  width: `${progressPercent}%`,
                  background: 'var(--eaf-gradient-progress)',
                }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-[var(--eaf-fg2)]">
              <span>{safeCompletedCount} exercice(s) validés</span>
              <span className="font-semibold text-[var(--eaf-indigo)]">{progressPercent}%</span>
            </div>
          </section>
        </aside>

        {/* Zone exercice */}
        <section
          className="overflow-hidden rounded-xl"
          style={{
            background: 'var(--eaf-bg1)',
            border: '1px solid rgba(123, 142, 255, 0.12)',
          }}
        >
          {/* Header */}
          <div
            className="border-b px-5 py-4 md:px-6"
            style={{ borderColor: 'rgba(123, 142, 255, 0.1)', background: 'var(--eaf-bg2)' }}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ background: 'var(--eaf-indigo)/10', color: 'var(--eaf-indigo)' }}
                >
                  <BookOpen className="h-5 w-5" style={{ color: 'var(--eaf-indigo)' }} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--eaf-indigo)]">
                    Phrase cible
                  </p>
                  <h2 className="text-lg font-semibold text-[var(--eaf-fg0)]">
                    {currentExercise ? `Exercice ${currentIndex + 1}/${exercises.length}` : 'Atelier en attente'}
                  </h2>
                </div>
              </div>
              <div
                className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium"
                style={{
                  borderColor: 'rgba(255, 181, 71, 0.3)',
                  background: 'var(--eaf-gold)/10',
                  color: 'var(--eaf-gold)',
                }}
              >
                <Activity className="h-3.5 w-3.5" />
                Terminologie EAF première
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="p-6 md:p-8">
              <StateNotice
                title="Génération de la série en cours"
                description="Nexus compose une petite suite d'exercices sur le thème choisi pour garder un rythme court et exploitable."
                variant="loading"
              />
            </div>
          ) : !currentExercise ? (
            <div className="p-6 md:p-8">
              <StateNotice
                title="Aucun exercice disponible"
                description="Utilise le composeur de série pour relancer une session sur un axe du programme."
                variant="info"
              />
            </div>
          ) : (
            <div className="space-y-6 p-5 md:p-8">
              {/* Phrase à analyser */}
              <div
                className="rounded-xl border p-5"
                style={{
                  background: 'var(--eaf-bg2)',
                  borderColor: 'rgba(123, 142, 255, 0.1)',
                }}
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--eaf-gold)]">
                  Phrase à analyser
                </p>
                <p
                  className="mt-4 text-2xl leading-10 md:text-3xl"
                  style={{
                    fontFamily: 'var(--font-heading, Fraunces, serif)',
                    letterSpacing: '-0.8px',
                    color: 'var(--eaf-indigo)',
                  }}
                >
                  « {sanitizeLlmText(currentExercise.sentence)} »
                </p>
                <div
                  className="mt-5 rounded-xl border p-4"
                  style={{
                    background: 'var(--eaf-indigo)/5',
                    borderColor: 'rgba(123, 142, 255, 0.15)',
                  }}
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--eaf-indigo)]">
                    Question d'oral
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--eaf-fg1)]">
                    {sanitizeLlmText(currentExercise.question)}
                  </p>
                </div>
              </div>

              {/* Ton analyse */}
              <div
                className="rounded-xl border p-5"
                style={{
                  background: 'var(--eaf-bg2)',
                  borderColor: 'rgba(123, 142, 255, 0.1)',
                }}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--eaf-teal)]">
                      Ton analyse
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-[var(--eaf-fg0)]">
                      {LANGUE_COPY.answerTitle}
                    </h3>
                  </div>
                  <p className="text-right text-sm text-[var(--eaf-fg3)]">
                    Formule : identification, dénomination, fonction syntaxique.
                  </p>
                </div>

                <div className="mt-5">
                  <label
                    htmlFor="langue-answer"
                    className="mb-2 block text-sm font-medium text-[var(--eaf-fg2)]"
                  >
                    Réponse grammaticale
                  </label>
                  <textarea
                    id="langue-answer"
                    data-testid="langue-answer"
                    value={userAnswer}
                    onChange={(event) => setUserAnswer(event.target.value)}
                    disabled={feedback !== null}
                    rows={6}
                    placeholder="Rédige ton analyse grammaticale complète ici..."
                    className="w-full resize-y rounded-xl border px-4 py-3 text-sm leading-7 outline-none transition-all duration-200 placeholder:text-[var(--eaf-fg3)] focus:border-[var(--eaf-teal)] focus:ring-2 focus:ring-[var(--eaf-teal)]/20 disabled:opacity-60"
                    style={{
                      borderColor: 'rgba(123, 142, 255, 0.2)',
                      background: 'var(--eaf-bg1)',
                      color: 'var(--eaf-fg0)',
                      fontFamily: 'var(--eaf-font-body, DM Sans, sans-serif)',
                    }}
                    aria-describedby={feedbackDescriptionId}
                    autoComplete="off"
                  />
                  <p className="mt-2 text-xs text-[var(--eaf-fg3)]">
                    Une réponse courte et précise suffit : fait de langue, nom exact, effet.
                  </p>
                </div>

                {!feedback ? (
                  <div className="mt-6 flex justify-end">
                    <Button
                      data-testid="langue-submit"
                      onClick={handleSubmit}
                      disabled={userAnswer.length === 0 || isSubmitting}
                      size="md"
                      loading={isSubmitting}
                      icon={!isSubmitting ? <CheckCircle2 className="h-4 w-4" /> : undefined}
                      className="rounded-xl font-semibold"
                      style={{
                        background: 'var(--eaf-orange)',
                        color: '#050913',
                      }}
                    >
                      {isSubmitting ? 'Évaluation...' : 'Soumettre la réponse'}
                    </Button>
                  </div>
                ) : (
                  <div className="mt-8 space-y-5 animate-in slide-in-from-bottom-4 duration-500">
                    {/* Feedback */}
                    <div
                      data-testid="langue-feedback"
                      id="atelier-langue-feedback"
                      role="status"
                      aria-live="polite"
                      className="rounded-xl border p-6"
                      style={{
                        background:
                          feedback.status === 'success'
                            ? 'var(--eaf-teal)/5'
                            : feedback.status === 'warning'
                              ? 'var(--eaf-gold)/5'
                              : 'rgba(239, 68, 68, 0.05)',
                        borderColor:
                          feedback.status === 'success'
                            ? 'var(--eaf-teal)/30'
                            : feedback.status === 'warning'
                              ? 'var(--eaf-gold)/30'
                              : 'rgba(239, 68, 68, 0.3)',
                      }}
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--eaf-gold)]">
                            Retour de séance
                          </p>
                          <h4 className="mt-2 flex items-center gap-2 text-base font-semibold text-[var(--eaf-fg0)]">
                            {feedback.status === 'success' && (
                              <CheckCircle2 className="h-5 w-5" style={{ color: 'var(--eaf-teal)' }} />
                            )}
                            {feedback.status === 'warning' && (
                              <RefreshCw className="h-5 w-5" style={{ color: 'var(--eaf-gold)' }} />
                            )}
                            {feedback.status === 'error' && (
                              <Type className="h-5 w-5" style={{ color: '#EF4444' }} />
                            )}
                            Retour sur la réponse
                          </h4>
                        </div>
                        <span
                          className="inline-flex rounded-full border px-3 py-1 text-sm font-semibold"
                          style={{
                            borderColor: 'rgba(123, 142, 255, 0.2)',
                            background: 'var(--eaf-bg2)',
                            color: 'var(--eaf-fg0)',
                          }}
                        >
                          {feedback.score}/{feedback.max}
                        </span>
                      </div>
                      <p className="mt-4 text-sm leading-7 text-[var(--eaf-fg2)]">
                        {sanitizeLlmText(feedback.message)}
                      </p>
                    </div>

                    {/* Axes à reprendre */}
                    {feedback.missing.length > 0 && (
                      <div
                        className="rounded-xl border p-5"
                        style={{
                          background: 'var(--eaf-gold)/5',
                          borderColor: 'var(--eaf-gold)/20',
                        }}
                      >
                        <p
                          className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em]"
                          style={{ color: 'var(--eaf-gold)' }}
                        >
                          <AlertCircle className="h-4 w-4" />
                          Axes à reprendre
                        </p>
                        <ul className="mt-3 space-y-2 text-sm leading-7 text-[var(--eaf-fg1)]">
                          {feedback.missing.map((item) => (
                            <li key={item} className="flex gap-2">
                              <span
                                className="mt-2 h-1.5 w-1.5 rounded-full"
                                style={{ background: 'var(--eaf-gold)' }}
                              />
                              <span>{sanitizeLlmText(item)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Correction */}
                    <div
                      className="rounded-xl border p-5"
                      style={{
                        background: 'var(--eaf-teal)/5',
                        borderColor: 'var(--eaf-teal)/20',
                      }}
                    >
                      <p
                        className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em]"
                        style={{ color: 'var(--eaf-teal)' }}
                      >
                        <Star className="h-4 w-4" />
                        Correction attendue
                      </p>
                      <p className="mt-3 text-sm leading-7 text-[var(--eaf-fg2)]">
                        {sanitizeLlmText(currentExercise.correction)}
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={handleNext}
                        size="md"
                        icon={<ArrowRight className="h-4 w-4" />}
                        iconPosition="right"
                        className="rounded-xl font-semibold"
                        style={{
                          background: 'var(--eaf-indigo)',
                          color: '#050913',
                        }}
                      >
                        Exercice suivant
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
