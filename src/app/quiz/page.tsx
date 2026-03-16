'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { BookOpen, Brain, GraduationCap, Loader2, Sparkles, Target } from 'lucide-react';
import { buildTuteurHref } from '@/lib/navigation/tuteur-link';
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
  { value: 'poesie', label: 'Poésie (Rimbaud, Ponge, Dorion)', group: "Objets d'étude" },
  { value: 'roman', label: 'Roman (Prévost, Balzac, Colette)', group: "Objets d'étude" },
  { value: 'theatre', label: 'Théâtre (Corneille, Musset, Sarraute)', group: "Objets d'étude" },
  { value: 'litterature_idees', label: "Littérature d'idées (La Boétie, Fontenelle, Graffigny)", group: "Objets d'étude" },
  { value: 'methode_commentaire', label: 'Méthode du commentaire', group: 'Méthodologie' },
  { value: 'methode_dissertation', label: 'Méthode de la dissertation', group: 'Méthodologie' },
  { value: 'oral_eaf', label: 'Oral EAF (méthode & déroulement)', group: 'Méthodologie' },
];

const THEME_GROUPS = ["Objets d'étude", 'Compétences transversales', 'Méthodologie'];

const EDITORIAL_HEADING = {
  fontFamily: "'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, serif",
};

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
      setError('Erreur réseau. Vérifie ta connexion et réessaie.');
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
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 md:p-8">
      <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[#17324d] px-6 py-7 text-[#f7f2ea] shadow-[0_32px_90px_rgba(23,50,77,0.22)] md:px-8 md:py-8 lg:px-10 lg:py-10">
        <div className="absolute inset-y-0 right-[-10%] hidden w-[42%] rounded-full bg-[radial-gradient(circle_at_center,_rgba(126,212,194,0.22),_transparent_72%)] blur-2xl lg:block" />
        <div className="absolute left-[-5%] top-[-20%] h-44 w-44 rounded-full bg-[rgba(216,163,99,0.16)] blur-3xl" />

        <div className="relative grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[#d7c4aa]">
              <Brain className="h-4 w-4" />
              Quiz adaptatif
            </div>
            <h1 style={EDITORIAL_HEADING} className="mt-5 max-w-4xl text-4xl leading-tight tracking-[-0.03em] text-white md:text-5xl lg:text-6xl">
              Des QCM courts pour fixer les repères utiles avant qu ils ne glissent hors du radar.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#dfe8f0] md:text-base">
              Choisis un thème, ajuste la difficulté, génère un bloc de questions et transforme le résultat en signal utile pour la suite de ton parcours.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            {[
              { label: 'Questions', value: String(nbQuestions).padStart(2, '0') },
              { label: 'Réponses', value: String(answeredCount).padStart(2, '0') },
              { label: 'Résultat', value: submitted ? `${score}%` : 'En attente' },
            ].map((item) => (
              <div key={item.label} className="rounded-[24px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d7c4aa]">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-[24px] border border-[#f1c8c0] bg-[#fff0ed] p-4 text-sm text-[#b24838]">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <section className="rounded-[30px] border border-[#e7dac6] bg-[linear-gradient(180deg,#fffdfa_0%,#fbf5ec_100%)] p-5 shadow-[0_20px_70px_rgba(23,50,77,0.08)]">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#17324d]/8 text-[#17324d]">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#9a6a37]">Configuration du quiz</p>
                <h2 style={EDITORIAL_HEADING} className="mt-2 text-3xl leading-tight tracking-[-0.02em] text-[#17324d]">
                  Paramètres de séance
                </h2>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="quiz-theme" className="mb-1.5 block text-sm font-semibold text-[#17324d]">
                  <BookOpen className="mr-1.5 inline h-4 w-4" /> Thème
                </label>
                <select
                  id="quiz-theme"
                  value={theme}
                  onChange={(event) => setTheme(event.target.value as QuizTheme)}
                  className="w-full rounded-[18px] border border-[#dfd1bc] bg-white px-3 py-3 text-sm text-[#17324d] outline-none transition focus:border-[#17324d]/18 focus:ring-2 focus:ring-[#17324d]/8"
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
                  <label htmlFor="quiz-difficulte" className="mb-1.5 block text-sm font-semibold text-[#17324d]">
                    <GraduationCap className="mr-1.5 inline h-4 w-4" /> Difficulté
                  </label>
                  <select
                    id="quiz-difficulte"
                    value={difficulte}
                    onChange={(event) => setDifficulte(Number(event.target.value) as 1 | 2 | 3)}
                    className="w-full rounded-[18px] border border-[#dfd1bc] bg-white px-3 py-3 text-sm text-[#17324d] outline-none transition focus:border-[#17324d]/18 focus:ring-2 focus:ring-[#17324d]/8"
                    disabled={isGenerating}
                  >
                    <option value={1}>Facile — Révision des bases</option>
                    <option value={2}>Intermédiaire — Niveau EAF</option>
                    <option value={3}>Difficile — Entraînement exigeant</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="quiz-nb-questions" className="mb-1.5 block text-sm font-semibold text-[#17324d]">
                    Nombre de questions
                  </label>
                  <select
                    id="quiz-nb-questions"
                    value={nbQuestions}
                    onChange={(event) => setNbQuestions(Number(event.target.value) as 5 | 10 | 20)}
                    className="w-full rounded-[18px] border border-[#dfd1bc] bg-white px-3 py-3 text-sm text-[#17324d] outline-none transition focus:border-[#17324d]/18 focus:ring-2 focus:ring-[#17324d]/8"
                    disabled={isGenerating}
                  >
                    <option value={5}>5 questions — Rapide</option>
                    <option value={10}>10 questions — Standard</option>
                    <option value={20}>20 questions — Complet</option>
                  </select>
                </div>
              </div>

              <button
                onClick={generate}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 rounded-[20px] bg-[#17324d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#244a6d] disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Composition du quiz en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Générer
                  </>
                )}
              </button>
            </div>
          </section>

          <section className="rounded-[28px] border border-[#d8e8e3] bg-[#edf7f3] p-5 shadow-[0_18px_55px_rgba(15,118,110,0.08)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#0f766e]">Usage conseillé</p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-[#33536f]">
              <p className="rounded-[20px] border border-[#d3e7e1] bg-white/88 px-4 py-4">Lance un quiz court avant un atelier pour réactiver les repères utiles.</p>
              <p className="rounded-[20px] border border-[#d3e7e1] bg-white/88 px-4 py-4">Lis l explication après validation : c est elle qui transforme le score en progrès réel.</p>
              <p className="rounded-[20px] border border-[#d3e7e1] bg-white/88 px-4 py-4">Un score faible n est pas un échec : c est un signal pour cibler la prochaine révision.</p>
            </div>
          </section>
        </aside>

        <section className="space-y-5">
          {activeThemeLabel && questions.length > 0 && (
            <div className="rounded-[24px] border border-[#e7dac6] bg-white px-5 py-4 shadow-[0_12px_30px_rgba(23,50,77,0.05)] text-sm text-[#5d7287]">
              Quiz : <span className="font-semibold text-[#17324d]">{activeThemeLabel}</span> — {questions.length} question{questions.length > 1 ? 's' : ''}
            </div>
          )}

          {questions.length === 0 ? (
            <section className="rounded-[30px] border border-dashed border-[#dbcdb7] bg-[#fffaf2] px-6 py-12 text-center">
              <Target className="mx-auto h-14 w-14 text-[#c0af96]" />
              <h2 style={EDITORIAL_HEADING} className="mt-4 text-3xl leading-tight tracking-[-0.02em] text-[#17324d]">
                Le bloc de questions apparaîtra ici.
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#6d7e8d]">
                Configure la séance puis génère un quiz pour passer d une intuition vague à un test rapide et exploitable.
              </p>
            </section>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <section key={question.id} className="rounded-[30px] border border-[#e7dac6] bg-[linear-gradient(180deg,#fffdfa_0%,#fbf5ec_100%)] p-5 shadow-[0_16px_40px_rgba(23,50,77,0.06)] md:p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#17324d]/8 text-sm font-semibold text-[#17324d]">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-base font-semibold leading-7 text-[#17324d]">{question.enonce}</h2>
                      <div className="mt-4 grid gap-2">
                        {question.options.map((option, optionIndex) => {
                          const checked = answers[question.id] === optionIndex;
                          const isGood = submitted && optionIndex === question.bonneReponse;
                          const isBad = submitted && checked && optionIndex !== question.bonneReponse;

                          return (
                            <label
                              key={`${question.id}-${optionIndex}`}
                              className={`rounded-[20px] border p-4 text-sm leading-7 transition ${isGood ? 'border-[#d6e8df] bg-[#edf7f3] text-[#0f766e] font-semibold' : isBad ? 'border-[#f1c8c0] bg-[#fff0ed] text-[#b24838]' : checked ? 'border-[#17324d]/18 bg-white text-[#17324d]' : 'border-[#eadbc5] bg-white text-[#33536f] hover:border-[#17324d]/18'}`}
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
                        <div className="mt-4 rounded-[20px] border border-[#d8e8e3] bg-[#edf7f3] p-4 text-sm leading-7 text-[#33536f]">
                          {question.explication}
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              ))}
            </div>
          )}

          {questions.length > 0 && (
            <div className="flex flex-wrap items-center gap-4">
              {!submitted ? (
                <button
                  onClick={finish}
                  className="rounded-[20px] bg-[#17324d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#244a6d]"
                >
                  Valider
                </button>
              ) : (
                <>
                  <div
                    className={`rounded-[20px] border px-4 py-3 text-sm font-semibold ${score >= 80 ? 'border-[#d6e8df] bg-[#edf7f3] text-[#0f766e]' : score >= 50 ? 'border-[#efd9b4] bg-[#fff7ea] text-[#af7a20]' : 'border-[#f1c8c0] bg-[#fff0ed] text-[#b24838]'}`}
                    role="status"
                    aria-live="polite"
                  >
                    Score : {score}%
                  </div>
                  <button
                    onClick={generate}
                    disabled={isGenerating}
                    className="rounded-[20px] border border-[#dfd1bc] bg-white px-4 py-3 text-sm font-semibold text-[#17324d] transition hover:border-[#17324d]/18"
                  >
                    Nouveau quiz
                  </button>
                  <Link
                    href={tutorHref}
                    className="rounded-[20px] border border-[#dfd1bc] bg-white px-4 py-3 text-sm font-semibold text-[#17324d] transition hover:border-[#0f766e] hover:text-[#0f766e]"
                  >
                    Reprendre ce thème avec le guidage
                  </Link>
                </>
              )}
            </div>
          )}
        </section>
      </div>

      <div className="fixed bottom-24 right-6 z-50 space-y-2 md:bottom-6">
        {badgeToasts.map((badge) => (
          <div key={badge} className="rounded-[18px] border border-[#d6e8df] bg-[#edf7f3] px-4 py-3 text-sm font-medium text-[#0f766e] shadow-[0_16px_32px_rgba(15,118,110,0.12)]" role="status" aria-live="polite">
            Badge débloqué : {badge}
          </div>
        ))}
      </div>
    </div>
  );
}
