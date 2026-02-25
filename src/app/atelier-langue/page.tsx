'use client';

import { useState } from 'react';
import { Type, CheckCircle2, RefreshCw, Activity, ArrowRight, BookOpen, Star, AlertCircle } from 'lucide-react';
import { useTrackInteraction } from '@/components/tracking/tracking-provider';
import { getCsrfTokenFromDocument } from '@/lib/security/csrf-client';

type Exercise = {
  id: 1 | 2;
  sentence: string;
  question: string;
  correction: string;
};

type LangueFeedback = {
  score: number;
  max: number;
  status: 'success' | 'warning' | 'error';
  message: string;
  missing: string[];
};

const EXERCISES: Exercise[] = [
  {
    id: 1,
    sentence: "J'ai vu la mer qui se retirait silencieusement.",
    question: 'Analysez la proposition subordonnée dans cette phrase.',
    correction:
      '« qui se retirait silencieusement » est une proposition subordonnée relative. Elle est introduite par le pronom relatif « qui », ayant pour antécédent le nom « mer ». Elle occupe la fonction de complément de l\'antécédent « mer ».',
  },
  {
    id: 2,
    sentence: "Si j'avais su, je ne serais pas venu.",
    question:
      'Quelle est la valeur du mode et du temps employés dans la proposition subordonnée ?',
    correction:
      "La proposition subordonnée de condition « Si j'avais su » est à l'indicatif plus-que-parfait. Elle exprime ici l'irréel du passé : une condition non réalisée dans le passé.",
  },
];

export default function AtelierLangue() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<LangueFeedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const trackInteraction = useTrackInteraction();

  const currentExercise = EXERCISES[currentIndex];
  const progressPercent = Math.round((completedCount / EXERCISES.length) * 100);

  const handleSubmit = async () => {
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
    trackInteraction('atelier_langue_next_exercise', {
      currentExerciseId: currentExercise.id,
    });
    setCurrentIndex((prev) => (prev + 1) % EXERCISES.length);
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
          <div className="text-sm font-bold text-foreground shrink-0">{completedCount}/{EXERCISES.length}</div>
        </div>
      </header>

      <div className="bg-card border border-border rounded-3xl shadow-sm overflow-hidden">
        <div className="p-5 bg-muted/30 border-b border-border flex justify-between items-center">
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center">
            <Activity className="w-4 h-4 mr-2" /> Exercice {currentIndex + 1}/{EXERCISES.length}
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
                    <AlertCircle className="w-3.5 h-3.5" /> Points manquants
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
                  <Star className="w-3.5 h-3.5" /> Correction attendue (Eduscol)
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
    </div>
  );
}
