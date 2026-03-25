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
} from 'lucide-react';
import { useTrackInteraction } from '@/components/tracking/tracking-provider';
import { StateNotice } from '@/components/ui/state-notice';
import { Button, Textarea } from '@/components/ui';
import { buildLangueExerciseSeries } from '@/lib/langue/exercise-bank';
import { getCsrfTokenFromDocument } from '@/lib/security/csrf-client';
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

const EDITORIAL_HEADING = {
  fontFamily: "var(--font-display)",
};

const METHOD_MARKERS = [
  'Identifier le fait de langue exact',
  'Nommer avec la terminologie du programme',
  'Interpréter l’effet dans le contexte',
];

const LANGUE_COPY = {
  heroBody:
    'Nexus compose des phrases-cibles à partir de la banque interne, recentre la terminologie du programme et t’oblige à nommer le fait de langue avant de commenter son effet.',
  answerTitle: 'Reste court, exact, exploitable à l’oral',
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
      <section className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[var(--c-primary)] px-6 py-7 text-[var(--bg-page)] shadow-[var(--shadow-md)] md:px-8 md:py-8 lg:px-10 lg:py-10">
        <div className="absolute inset-y-0 right-[-8%] hidden w-[38%] rounded-full bg-[radial-gradient(circle_at_center,_rgba(126,212,194,0.24),_transparent_72%)] blur-2xl lg:block" />
        <div className="absolute left-[-4%] top-[-22%] h-40 w-40 rounded-full bg-[rgba(216,163,99,0.15)] blur-3xl" />

        <div className="relative grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--color-amber-300)]">
              <Type className="h-4 w-4" />
              Atelier langue
            </div>
            <h1 style={EDITORIAL_HEADING} className="mt-5 max-w-4xl text-4xl leading-tight tracking-[-0.03em] text-white md:text-5xl lg:text-6xl">
              Un entraînement court pour verrouiller les 2 points de grammaire qui font basculer une prestation orale.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--color-slate-300)] md:text-base">
              {LANGUE_COPY.heroBody}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {[
              { label: 'Série', value: `${safeCompletedCount}/${exercises.length || 5}` },
              { label: 'Axe actif', value: activeTheme.eyebrow },
              { label: 'Dernière note', value: scoreLabel },
            ].map((item) => (
              <div key={item.label} className="rounded-[24px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--color-amber-300)]">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {loadError && (
        <StateNotice title="Série locale chargée" description={loadError} variant="warning" />
      )}

      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <section className="rounded-[24px] border border-[var(--border-default)] bg-[linear-gradient(180deg,var(--bg-surface)_0%,var(--bg-surface)_100%)] p-5 shadow-[var(--shadow-md)]">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--c-primary)]/8 text-[var(--c-primary)]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-reward)]">Série de travail</p>
                <h2 style={EDITORIAL_HEADING} className="mt-2 text-3xl leading-tight tracking-[-0.02em] text-[var(--c-primary)]">
                  Régler la séance
                </h2>
              </div>
            </div>

            <label className="mt-5 block text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-body)]">
              Axe du programme
            </label>
            <select
              value={theme}
              onChange={(event) => setTheme(event.target.value as ThemeKey)}
              className="mt-2 w-full appearance-none rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-3 text-sm text-[var(--c-primary)] outline-none transition-all duration-[var(--transition-normal)] focus:border-[var(--c-success)] focus:ring-2 focus:ring-[var(--c-success)]/20 disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {THEME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="mt-4 rounded-[22px] border border-[var(--border-default)] bg-white/80 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--c-reward)]">{activeTheme.eyebrow}</p>
              <p className="mt-2 text-sm font-semibold text-[var(--c-primary)]">{activeTheme.label}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-body)]">{activeTheme.description}</p>
            </div>

            <Button
              onClick={() => void loadExercises(theme)}
              disabled={isLoading}
              variant="primary"
              size="md"
              fullWidth
              icon={<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />}
              className="mt-5"
            >
              {isLoading ? 'Génération...' : 'Composer une nouvelle série'}
            </Button>
          </section>

          <section className="rounded-[24px] border border-[var(--border-primary)] bg-[var(--bg-primary)] p-5 shadow-[var(--shadow-md)]">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--c-primary)]/10 text-[var(--c-primary)]">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-primary)]">Méthode attendue</p>
                <h2 className="mt-2 text-lg font-semibold text-[var(--c-primary)]">Ce que l’examinateur veut entendre</h2>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {METHOD_MARKERS.map((marker, index) => (
                <div key={marker} className="rounded-[20px] border border-[var(--border-primary)] bg-white/85 px-4 py-3 text-sm text-[var(--text-body)]">
                  <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--c-primary)]/10 text-xs font-bold text-[var(--c-primary)]">
                    {index + 1}
                  </span>
                  {marker}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-surface-secondary)] p-5 shadow-[var(--shadow-md)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-reward)]">Progression</p>
            <div className="mt-4 rounded-full bg-white/75 p-1">
              <div className="h-3 overflow-hidden rounded-full bg-[var(--border-default)]">
                <div className="h-3 rounded-full bg-[var(--c-primary)] transition-all duration-500" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-[var(--text-secondary)]">
              <span>{safeCompletedCount} exercice(s) validés</span>
              <span>{progressPercent}%</span>
            </div>
          </section>
        </aside>

        <section className="overflow-hidden rounded-[24px] border border-[var(--border-default)] bg-[linear-gradient(180deg,var(--bg-surface)_0%,var(--bg-surface)_100%)] shadow-[var(--shadow-md)]">
          <div className="border-b border-[var(--border-default)] bg-white/85 px-5 py-4 md:px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--c-primary)]/10 text-[var(--c-primary)]">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--c-reward)]">Phrase cible</p>
                  <h2 className="text-lg font-semibold text-[var(--c-primary)]">
                    {currentExercise ? `Exercice ${currentIndex + 1}/${exercises.length}` : 'Atelier en attente'}
                  </h2>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--bg-surface-secondary)] px-3 py-1.5 text-xs font-medium text-[var(--c-primary)]">
                <Activity className="h-3.5 w-3.5 text-[var(--c-reward)]" />
                Terminologie EAF première
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="p-6 md:p-8">
              <StateNotice
                title="Génération de la série en cours"
                description="Nexus compose une petite suite d’exercices sur le thème choisi pour garder un rythme court et exploitable."
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
              <section className="rounded-[24px] border border-[var(--border-default)] bg-white/85 p-5 shadow-[var(--shadow-sm)] md:p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--c-reward)]">Phrase à analyser</p>
                <p style={EDITORIAL_HEADING} className="mt-4 text-2xl leading-10 tracking-[-0.02em] text-[var(--c-primary)] md:text-3xl">
                  « {sanitizeLlmText(currentExercise.sentence)} »
                </p>
                <div className="mt-5 rounded-[22px] border border-[var(--border-primary)] bg-[var(--bg-primary)] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--text-muted)]">Question d’oral</p>
                  <p className="mt-2 text-sm leading-7 text-[var(--text-body)]">{sanitizeLlmText(currentExercise.question)}</p>
                </div>
              </section>

              <section className="rounded-[24px] border border-[var(--border-default)] bg-white/85 p-5 shadow-[var(--shadow-sm)] md:p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--c-reward)]">Ton analyse</p>
                    <h3 className="mt-2 text-lg font-semibold text-[var(--c-primary)]">{LANGUE_COPY.answerTitle}</h3>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">Formule : identification, dénomination, interprétation.</p>
                </div>

                <Textarea
                  data-testid="langue-answer"
                  className="mt-5"
                  placeholder="Rédige ton analyse grammaticale complète ici..."
                  value={userAnswer}
                  onChange={(event) => setUserAnswer(event.target.value)}
                  disabled={feedback !== null}
                  rows={6}
                  size="lg"
                />

                {!feedback ? (
                  <div className="mt-6 flex justify-end">
                    <Button
                      data-testid="langue-submit"
                      onClick={handleSubmit}
                      disabled={userAnswer.length === 0 || isSubmitting}
                      variant="primary"
                      size="md"
                      loading={isSubmitting}
                      icon={!isSubmitting ? <CheckCircle2 className="h-4 w-4" /> : undefined}
                    >
                      {isSubmitting ? 'Évaluation...' : 'Soumettre la réponse'}
                    </Button>
                  </div>
                ) : (
                  <div className="mt-8 space-y-5 animate-in slide-in-from-bottom-4 duration-500">
                    <div
                      data-testid="langue-feedback"
                      className={`rounded-[24px] border p-6 ${
                        feedback.status === 'success'
                          ? 'border-[var(--border-success)] bg-[var(--bg-success)]'
                          : feedback.status === 'warning'
                            ? 'border-[var(--border-reward)] bg-[var(--bg-reward)]'
                            : 'border-[var(--border-accent)] bg-[var(--c-accent-subtle)]'
                      }`}
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--c-reward)]">Retour de séance</p>
                          <h4 className="mt-2 flex items-center gap-2 text-base font-semibold text-[var(--c-primary)]">
                            {feedback.status === 'success' && <CheckCircle2 className="h-5 w-5 text-[var(--c-success)]" />}
                            {feedback.status === 'warning' && <RefreshCw className="h-5 w-5 text-[var(--c-reward)]" />}
                            {feedback.status === 'error' && <Type className="h-5 w-5 text-[var(--c-accent)]" />}
                            Retour sur la réponse
                          </h4>
                        </div>
                        <span className="inline-flex rounded-full border border-white/70 bg-white/80 px-3 py-1 text-sm font-semibold text-[var(--c-primary)]">
                          {feedback.score}/{feedback.max}
                        </span>
                      </div>
                      <p className="mt-4 text-sm leading-7 text-[var(--text-body)]">{sanitizeLlmText(feedback.message)}</p>
                    </div>

                    {feedback.missing.length > 0 && (
                      <div className="rounded-[24px] border border-[var(--border-reward)] bg-[var(--bg-reward)] p-5">
                        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--c-reward)]">
                          <AlertCircle className="h-4 w-4" />
                          Axes à reprendre
                        </p>
                        <ul className="mt-3 space-y-2 text-sm leading-7 text-[var(--text-reward-on-subtle)]">
                          {feedback.missing.map((item) => (
                            <li key={item} className="flex gap-2">
                              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--c-reward)]" />
                              <span>{sanitizeLlmText(item)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="rounded-[24px] border border-[var(--border-success)] bg-[var(--bg-success)] p-5">
                      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--c-success)]">
                        <Star className="h-4 w-4" />
                        Correction attendue
                      </p>
                      <p className="mt-3 text-sm leading-7 text-[var(--text-body)]">{sanitizeLlmText(currentExercise.correction)}</p>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={handleNext}
                        variant="secondary"
                        size="md"
                        icon={<ArrowRight className="h-4 w-4" />}
                        iconPosition="right"
                      >
                        Exercice suivant
                      </Button>
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
