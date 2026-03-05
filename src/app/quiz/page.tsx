'use client';

import { useMemo, useState } from 'react';
import { Brain, BookOpen, Sparkles, GraduationCap, Loader2 } from 'lucide-react';
import { getCsrfTokenFromDocument } from '@/lib/security/csrf-client';

type QuizTheme =
  | 'grammaire'
  | 'figures_de_style'
  | 'mouvements_litteraires'
  | 'poesie'
  | 'roman'
  | 'theatre'
  | 'litterature_idees'
  | 'methode_commentaire'
  | 'methode_dissertation'
  | 'oral_eaf';

type ThemeOption = {
  value: QuizTheme;
  label: string;
  group: string;
};

const THEME_OPTIONS: ThemeOption[] = [
  { value: 'grammaire', label: 'Grammaire EAF', group: 'Compétences transversales' },
  { value: 'figures_de_style', label: 'Figures de style', group: 'Compétences transversales' },
  { value: 'mouvements_litteraires', label: 'Mouvements littéraires', group: 'Compétences transversales' },
  { value: 'poesie', label: 'Poésie (Rimbaud, Ponge, Dorion)', group: 'Objets d\'étude' },
  { value: 'roman', label: 'Roman (Prévost, Balzac, Colette)', group: 'Objets d\'étude' },
  { value: 'theatre', label: 'Théâtre (Corneille, Musset, Sarraute)', group: 'Objets d\'étude' },
  { value: 'litterature_idees', label: 'Littérature d\'idées (La Boétie, Fontenelle, Graffigny)', group: 'Objets d\'étude' },
  { value: 'methode_commentaire', label: 'Méthode du commentaire', group: 'Méthodologie' },
  { value: 'methode_dissertation', label: 'Méthode de la dissertation', group: 'Méthodologie' },
  { value: 'oral_eaf', label: 'Oral EAF (méthode & déroulement)', group: 'Méthodologie' },
];

const THEME_GROUPS = ['Objets d\'étude', 'Compétences transversales', 'Méthodologie'];

type QuizQuestion = {
  id: string;
  enonce: string;
  options: string[];
  bonneReponse: 0 | 1 | 2 | 3;
  explication: string;
};

type Profile = {
  displayName: string;
  classLevel: string;
  targetScore: string;
  onboardingCompleted: boolean;
  selectedOeuvres: string[];
  parcoursProgress: string[];
  preferredObjects: string[];
  weakSkills: string[];
};

