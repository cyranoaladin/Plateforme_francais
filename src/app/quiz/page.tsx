'use client';

import { useMemo, useState } from 'react';
import { getCsrfTokenFromDocument } from '@/lib/security/csrf-client';

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
  const [theme, setTheme] = useState('grammaire');
  const [difficulte, setDifficulte] = useState<1 | 2 | 3>(2);
  const [nbQuestions, setNbQuestions] = useState<5 | 10 | 20>(5);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [badgeToasts, setBadgeToasts] = useState<string[]>([]);

  const score = useMemo(() => {
    if (!submitted || questions.length === 0) return 0;
    const good = questions.filter((q) => answers[q.id] === q.bonneReponse).length;
    return Math.round((good / questions.length) * 100);
  }, [answers, questions, submitted]);

  const generate = async () => {
    setSubmitted(false);
    setAnswers({});

    const response = await fetch('/api/v1/quiz/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': getCsrfTokenFromDocument(),
      },
      body: JSON.stringify({ theme, difficulte, nbQuestions }),
    });

    if (!response.ok) return;
    const payload = (await response.json()) as { questions: QuizQuestion[] };
    setQuestions(payload.questions);
  };

  const finish = async () => {
    setSubmitted(true);

    if (questions.length === 0) return;
    const good = questions.filter((q) => answers[q.id] === q.bonneReponse).length;
    const pct = (good / questions.length) * 100;

    if (pct < 60) {
      const profileResponse = await fetch('/api/v1/student/profile');
      if (!profileResponse.ok) return;

      const profile = (await profileResponse.json()) as Profile;
      const weak = Array.from(new Set([...profile.weakSkills, theme]));

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
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Quiz adaptatif</h1>

      <section className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="grid md:grid-cols-3 gap-3">
          <label htmlFor="quiz-theme" className="sr-only">Thème du quiz</label>
          <input id="quiz-theme" value={theme} onChange={(e) => setTheme(e.target.value)} className="border border-input rounded-lg bg-background px-3 py-2" placeholder="Thème" />
          <label htmlFor="quiz-difficulte" className="sr-only">Difficulté du quiz</label>
          <select id="quiz-difficulte" value={difficulte} onChange={(e) => setDifficulte(Number(e.target.value) as 1 | 2 | 3)} className="border border-input rounded-lg bg-background px-3 py-2">
            <option value={1}>Difficulté 1</option>
            <option value={2}>Difficulté 2</option>
            <option value={3}>Difficulté 3</option>
          </select>
          <label htmlFor="quiz-nb-questions" className="sr-only">Nombre de questions</label>
          <select id="quiz-nb-questions" value={nbQuestions} onChange={(e) => setNbQuestions(Number(e.target.value) as 5 | 10 | 20)} className="border border-input rounded-lg bg-background px-3 py-2">
            <option value={5}>5 questions</option>
            <option value={10}>10 questions</option>
            <option value={20}>20 questions</option>
          </select>
        </div>
        <button onClick={generate} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground">Générer</button>
      </section>

      <div className="space-y-4">
        {questions.map((question, idx) => (
          <section key={question.id} className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold">{idx + 1}. {question.enonce}</h2>
            <div className="mt-3 grid gap-2">
              {question.options.map((option, optionIndex) => {
                const checked = answers[question.id] === optionIndex;
                const isGood = submitted && optionIndex === question.bonneReponse;
                const isBad = submitted && checked && optionIndex !== question.bonneReponse;

                return (
                  <label key={`${question.id}-${optionIndex}`} className={`rounded border p-2 cursor-pointer ${isGood ? 'border-success bg-success/10' : isBad ? 'border-error bg-error/10' : 'border-border'}`}>
                    <input
                      type="radio"
                      name={question.id}
                      checked={checked}
                      onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }))}
                    />{' '}
                    {option}
                  </label>
                );
              })}
            </div>
            {submitted && <p className="mt-2 text-sm text-muted-foreground">{question.explication}</p>}
          </section>
        ))}
      </div>

      {questions.length > 0 && (
        <div className="flex items-center gap-3">
          <button onClick={finish} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground">Valider</button>
          {submitted && <span className="font-semibold" role="status" aria-live="polite">Score: {score}%</span>}
        </div>
      )}

      <div className="fixed bottom-24 md:bottom-6 right-6 z-50 space-y-2">
        {badgeToasts.map((badge) => (
          <div key={badge} className="rounded-lg border border-success/30 bg-success/10 px-4 py-2 text-sm shadow-lg" role="status" aria-live="polite">
            Badge débloqué: {badge}
          </div>
        ))}
      </div>
    </div>
  );
}
