'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { BookOpen, Brain, GraduationCap, Sparkles, Target } from 'lucide-react';
import { buildTuteurHref } from '@/lib/navigation/tuteur-link';
import { getCsrfToken } from '@/lib/security/csrf-client';
import { sanitizeLlmText } from '@/lib/ui/sanitize-llm';
import { Button } from '@/components/ui';
import { StateNotice } from '@/components/ui';

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
  { value: 'poesie', label: 'Poésie (Rimbaud, Ponge, Dorion)', group: "Objets d’étude" },
  { value: 'roman', label: 'Roman (Prévost, Balzac, Colette)', group: "Objets d’étude" },
  { value: 'theatre', label: 'Théâtre (Corneille, Musset, Sarraute)', group: "Objets d’étude" },
  { value: 'litterature_idees', label: "Littérature d’idées (La Boétie, Fontenelle, Graffigny)", group: "Objets d’étude" },
  { value: 'methode_commentaire', label: 'Méthode du commentaire', group: 'Méthodologie' },
  { value: 'methode_dissertation', label: 'Méthode de la dissertation', group: 'Méthodologie' },
  { value: 'oral_eaf', label: 'Oral EAF (méthode & déroulement)', group: 'Méthodologie' },
];

const THEME_GROUPS = ["Objets d’étude", 'Compétences transversales', 'Méthodologie'];

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
  const [upgradeUrl, setUpgradeUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeThemeLabel, setActiveThemeLabel] = useState<string | null>(null);

  const score = useMemo(() => {
    if (!submitted || questions.length === 0) return 0;
    const good = questions.filter((question) => answers[question.id] === question.bonneReponse).length;
    return Math.round((good / questions.length) * 100);
  }, [answers, questions, submitted]);

  const answeredCount = useMemo(
    () => Object.keys(answers).filter((key) => typeof answers[key] === 'number').length,
    [answers],
  );
  const selectedThemeMeta = useMemo(
    () => THEME_OPTIONS.find((item) => item.value === theme) ?? null,
    [theme],
  );
  const tutorHref = useMemo(
    () =>
      buildTuteurHref({
        parcours: activeThemeLabel ?? selectedThemeMeta?.label ?? null,
      }),
    [activeThemeLabel, selectedThemeMeta],
  );

  const generate = async () => {
    setSubmitted(false);
    setAnswers({});
    setError(null);
    setIsGenerating(true);
    setActiveThemeLabel(null);

    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch('/api/v1/quiz/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ theme, difficulte, nbQuestions }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string; upgradeUrl?: string };
        setError(body.error ?? 'La génération du quiz n\u2019a pas abouti. Réessaie dans un instant.');
        if (body.upgradeUrl) setUpgradeUrl(body.upgradeUrl);
        return;
      }
      const payload = (await response.json()) as { questions: QuizQuestion[]; theme?: string };
      setQuestions(payload.questions);
      setActiveThemeLabel(payload.theme ?? null);
    } catch {
      setError('La connexion a été interrompue. Vérifie ta connexion et réessaie.');
    } finally {
      setIsGenerating(false);
    }
  };

  const finish = async () => {
    setSubmitted(true);

    if (questions.length === 0) return;
    const good = questions.filter((question) => answers[question.id] === question.bonneReponse).length;
    const pct = (good / questions.length) * 100;

    const selectedOption = THEME_OPTIONS.find((item) => item.value === theme);
    const weakSkillLabel = selectedOption?.label ?? theme;

    if (pct < 60) {
      const csrfToken = await getCsrfToken();
      const profileResponse = await fetch('/api/v1/student/profile');
      if (!profileResponse.ok) return;

      const profile = (await profileResponse.json()) as Profile;
      const weak = Array.from(new Set([...profile.weakSkills, weakSkillLabel]));

      await fetch('/api/v1/student/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({ weakSkills: weak }),
      });
    }

    // Persist quiz evaluation to database
    const csrfToken = await getCsrfToken();
    await fetch('/api/v1/quiz/evaluate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({
        theme,
        score: good,
        maxScore: questions.length,
        questionsCount: questions.length,
      }),
    }).catch(() => undefined); // Non-blocking

    if (pct === 100) {
      const badgeResponse = await fetch('/api/v1/badges/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
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
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 md:p-8">
      <section className="hero-premium-panel relative overflow-hidden rounded-[24px] px-6 py-7 md:px-8 md:py-8 lg:px-10 lg:py-10">
        <div className="absolute inset-y-0 right-[-10%] hidden w-[42%] rounded-full bg-[radial-gradient(circle_at_center,_rgba(126,212,194,0.22),_transparent_72%)] blur-2xl lg:block" />
        <div className="absolute left-[-5%] top-[-20%] h-44 w-44 rounded-full bg-[rgba(216,163,99,0.16)] blur-3xl" />

        <div className="relative grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
          <div>
            <div className="hero-kicker">
              <Brain className="h-4 w-4" />
              Quiz adaptatif
            </div>
            <h1 className="font-display mt-5 max-w-4xl text-4xl leading-tight tracking-[-0.03em] text-white md:text-5xl lg:text-6xl">
              Des QCM courts pour fixer les repères utiles avant qu’ils ne glissent hors du radar.
            </h1>
            <p className="hero-body mt-4 max-w-3xl text-sm leading-7 md:text-base">
              Choisis un thème, ajuste la difficulté, génère un bloc de questions et transforme le résultat en signal utile pour la suite de ton parcours.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {[
              { label: 'Questions', value: String(nbQuestions).padStart(2, '0') },
              { label: 'Réponses', value: String(answeredCount).padStart(2, '0') },
              { label: 'Résultat', value: submitted ? `${score}%` : 'En attente' },
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
        <div className="space-y-3">
          <StateNotice
            title={upgradeUrl ? "Limite de ton plan atteinte" : "Le quiz n’a pas pu être généré"}
            description={error}
            variant={upgradeUrl ? "warning" : "error"}
            icon={Brain}
          />
          {upgradeUrl && (
            <Link href={upgradeUrl} className="inline-flex items-center gap-2 rounded-2xl bg-[var(--c-primary)] px-5 py-3 text-sm font-semibold text-white shadow-md transition-transform hover:scale-[1.02]">
              Découvrir les plans
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <section className="rounded-[24px] border border-[var(--border-default)] bg-[linear-gradient(180deg,var(--bg-surface)_0%,var(--bg-surface)_100%)] p-5 shadow-[var(--shadow-md)]">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--c-primary)]/8 text-[var(--c-primary)]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-reward)]">Configuration du quiz</p>
                <h2 className="font-display mt-2 text-3xl leading-tight tracking-[-0.02em] text-[var(--c-primary)]">
                  Paramètres de séance
                </h2>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="quiz-theme" className="mb-1.5 block text-sm font-semibold text-[var(--c-primary)]">
                  <BookOpen className="mr-1.5 inline h-4 w-4" /> Thème
                </label>
                <select
                  id="quiz-theme"
                  value={theme}
                  onChange={(event) => setTheme(event.target.value as QuizTheme)}
                  className="w-full appearance-none rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 py-3 text-sm text-[var(--c-primary)] outline-none transition-all duration-[var(--transition-normal)] focus:border-[var(--c-success)] focus:ring-2 focus:ring-[var(--c-success)]/20 disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={isGenerating}
                >
                  {THEME_GROUPS.map((group) => (
                    <optgroup key={group} label={group}>
                      {THEME_OPTIONS.filter((item) => item.group === group).map((item) => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                <div>
                  <label htmlFor="quiz-difficulte" className="mb-1.5 block text-sm font-semibold text-[var(--c-primary)]">
                    <GraduationCap className="mr-1.5 inline h-4 w-4" /> Difficulté
                  </label>
                  <select
                    id="quiz-difficulte"
                    value={difficulte}
                    onChange={(event) => setDifficulte(Number(event.target.value) as 1 | 2 | 3)}
                    className="w-full appearance-none rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 py-3 text-sm text-[var(--c-primary)] outline-none transition-all duration-[var(--transition-normal)] focus:border-[var(--c-success)] focus:ring-2 focus:ring-[var(--c-success)]/20 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={isGenerating}
                  >
                    <option value={1}>Facile — Révision des bases</option>
                    <option value={2}>Intermédiaire — Niveau EAF</option>
                    <option value={3}>Difficile — Entraînement exigeant</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="quiz-nb-questions" className="mb-1.5 block text-sm font-semibold text-[var(--c-primary)]">
                    Nombre de questions
                  </label>
                  <select
                    id="quiz-nb-questions"
                    value={nbQuestions}
                    onChange={(event) => setNbQuestions(Number(event.target.value) as 5 | 10 | 20)}
                    className="w-full appearance-none rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 py-3 text-sm text-[var(--c-primary)] outline-none transition-all duration-[var(--transition-normal)] focus:border-[var(--c-success)] focus:ring-2 focus:ring-[var(--c-success)]/20 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={isGenerating}
                  >
                    <option value={5}>5 questions — Rapide</option>
                    <option value={10}>10 questions — Standard</option>
                    <option value={20}>20 questions — Complet</option>
                  </select>
                </div>
              </div>

              <Button
                onClick={generate}
                loading={isGenerating}
                icon={<Sparkles className="h-4 w-4" />}
                size="lg"
              >
                {isGenerating ? 'Composition du quiz en cours...' : 'Générer'}
              </Button>
            </div>
          </section>

          <section className="rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-surface-secondary)] p-5 shadow-[var(--shadow-md)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-primary)]">Usage conseillé</p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--text-body)]">
              <p className="rounded-[20px] border border-[var(--border-strong)] bg-white/88 px-4 py-4">Lance un quiz court avant un atelier pour réactiver les repères utiles.</p>
              <p className="rounded-[20px] border border-[var(--border-strong)] bg-white/88 px-4 py-4">Lis l'explication après validation : c'est elle qui transforme le score en progrès réel.</p>
              <p className="rounded-[20px] border border-[var(--border-strong)] bg-white/88 px-4 py-4">Un score faible n'est pas un échec : c'est un signal pour cibler la prochaine révision.</p>
            </div>
          </section>
        </aside>

        <section className="space-y-5">
          {activeThemeLabel && questions.length > 0 && (
            <div className="rounded-[24px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-5 py-4 shadow-[var(--shadow-md)] text-sm text-[var(--text-secondary)]">
              Quiz : <span className="font-semibold text-[var(--c-primary)]">{activeThemeLabel}</span> — {questions.length} question{questions.length > 1 ? 's' : ''}
            </div>
          )}

          {questions.length === 0 ? (
            <StateNotice
              title="Le bloc de questions apparaîtra ici"
              description="Configure la séance puis génère un quiz pour passer d’une intuition vague à un test rapide et exploitable."
              variant="empty"
              icon={Target}
              center
              className="px-6 py-12"
            />
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <section key={question.id} className="rounded-[24px] border border-[var(--border-default)] bg-[linear-gradient(180deg,var(--bg-surface)_0%,var(--bg-surface)_100%)] p-5 shadow-[var(--shadow-md)] md:p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--c-primary)]/8 text-sm font-semibold text-[var(--c-primary)]">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-base font-semibold leading-7 text-[var(--c-primary)]">{sanitizeLlmText(question.enonce)}</h2>
                      <div className="mt-4 grid gap-2">
                        {question.options.map((option, optionIndex) => {
                          const checked = answers[question.id] === optionIndex;
                          const isGood = submitted && optionIndex === question.bonneReponse;
                          const isBad = submitted && checked && optionIndex !== question.bonneReponse;

                          return (
                            <label
                              key={`${question.id}-${optionIndex}`}
                              className={`cursor-pointer rounded-[20px] border p-4 text-sm leading-7 transition-all duration-[var(--transition-normal)] focus-within:ring-2 focus-within:ring-[var(--c-success)]/20 ${isGood ? 'border-[var(--border-success)] bg-[var(--bg-success)] text-[var(--c-success)] font-semibold' : isBad ? 'border-[var(--border-accent)] bg-[var(--c-accent-subtle)] text-[var(--c-accent)]' : checked ? 'border-[var(--c-primary)]/18 bg-[var(--bg-surface)] text-[var(--c-primary)]' : 'border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-body)] hover:border-[var(--c-primary)]/18'}`}
                            >
                              <input
                                type="radio"
                                name={question.id}
                                checked={checked}
                                onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }))}
                                disabled={submitted}
                                className="mr-2"
                              />
                              {sanitizeLlmText(option)}
                            </label>
                          );
                        })}
                      </div>
                      {submitted && (
                        <div className="mt-4 rounded-[20px] border border-[var(--border-success)] bg-[var(--bg-success)] p-4 text-sm leading-7 text-[var(--text-body)]">
                          {sanitizeLlmText(question.explication)}
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              ))}
            </div>
          )}

          {questions.length > 0 && (
            <div className="rounded-[24px] border border-[var(--border-default)] bg-[linear-gradient(180deg,var(--bg-surface)_0%,var(--bg-surface)_100%)] p-5 shadow-[var(--shadow-md)]">
              {!submitted ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-[var(--text-secondary)]">
                    {answeredCount} / {questions.length} question{questions.length > 1 ? 's' : ''} répondue{answeredCount > 1 ? 's' : ''}
                  </p>
                  <Button onClick={finish} size="lg" className="min-h-[44px]">
                    Valider mes réponses
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold ${score >= 80 ? 'bg-[var(--bg-success)] text-[var(--c-success)]' : score >= 50 ? 'bg-[var(--bg-reward)] text-[var(--c-reward)]' : 'bg-[var(--c-accent-subtle)] text-[var(--c-accent)]'}`} role="status" aria-live="polite">
                      {score}%
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--c-primary)]">
                        {score >= 80 ? 'Excellent travail !' : score >= 50 ? 'Des bases solides, continue.' : 'Ce thème mérite une révision ciblée.'}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {questions.filter((q) => answers[q.id] === q.bonneReponse).length} bonne{questions.filter((q) => answers[q.id] === q.bonneReponse).length > 1 ? 's' : ''} réponse{questions.filter((q) => answers[q.id] === q.bonneReponse).length > 1 ? 's' : ''} sur {questions.length}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      onClick={generate}
                      disabled={isGenerating}
                      variant="secondary"
                      className="min-h-[44px]"
                    >
                      Nouveau quiz
                    </Button>
                    <Link
                      href={tutorHref}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--c-primary)] transition hover:border-[var(--c-success)] hover:text-[var(--c-success)]"
                    >
                      Reprendre ce thème avec le guidage
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      <div className="fixed bottom-24 right-6 z-50 space-y-2 md:bottom-6">
        {badgeToasts.map((badge) => (
          <div key={badge} className="rounded-[16px] border border-[var(--border-success)] bg-[var(--bg-success)] px-4 py-3 text-sm font-medium text-[var(--c-success)] shadow-[var(--shadow-md)]" role="status" aria-live="polite">
            Badge débloqué : {badge}
          </div>
        ))}
      </div>
    </div>
  );
}