export default function QuizPage() {
  const [theme, setTheme] = useState<QuizTheme>('grammaire');
  const [difficulte, setDifficulte] = useState<1 | 2 | 3>(2);
  const [nbQuestions, setNbQuestions] = useState<5 | 10 | 20>(5);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [badgeToasts, setBadgeToasts] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeThemeLabel, setActiveThemeLabel] = useState<string | null>(null);

  const score = useMemo(() => {
    if (!submitted || questions.length === 0) return 0;
    const good = questions.filter((q) => answers[q.id] === q.bonneReponse).length;
    return Math.round((good / questions.length) * 100);
  }, [answers, questions, submitted]);

  const generate = async () => {
    setSubmitted(false);
    setAnswers({});
    setError(null);
    setIsGenerating(true);
    setActiveThemeLabel(null);

    try {
      const response = await fetch('/api/v1/quiz/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfTokenFromDocument(),
        },
        body: JSON.stringify({ theme, difficulte, nbQuestions }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? 'Impossible de générer le quiz. Réessayez.');
        return;
      }
      const payload = (await response.json()) as { questions: QuizQuestion[]; theme?: string };
      setQuestions(payload.questions);
      setActiveThemeLabel(payload.theme ?? null);
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion et réessayez.');
    } finally {
      setIsGenerating(false);
    }
  };

  const finish = async () => {
    setSubmitted(true);

    if (questions.length === 0) return;
    const good = questions.filter((q) => answers[q.id] === q.bonneReponse).length;
    const pct = (good / questions.length) * 100;

    const selectedOption = THEME_OPTIONS.find((t) => t.value === theme);
    const weakSkillLabel = selectedOption?.label ?? theme;

    if (pct < 60) {
      const profileResponse = await fetch('/api/v1/student/profile');
      if (!profileResponse.ok) return;

      const profile = (await profileResponse.json()) as Profile;
      const weak = Array.from(new Set([...profile.weakSkills, weakSkillLabel]));

      await fetch('/api/v1/student/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfTokenFromDocument(),
        },
        body: JSON.stringify({ weakSkills: weak }),
      });
    }

    if (pct === 100) {
      const badgeResponse = await fetch('/api/v1/badges/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfTokenFromDocument(),
        },
        body: JSON.stringify({ trigger: 'quiz_perfect' }),
      });

      if (badgeResponse.ok) {
        const payload = (await badgeResponse.json()) as { newBadges?: string[] };
        if (payload.newBadges && payload.newBadges.length > 0) {
          setBadgeToasts(payload.newBadges);
          setTimeout(() => setBadgeToasts([]), 4500);
        }
      }
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <header className="flex items-center gap-4 mb-2">
        <div className="w-14 h-14 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-2xl flex items-center justify-center shrink-0">
          <Brain className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Quiz adaptatif</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Questions QCM générées par IA à partir du programme officiel EAF.
          </p>
        </div>
      </header>

      <section className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> Configuration du quiz
        </h2>

        <div className="space-y-3">
          <div>
            <label htmlFor="quiz-theme" className="block text-sm font-semibold text-foreground mb-1.5">
              <BookOpen className="w-4 h-4 inline mr-1.5" />Thème
            </label>
            <select
              id="quiz-theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value as QuizTheme)}
              className="w-full border border-input rounded-xl bg-background px-3 py-2.5 text-sm text-foreground"
              disabled={isGenerating}
            >
              {THEME_GROUPS.map((group) => (
                <optgroup key={group} label={group}>
                  {THEME_OPTIONS.filter((t) => t.group === group).map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="quiz-difficulte" className="block text-sm font-semibold text-foreground mb-1.5">
                <GraduationCap className="w-4 h-4 inline mr-1.5" />Difficulté
              </label>
              <select
                id="quiz-difficulte"
                value={difficulte}
                onChange={(e) => setDifficulte(Number(e.target.value) as 1 | 2 | 3)}
                className="w-full border border-input rounded-xl bg-background px-3 py-2.5 text-sm"
                disabled={isGenerating}
              >
                <option value={1}>Facile — Révision des bases</option>
                <option value={2}>Intermédiaire — Niveau EAF</option>
                <option value={3}>Difficile — Entraînement exigeant</option>
              </select>
            </div>
            <div>
              <label htmlFor="quiz-nb-questions" className="block text-sm font-semibold text-foreground mb-1.5">
                Nombre de questions
              </label>
              <select
                id="quiz-nb-questions"
                value={nbQuestions}
                onChange={(e) => setNbQuestions(Number(e.target.value) as 5 | 10 | 20)}
                className="w-full border border-input rounded-xl bg-background px-3 py-2.5 text-sm"
                disabled={isGenerating}
              >
                <option value={5}>5 questions — Rapide</option>
                <option value={10}>10 questions — Standard</option>
                <option value={20}>20 questions — Complet</option>
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={generate}
          disabled={isGenerating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700 transition-colors disabled:opacity-50 shadow-md text-sm"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Génération IA en cours...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> Générer le quiz
            </>
          )}
        </button>
      </section>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {activeThemeLabel && questions.length > 0 && (
        <div className="text-sm text-muted-foreground font-medium">
          Quiz : <span className="text-foreground font-bold">{activeThemeLabel}</span> — {questions.length} question{questions.length > 1 ? 's' : ''}
        </div>
      )}

      <div className="space-y-4">
        {questions.map((question, idx) => (
          <section key={question.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="font-semibold text-foreground">{idx + 1}. {question.enonce}</h2>
            <div className="mt-3 grid gap-2">
              {question.options.map((option, optionIndex) => {
                const checked = answers[question.id] === optionIndex;
                const isGood = submitted && optionIndex === question.bonneReponse;
                const isBad = submitted && checked && optionIndex !== question.bonneReponse;

                return (
                  <label
                    key={`${question.id}-${optionIndex}`}
                    className={`rounded-xl border p-3 cursor-pointer transition-colors text-sm ${
                      isGood
                        ? 'border-success bg-success/10 font-semibold'
                        : isBad
                          ? 'border-error bg-error/10'
                          : checked
                            ? 'border-violet-500 bg-violet-500/5'
                            : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      checked={checked}
                      onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }))}
                      disabled={submitted}
                      className="mr-2"
                    />
                    {option}
                  </label>
                );
              })}
            </div>
            {submitted && (
              <p className="mt-3 text-sm text-muted-foreground bg-muted/30 p-3 rounded-xl border border-border">
                {question.explication}
              </p>
            )}
          </section>
        ))}
      </div>

      {questions.length > 0 && (
        <div className="flex items-center gap-4">
          {!submitted ? (
            <button
              onClick={finish}
              className="px-5 py-2.5 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-700 transition-colors shadow-md text-sm"
            >
              Valider mes réponses
            </button>
          ) : (
            <>
              <div
                className={`px-4 py-2 rounded-xl font-bold text-sm ${
                  score >= 80
                    ? 'bg-success/10 text-success border border-success/30'
                    : score >= 50
                      ? 'bg-warning/10 text-warning border border-warning/30'
                      : 'bg-error/10 text-error border border-error/30'
                }`}
                role="status"
                aria-live="polite"
              >
                Score : {score}%
              </div>
              <button
                onClick={generate}
                disabled={isGenerating}
                className="px-4 py-2 rounded-xl bg-muted border border-border hover:bg-muted/80 text-foreground font-bold transition-colors text-sm"
              >
                Nouveau quiz
              </button>
            </>
          )}
        </div>
      )}

      <div className="fixed bottom-24 md:bottom-6 right-6 z-50 space-y-2">
        {badgeToasts.map((badge) => (
          <div key={badge} className="rounded-lg border border-success/30 bg-success/10 px-4 py-2 text-sm shadow-lg" role="status" aria-live="polite">
            Badge débloqué : {badge}
          </div>
        ))}
      </div>
    </div>
  );
}
