'use client';

import { useEffect, useState } from 'react';
import { Type, CheckCircle2, RefreshCw, Activity, ArrowRight, BookOpen, Star, AlertCircle, Loader2 } from 'lucide-react';
import { useTrackInteraction } from '@/components/tracking/tracking-provider';
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

const FALLBACK_EXERCISES: Exercise[] = [
  {
    id: 'static-1',
    sentence: "J'ai vu la mer qui se retirait silencieusement.",
    question: 'Analysez la proposition subordonnée dans cette phrase.',
    correction:
      '« qui se retirait silencieusement » est une proposition subordonnée relative. Elle est introduite par le pronom relatif « qui », ayant pour antécédent le nom « mer ». Elle occupe la fonction de complément de l\'antécédent « mer ».',
  },
  {
    id: 'static-2',
    sentence: "Si j'avais su, je ne serais pas venu.",
    question:
      'Quelle est la valeur du mode et du temps employés dans la proposition subordonnée ?',
    correction:
      "La proposition subordonnée de condition « Si j'avais su » est à l'indicatif plus-que-parfait. Elle exprime ici l'irréel du passé : une condition non réalisée dans le passé.",
  },
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
  const [theme, setTheme] = useState<'mixte' | 'subordonnees' | 'relations_logiques' | 'systeme_verbal'>('mixte');
  const trackInteraction = useTrackInteraction();

  const loadExercises = async (selectedTheme: string) => {
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
        setExercises(FALLBACK_EXERCISES);
        setLoadError('Exercices par défaut chargés (le générateur IA est temporairement indisponible).');
      }
    } catch {
      setExercises(FALLBACK_EXERCISES);
      setLoadError('Exercices par défaut chargés (le générateur IA est temporairement indisponible).');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadExercises(theme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentExercise = exercises[currentIndex];
  const progressPercent = exercises.length > 0 ? Math.round((completedCount / exercises.length) * 100) : 0;

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
      setCompletedCount((prev) => prev + 1);
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
          "Impossible d'évaluer votre réponse pour le moment. Réessayez dans quelques secondes.",
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
    <div className="p-4 md:p-8 max-w-4xl mx-auto animate-in fade-in duration-500">
      <header className="mb-8 md:mb-10">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center shrink-0">
            <BookOpen className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Atelier Langue</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Maîtrise la grammaire et la syntaxe pour sécuriser tes 2 points à l&apos;oral.
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs font-bold text-muted-foreground mb-1.5">
              <span>Progression</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
          <div className="text-sm font-bold text-foreground shrink-0">{completedCount}/{exercises.length}</div>
        </div>
      </header>

      {/* Theme selector + regenerate */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={theme}
          onChange={(e) => setTheme(e.target.value as typeof theme)}
          className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground"
          disabled={isLoading}
        >
          <option value="mixte">Mixte (tous axes)</option>
          <option value="subordonnees">Subordonnées</option>
          <option value="relations_logiques">Relations logiques</option>
          <option value="systeme_verbal">Système verbal</option>
        </select>
        <button
          onClick={() => void loadExercises(theme)}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Génération...' : 'Nouveaux exercices'}
        </button>
      </div>

      {loadError && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-700 dark:text-amber-400 text-sm mb-4">
          {loadError}
        </div>
      )}

      {isLoading ? (
        <div className="bg-card border border-border rounded-3xl p-12 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          <p className="text-muted-foreground text-sm">Génération de vos exercices personnalisés...</p>
        </div>
      ) : !currentExercise ? (
        <div className="bg-card border border-border rounded-3xl p-8 text-center text-muted-foreground">
          Aucun exercice disponible. Cliquez sur « Nouveaux exercices » pour générer une série.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
          <div className="p-5 bg-muted/30 border-b border-border flex justify-between items-center">
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center">
              <Activity className="w-4 h-4 mr-2" /> Exercice {currentIndex + 1}/{exercises.length}
            </span>
            <span className="text-xs text-muted-foreground font-medium bg-background px-2.5 py-1 rounded-lg border border-border">Terminologie 2020</span>
          </div>

          <div className="p-6 md:p-8">
            <div className="bg-muted/20 border-l-4 border-emerald-500 p-5 rounded-r-xl mb-6 shadow-inner">
              <p className="text-lg md:text-xl font-serif text-foreground leading-relaxed">« {currentExercise.sentence} »</p>
            </div>

            <h3 className="font-bold text-foreground mb-4 flex items-center text-base md:text-lg">
              <BookOpen className="w-5 h-5 mr-2 text-emerald-500" /> {currentExercise.question}
            </h3>

            <div className="mt-4">
              <textarea
                data-testid="langue-answer"
                className="w-full min-h-[150px] p-4 bg-muted/20 border border-border rounded-2xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all resize-none text-foreground placeholder:text-muted-foreground text-sm"
                placeholder="Rédigez votre analyse grammaticale complète ici..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                disabled={feedback !== null}
              />
            </div>

            {!feedback ? (
              <div className="mt-6 flex justify-end">
                <button
                  data-testid="langue-submit"
                  onClick={handleSubmit}
                  disabled={userAnswer.length === 0 || isSubmitting}
                  className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                >
                  {isSubmitting ? 'Évaluation...' : 'Soumettre la réponse'}
                </button>
              </div>
            ) : (
              <div className="mt-8 animate-in slide-in-from-bottom-4 duration-500 space-y-5">
                <div
                  data-testid="langue-feedback"
                  className={`p-6 rounded-2xl border ${feedback.status === 'success' ? 'bg-success/10 border-success/30' : feedback.status === 'warning' ? 'bg-warning/10 border-warning/30' : 'bg-error/10 border-error/30'}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4
                      className={`font-bold text-base flex items-center gap-2 ${feedback.status === 'success' ? 'text-success' : feedback.status === 'warning' ? 'text-warning' : 'text-error'}`}
                    >
                      {feedback.status === 'success' && <CheckCircle2 className="w-5 h-5" />}
                      {feedback.status === 'warning' && <RefreshCw className="w-5 h-5" />}
                      {feedback.status === 'error' && <Type className="w-5 h-5" />}
                      Évaluation IA
                    </h4>
                    <span className="font-bold text-foreground bg-card px-3 py-1 rounded-xl border border-border text-sm">
                      {feedback.score}/{feedback.max}
                    </span>
                  </div>
                  <p className="text-foreground text-sm leading-relaxed">{feedback.message}</p>
                </div>

                {feedback.missing.length > 0 && (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1 uppercase tracking-wider">
                      <AlertCircle className="w-3.5 h-3.5" /> Axes d&apos;amélioration
                    </p>
                    <ul className="text-sm text-foreground/80 space-y-1">
                      {feedback.missing.map((item) => (
                        <li key={item}>- {item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1 uppercase tracking-wider">
                    <Star className="w-3.5 h-3.5" /> Correction attendue
                  </p>
                  <p className="text-sm text-foreground/90 leading-relaxed">{currentExercise.correction}</p>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleNext}
                    className="flex items-center px-6 py-3 bg-muted border border-border hover:bg-muted/80 text-foreground font-bold rounded-xl transition-colors gap-2"
                  >
                    Exercice suivant <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
