'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { BookOpen, Brain, GraduationCap, Hash, Sparkles, Target } from '@/components/ui/icons';
import { buildTuteurHref } from '@/lib/navigation/tuteur-link';
import { getCsrfToken } from '@/lib/security/csrf-client';
import { sanitizeLlmText } from '@/lib/ui/sanitize-llm';
import { Button, StateNotice } from '@/components/ui';

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
  { value: 'poesie', label: 'Poésie (Rimbaud, Ponge, Dorion)', group: "Objets d'étude" },
  { value: 'roman', label: 'Roman (Prévost, Balzac, Colette)', group: "Objets d'étude" },
  { value: 'theatre', label: 'Théâtre (Corneille, Musset, Sarraute)', group: "Objets d'étude" },
  { value: 'litterature_idees', label: "Littérature d'idées (La Boétie, Fontenelle, Graffigny)", group: "Objets d'étude" },
  { value: 'methode_commentaire', label: 'Méthode du commentaire', group: 'Méthodologie' },
  { value: 'methode_dissertation', label: 'Méthode de la dissertation', group: 'Méthodologie' },
  { value: 'oral_eaf', label: 'Oral EAF (méthode & déroulement)', group: 'Méthodologie' },
];

const THEME_GROUPS = ["Objets d'étude", 'Compétences transversales', 'Méthodologie'];

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
    [answers]
  );
  const selectedThemeMeta = useMemo(
    () => THEME_OPTIONS.find((item) => item.value === theme) ?? null,
    [theme]
  );
  const tutorHref = useMemo(
    () =>
      buildTuteurHref({
        parcours: activeThemeLabel ?? selectedThemeMeta?.label ?? null,
      }),
    [activeThemeLabel, selectedThemeMeta]
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
        setError(body.error ?? 'La génération du quiz n\'a pas abouti. Réessaie dans un instant.');
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
                background: 'rgba(123, 142, 255, 0.12)',
                color: 'var(--eaf-indigo)',
              }}
            >
              <Brain className="h-4 w-4" />
              Quiz adaptatif
            </div>
            <h1
              className="mt-5 max-w-4xl text-4xl leading-tight text-white md:text-[44px]"
              style={{ fontFamily: 'var(--font-heading, Fraunces, serif)', letterSpacing: '-1.5px' }}
            >
              Des QCM courts pour fixer les repères utiles avant qu'ils ne glissent hors du radar.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 md:text-base">
              Choisis un thème, ajuste la difficulté, génère un bloc de questions et transforme le résultat en signal utile pour la suite de ton parcours.
            </p>
          </div>

          {/* Stats */}
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {[
              { label: 'Questions', value: String(nbQuestions).padStart(2, '0'), color: 'gold' as const },
              { label: 'Réponses', value: String(answeredCount).padStart(2, '0'), color: 'indigo' as const },
              { label: 'Résultat', value: submitted ? `${score}%` : 'En attente', color: submitted ? 'teal' : ('fg3' as const) },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl px-4 py-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <p
                  className="text-[11px] font-semibold uppercase tracking-[0.2em]"
                  style={{ color: item.color === 'fg3' ? 'var(--eaf-fg3)' : `var(--eaf-${item.color})` }}
                >
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <div className="space-y-3">
          <StateNotice
            title={upgradeUrl ? 'Limite de ton plan atteinte' : 'Le quiz n\'a pas pu être généré'}
            description={error}
            variant={upgradeUrl ? 'warning' : 'error'}
            icon={Brain}
          />
          {upgradeUrl && (
            <Link
              href={upgradeUrl}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold shadow-md transition-transform hover:scale-[1.02]"
              style={{ background: 'var(--eaf-orange)', color: '#050913' }}
            >
              Découvrir les plans
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Configuration */}
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
                  Configuration du quiz
                </p>
                <h2
                  className="mt-2 text-3xl leading-tight text-[var(--eaf-fg0)]"
                  style={{ fontFamily: 'var(--font-heading, Fraunces, serif)', letterSpacing: '-1px' }}
                >
                  Paramètres de séance
                </h2>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {/* Thème */}
              <div>
                <label
                  htmlFor="quiz-theme"
                  className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-[var(--eaf-fg0)]"
                >
                  <BookOpen className="h-4 w-4 text-[var(--eaf-fg3)]" /> Thème
                </label>
                <select
                  id="quiz-theme"
                  value={theme}
                  onChange={(event) => setTheme(event.target.value as QuizTheme)}
                  disabled={isGenerating}
                  className="w-full appearance-none rounded-lg border px-3 py-3 text-sm outline-none transition-all focus:border-[var(--eaf-indigo)] focus:ring-2 focus:ring-[var(--eaf-indigo)]/20 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    borderColor: 'rgba(123, 142, 255, 0.2)',
                    background: 'var(--eaf-bg1)',
                    color: 'var(--eaf-fg0)',
                  }}
                >
                  {THEME_GROUPS.map((group) => (
                    <optgroup key={group} label={group}>
                      {THEME_OPTIONS.filter((item) => item.group === group).map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                {/* Difficulté */}
                <div>
                  <label
                    htmlFor="quiz-difficulte"
                    className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-[var(--eaf-fg0)]"
                  >
                    <GraduationCap className="h-4 w-4 text-[var(--eaf-fg3)]" /> Difficulté
                  </label>
                  <select
                    id="quiz-difficulte"
                    value={difficulte}
                    onChange={(event) => setDifficulte(Number(event.target.value) as 1 | 2 | 3)}
                    disabled={isGenerating}
                    className="w-full appearance-none rounded-lg border px-3 py-3 text-sm outline-none transition-all focus:border-[var(--eaf-indigo)] focus:ring-2 focus:ring-[var(--eaf-indigo)]/20 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      borderColor: 'rgba(123, 142, 255, 0.2)',
                      background: 'var(--eaf-bg1)',
                      color: 'var(--eaf-fg0)',
                    }}
                  >
                    <option value={1}>Facile — Révision des bases</option>
                    <option value={2}>Intermédiaire — Niveau EAF</option>
                    <option value={3}>Difficile — Entraînement exigeant</option>
                  </select>
                </div>

                {/* Nombre de questions */}
                <div>
                  <label
                    htmlFor="quiz-nb-questions"
                    className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-[var(--eaf-fg0)]"
                  >
                    <Hash className="h-4 w-4 text-[var(--eaf-fg3)]" /> Nombre de questions
                  </label>
                  <select
                    id="quiz-nb-questions"
                    value={nbQuestions}
                    onChange={(event) => setNbQuestions(Number(event.target.value) as 5 | 10 | 20)}
                    disabled={isGenerating}
                    className="w-full appearance-none rounded-lg border px-3 py-3 text-sm outline-none transition-all focus:border-[var(--eaf-indigo)] focus:ring-2 focus:ring-[var(--eaf-indigo)]/20 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      borderColor: 'rgba(123, 142, 255, 0.2)',
                      background: 'var(--eaf-bg1)',
                      color: 'var(--eaf-fg0)',
                    }}
                  >
                    <option value={5}>5 questions — Rapide</option>
                    <option value={10}>10 questions — Standard</option>
                    <option value={20}>20 questions — Complet</option>
                  </select>
                </div>
              </div>

              {/* Bouton Générer */}
              <Button
                onClick={generate}
                loading={isGenerating}
                icon={<Sparkles className="h-4 w-4" />}
                size="lg"
                className="w-full rounded-xl font-semibold"
                style={{
                  background: 'var(--eaf-orange)',
                  color: '#050913',
                }}
              >
                {isGenerating ? 'Composition du quiz en cours...' : 'Générer'}
              </Button>
            </div>
          </section>

          {/* Usage conseillé */}
          <section
            className="rounded-xl p-5"
            style={{
              background: 'var(--eaf-bg2)',
              border: '1px solid rgba(123, 142, 255, 0.12)',
            }}
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--eaf-gold)]">
              Usage conseillé
            </p>
            <div className="mt-4 space-y-2">
              {[
                'Lance un quiz court avant un atelier pour réactiver les repères utiles.',
                "Lis l'explication après validation : c'est elle qui transforme le score en progrès réel.",
                "Un score faible n'est pas un échec : c'est un signal pour cibler la prochaine révision.",
              ].map((tip) => (
                <div
                  key={tip}
                  className="rounded-lg border-l-2 px-3 py-3 text-sm leading-6"
                  style={{
                    borderLeftColor: 'var(--eaf-gold)',
                    background: 'var(--eaf-bg1)',
                    color: 'var(--eaf-fg2)',
                  }}
                >
                  {tip}
                </div>
              ))}
            </div>
          </section>
        </aside>

        {/* Zone questions */}
        <section className="space-y-5">
          {activeThemeLabel && questions.length > 0 && (
            <div
              className="rounded-xl border px-5 py-4 text-sm"
              style={{
                background: 'var(--eaf-bg2)',
                borderColor: 'rgba(123, 142, 255, 0.12)',
                color: 'var(--eaf-fg2)',
              }}
            >
              Quiz : <span className="font-semibold text-[var(--eaf-fg0)]">{activeThemeLabel}</span> —{' '}
              {questions.length} question{questions.length > 1 ? 's' : ''}
            </div>
          )}

          {questions.length === 0 ? (
            <div
              className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border p-10"
              style={{
                background: 'var(--eaf-bg1)',
                borderColor: 'rgba(123, 142, 255, 0.12)',
              }}
            >
              <div
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl"
                style={{ background: 'var(--eaf-bg3)', border: '1px solid rgba(123, 142, 255, 0.1)' }}
              >
                <Target className="h-6 w-6" style={{ color: 'var(--eaf-fg3)' }} />
              </div>
              <h3
                className="text-center text-lg font-semibold text-[var(--eaf-fg0)]"
                style={{ fontFamily: 'var(--font-heading, Fraunces, serif)' }}
              >
                Le bloc de questions apparaîtra ici
              </h3>
              <p className="mt-2 max-w-[380px] text-center text-sm leading-6 text-[var(--eaf-fg2)]">
                Configure la séance puis génère un quiz pour passer d'une intuition vague à un test rapide et exploitable.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <section
                  key={question.id}
                  className="rounded-xl border p-5"
                  style={{
                    background: 'var(--eaf-bg1)',
                    borderColor: 'rgba(123, 142, 255, 0.12)',
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-semibold"
                      style={{
                        background: 'var(--eaf-indigo)/10',
                        color: 'var(--eaf-indigo)',
                      }}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-base font-semibold leading-7 text-[var(--eaf-fg0)]">
                        {sanitizeLlmText(question.enonce)}
                      </h2>
                      <div className="mt-4 grid gap-2">
                        {question.options.map((option, optionIndex) => {
                          const checked = answers[question.id] === optionIndex;
                          const isGood = submitted && optionIndex === question.bonneReponse;
                          const isBad = submitted && checked && optionIndex !== question.bonneReponse;

                          return (
                            <label
                              key={`${question.id}-${optionIndex}`}
                              className="cursor-pointer rounded-lg border p-4 text-sm leading-7 transition-all"
                              style={{
                                background: isGood
                                  ? 'var(--eaf-teal)/10'
                                  : isBad
                                    ? 'rgba(239, 68, 68, 0.08)'
                                    : checked
                                      ? 'var(--eaf-indigo)/10'
                                      : 'var(--eaf-bg2)',
                                borderColor: isGood
                                  ? 'var(--eaf-teal)'
                                  : isBad
                                    ? 'rgba(239, 68, 68, 0.4)'
                                    : checked
                                      ? 'var(--eaf-indigo)'
                                      : 'rgba(123, 142, 255, 0.15)',
                                color: isGood
                                  ? 'var(--eaf-teal)'
                                  : isBad
                                    ? '#EF4444'
                                    : checked
                                      ? 'var(--eaf-fg0)'
                                      : 'var(--eaf-fg2)',
                              }}
                            >
                              <input
                                type="radio"
                                name={question.id}
                                checked={checked}
                                onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }))}
                                disabled={submitted}
                                className="mr-3"
                              />
                              {sanitizeLlmText(option)}
                            </label>
                          );
                        })}
                      </div>
                      {submitted && (
                        <div
                          className="mt-4 rounded-lg border p-4 text-sm leading-7"
                          style={{
                            background: 'var(--eaf-teal)/5',
                            borderColor: 'var(--eaf-teal)/20',
                            color: 'var(--eaf-fg1)',
                          }}
                        >
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
            <div
              className="rounded-xl border p-5"
              style={{
                background: 'var(--eaf-bg1)',
                borderColor: 'rgba(123, 142, 255, 0.12)',
              }}
            >
              {!submitted ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-[var(--eaf-fg2)]">
                    {answeredCount} / {questions.length} question{questions.length > 1 ? 's' : ''} répondue{answeredCount > 1 ? 's' : ''}
                  </p>
                  <Button
                    onClick={finish}
                    size="lg"
                    className="min-h-[44px] rounded-xl font-semibold"
                    style={{
                      background: 'var(--eaf-orange)',
                      color: '#050913',
                    }}
                  >
                    Valider mes réponses
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-lg font-bold"
                      role="status"
                      aria-live="polite"
                      style={{
                        background:
                          score >= 80 ? 'var(--eaf-teal)/15' : score >= 50 ? 'var(--eaf-gold)/15' : 'rgba(239, 68, 68, 0.15)',
                        color: score >= 80 ? 'var(--eaf-teal)' : score >= 50 ? 'var(--eaf-gold)' : '#EF4444',
                      }}
                    >
                      {score}%
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--eaf-fg0)]">
                        {score >= 80
                          ? 'Excellent travail !'
                          : score >= 50
                            ? 'Des bases solides, continue.'
                            : 'Ce thème mérite une révision ciblée.'}
                      </p>
                      <p className="text-xs text-[var(--eaf-fg3)]">
                        {questions.filter((q) => answers[q.id] === q.bonneReponse).length} bonne
                        {questions.filter((q) => answers[q.id] === q.bonneReponse).length > 1 ? 's' : ''} réponse
                        {questions.filter((q) => answers[q.id] === q.bonneReponse).length > 1 ? 's' : ''} sur {questions.length}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      onClick={generate}
                      disabled={isGenerating}
                      size="md"
                      className="min-h-[44px] rounded-xl border font-semibold"
                      style={{
                        borderColor: 'rgba(123, 142, 255, 0.2)',
                        background: 'var(--eaf-bg2)',
                        color: 'var(--eaf-fg1)',
                      }}
                    >
                      Nouveau quiz
                    </Button>
                    <Link
                      href={tutorHref}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-xl border px-5 py-2.5 text-sm font-semibold transition hover:border-[var(--eaf-teal)] hover:text-[var(--eaf-teal)]"
                      style={{
                        borderColor: 'rgba(123, 142, 255, 0.2)',
                        background: 'var(--eaf-bg2)',
                        color: 'var(--eaf-fg0)',
                      }}
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

      {/* Toast notifications */}
      <div className="fixed bottom-24 right-6 z-50 space-y-2 md:bottom-6">
        {badgeToasts.map((badge) => (
          <div
            key={badge}
            className="rounded-lg border px-4 py-3 text-sm font-medium shadow-lg"
            role="status"
            aria-live="polite"
            style={{
              background: 'var(--eaf-bg2)',
              borderColor: 'var(--eaf-teal)',
              color: 'var(--eaf-teal)',
            }}
          >
            Badge débloqué : {badge}
          </div>
        ))}
      </div>
    </div>
  );
}
