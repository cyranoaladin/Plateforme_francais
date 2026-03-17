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
import { Button } from '@/components/ui';
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
    eyebrow: 'Rotation compl\u00E8te',
    description: 'Alterne syntaxe, relations logiques et syst\u00E8me verbal pour r\u00E9viser les trois axes du programme.',
  },
  {
    value: 'subordonnees',
    label: 'Subordonn\u00E9es',
    eyebrow: 'Axe 1',
    description: 'Travaille les relatives, conjonctives, interrogatives indirectes et les fonctions dans la phrase complexe.',
  },
  {
    value: 'relations_logiques',
    label: 'Relations logiques',
    eyebrow: 'Axe 2',
    description: 'Cause, cons\u00E9quence, opposition, concession, but et condition dans des phrases courtes d\u2019oral EAF.',
  },
  {
    value: 'systeme_verbal',
    label: 'Syst\u00E8me verbal',
    eyebrow: 'Axe 3',
    description: 'Valeurs des temps, subjonctif, conditionnel et concordance pour s\u00E9curiser la r\u00E9ponse de grammaire.',
  },
];

const EDITORIAL_HEADING = {
  fontFamily: "var(--font-display)",
};

const METHOD_MARKERS = [
  'Identifier le fait de langue exact',
  'Nommer avec la terminologie du programme',
  'Interpr\u00E9ter l\u2019effet dans le contexte',
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
        throw new Error(body.error ?? 'Erreur de g\u00E9n\u00E9ration');
      }

      const payload = (await response.json()) as { exercises: Exercise[] };
      if (payload.exercises.length > 0) {
        setExercises(payload.exercises);
      } else {
        setExercises(buildLangueExerciseSeries(selectedTheme, 5));
        setLoadError('S\u00E9rie locale charg\u00E9e. Une nouvelle s\u00E9lection a \u00E9t\u00E9 compos\u00E9e depuis la banque interne.');
      }
    } catch {
      setExercises(buildLangueExerciseSeries(selectedTheme, 5));
      setLoadError('S\u00E9rie locale charg\u00E9e. Une nouvelle s\u00E9lection a \u00E9t\u00E9 compos\u00E9e depuis la banque interne.');
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
      <section className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[var(--navy)] px-6 py-7 text-[var(--surface-parchment)] shadow-[var(--shadow-xl)] md:px-8 md:py-8 lg:px-10 lg:py-10">
        <div className="absolute inset-y-0 right-[-8%] hidden w-[38%] rounded-full bg-[radial-gradient(circle_at_center,_rgba(126,212,194,0.24),_transparent_72%)] blur-2xl lg:block" />
        <div className="absolute left-[-4%] top-[-22%] h-40 w-40 rounded-full bg-[rgba(216,163,99,0.15)] blur-3xl" />

        <div className="relative grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--border-warm)]">
              <Type className="h-4 w-4" />
              Atelier langue
            </div>
            <h1 style={EDITORIAL_HEADING} className="mt-5 max-w-4xl text-4xl leading-tight tracking-[-0.03em] text-white md:text-5xl lg:text-6xl">
              Un entraînement court pour verrouiller les 2 points de grammaire qui font basculer une prestation orale.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-on-navy-muted)] md:text-base">
              Nexus compose des phrases-cibles à partir de la banque interne, recentre la terminologie du programme et t{'’'}oblige à nommer le fait de langue avant de commenter son effet.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {[
              { label: 'Série', value: `${safeCompletedCount}/${exercises.length || 5}` },
              { label: 'Axe actif', value: activeTheme.eyebrow },
              { label: 'Dernière note', value: scoreLabel },
            ].map((item) => (
              <div key={item.label} className="rounded-[24px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--border-warm)]">{item.label}</p>
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
          <section className="rounded-[24px] border border-[var(--border-light)] bg-[linear-gradient(180deg,var(--surface-warm-card-top)_0%,var(--surface-warm-card)_100%)] p-5 shadow-[var(--shadow-lg)]">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--navy)]/8 text-[var(--navy)]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--accent-bronze)]">Série de travail</p>
                <h2 style={EDITORIAL_HEADING} className="mt-2 text-3xl leading-tight tracking-[-0.02em] text-[var(--navy)]">
                  Régler la séance
                </h2>
              </div>
            </div>

            <label className="mt-5 block text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-warm)]">
              Axe du programme
            </label>
            <select
              value={theme}
              onChange={(event) => setTheme(event.target.value as ThemeKey)}
              className="mt-2 w-full rounded-[16px] border border-[var(--border-sand)] bg-white px-4 py-3 text-sm text-[var(--navy)] outline-none transition focus:border-[var(--navy)]/30"
              disabled={isLoading}
            >
              {THEME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="mt-4 rounded-[22px] border border-[var(--border-sand)] bg-white/80 p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--accent-bronze)]">{activeTheme.eyebrow}</p>
              <p className="mt-2 text-sm font-semibold text-[var(--navy)]">{activeTheme.label}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--navy-mid)]">{activeTheme.description}</p>
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

          <section className="rounded-[24px] border border-[var(--border-success)] bg-[var(--success-bg)] p-5 shadow-[var(--shadow-lg)]">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--teal)]/10 text-[var(--teal)]">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--teal)]">Méthode attendue</p>
                <h2 className="mt-2 text-lg font-semibold text-[var(--navy)]">Ce que l’examinateur veut entendre</h2>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {METHOD_MARKERS.map((marker, index) => (
                <div key={marker} className="rounded-[20px] border border-[var(--border-success-vivid)] bg-white/85 px-4 py-3 text-sm text-[var(--navy-mid)]">
                  <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--teal)]/10 text-xs font-bold text-[var(--teal)]">
                    {index + 1}
                  </span>
                  {marker}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[24px] border border-[var(--border-warm-mid)] bg-[var(--surface-warm-section)] p-5 shadow-[var(--shadow-lg)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--accent-bronze)]">Progression</p>
            <div className="mt-4 rounded-full bg-white/75 p-1">
              <div className="h-3 overflow-hidden rounded-full bg-[var(--border-warm-soft)]">
                <div className="h-3 rounded-full bg-[var(--navy)] transition-all duration-500" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-[var(--text-secondary)]">
              <span>{safeCompletedCount} exercice(s) validés</span>
              <span>{progressPercent}%</span>
            </div>
          </section>
        </aside>

        <section className="overflow-hidden rounded-[24px] border border-[var(--border-warm-mid)] bg-[linear-gradient(180deg,var(--surface-warm-card-top)_0%,var(--surface-warm-card)_100%)] shadow-[var(--shadow-lg)]">
          <div className="border-b border-[var(--border-warm-soft)] bg-white/85 px-5 py-4 md:px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--navy)]/10 text-[var(--navy)]">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--accent-bronze)]">Phrase cible</p>
                  <h2 className="text-lg font-semibold text-[var(--navy)]">
                    {currentExercise ? `Exercice ${currentIndex + 1}/${exercises.length}` : 'Atelier en attente'}
                  </h2>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-sand)] bg-[var(--surface-warm-input)] px-3 py-1.5 text-xs font-medium text-[var(--navy)]">
                <Activity className="h-3.5 w-3.5 text-[var(--accent-bronze)]" />
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
              <section className="rounded-[24px] border border-[var(--border-light)] bg-white/85 p-5 shadow-[var(--shadow-sm)] md:p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--accent-bronze)]">Phrase à analyser</p>
                <p style={EDITORIAL_HEADING} className="mt-4 text-2xl leading-10 tracking-[-0.02em] text-[var(--navy)] md:text-3xl">
                  « {currentExercise.sentence} »
                </p>
                <div className="mt-5 rounded-[22px] border border-[#dfe7ef] bg-[#f4f8fb] p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--text-caption)]">Question d’oral</p>
                  <p className="mt-2 text-sm leading-7 text-[var(--navy-mid)]">{currentExercise.question}</p>
                </div>
              </section>

              <section className="rounded-[24px] border border-[var(--border-light)] bg-white/85 p-5 shadow-[var(--shadow-sm)] md:p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--accent-bronze)]">Ton analyse</p>
                    <h3 className="mt-2 text-lg font-semibold text-[var(--navy)]">Reste court, exact, exploitable à l{'’'}oral</h3>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">Formule : identification, dénomination, interprétation.</p>
                </div>

                <textarea
                  data-testid="langue-answer"
                  className="mt-5 min-h-[180px] w-full rounded-[24px] border border-[var(--border-sand)] bg-[var(--surface-warm-input)] px-4 py-4 text-sm leading-7 text-[var(--navy)] outline-none transition placeholder:text-[var(--text-placeholder-warm)] focus:border-[var(--navy)]/30"
                  placeholder="Rédige ton analyse grammaticale complète ici..."
                  value={userAnswer}
                  onChange={(event) => setUserAnswer(event.target.value)}
                  disabled={feedback !== null}
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
                          ? 'border-[var(--border-success-vivid)] bg-[var(--success-bg)]'
                          : feedback.status === 'warning'
                            ? 'border-[var(--border-warning-soft)] bg-[var(--warning-bg)]'
                            : 'border-[var(--error-border)] bg-[var(--error-bg)]'
                      }`}
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--accent-bronze)]">Retour de séance</p>
                          <h4 className="mt-2 flex items-center gap-2 text-base font-semibold text-[var(--navy)]">
                            {feedback.status === 'success' && <CheckCircle2 className="h-5 w-5 text-[var(--teal)]" />}
                            {feedback.status === 'warning' && <RefreshCw className="h-5 w-5 text-[var(--gold-deep)]" />}
                            {feedback.status === 'error' && <Type className="h-5 w-5 text-[var(--error-text)]" />}
                            Retour sur la réponse
                          </h4>
                        </div>
                        <span className="inline-flex rounded-full border border-white/70 bg-white/80 px-3 py-1 text-sm font-semibold text-[var(--navy)]">
                          {feedback.score}/{feedback.max}
                        </span>
                      </div>
                      <p className="mt-4 text-sm leading-7 text-[var(--navy-mid)]">{feedback.message}</p>
                    </div>

                    {feedback.missing.length > 0 && (
                      <div className="rounded-[24px] border border-[var(--border-warning-soft)] bg-[var(--warning-bg)] p-5">
                        <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--gold-deep)]">
                          <AlertCircle className="h-4 w-4" />
                          Axes à reprendre
                        </p>
                        <ul className="mt-3 space-y-2 text-sm leading-7 text-[var(--gold-contrast)]">
                          {feedback.missing.map((item) => (
                            <li key={item} className="flex gap-2">
                              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--gold-deep)]" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="rounded-[24px] border border-[var(--border-success)] bg-[var(--success-bg)] p-5">
                      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--teal)]">
                        <Star className="h-4 w-4" />
                        Correction attendue
                      </p>
                      <p className="mt-3 text-sm leading-7 text-[var(--navy-mid)]">{currentExercise.correction}</p>
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
