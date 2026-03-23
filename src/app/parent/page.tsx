'use client';

import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flame,
  GraduationCap,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import { ProgressionChart } from '@/components/dashboard/progression-chart';
import { useDashboard } from '@/hooks/useDashboard';

const EDITORIAL_HEADING = {
  fontFamily: "var(--font-display)",
};

const SKILL_LABELS: Record<string, string> = {
  oral: 'Oral',
  ecrit: 'Écrit',
  grammaire: 'Langue & grammaire',
  lectureCursive: 'Lecture cursive',
};

function scoreFromEvent(event: {
  payload?: Record<string, string | number | boolean | string[]>;
}): number | null {
  const score = event.payload?.score;
  const max = event.payload?.max;

  if (typeof score === 'number' && typeof max === 'number' && max > 0) {
    return Number(((score / max) * 20).toFixed(1));
  }
  if (typeof score === 'number') {
    return Number((score <= 2 ? score * 10 : score).toFixed(1));
  }
  return null;
}

function formatCountdown(value: number | null, fallback: string) {
  if (value === null) return fallback;
  if (value < 0) return 'épreuve passée';
  return `J-${value}`;
}

export default function ParentDashboard() {
  const data = useDashboard();

  const averageScore = Number(
    ((data.scores.oral + data.scores.ecrit + data.scores.grammaire + data.scores.lectureCursive) / 4).toFixed(1),
  );

  const skillEntries = Object.entries(data.scores).map(([key, score]) => ({
    key,
    label: SKILL_LABELS[key] ?? key,
    score,
  }));

  const strongestSkill = skillEntries.reduce((prev, current) => (current.score > prev.score ? current : prev), skillEntries[0]);
  const weakestSkill = skillEntries.reduce((prev, current) => (current.score < prev.score ? current : prev), skillEntries[0]);
  const weakSignals = Object.entries(data.weakSignals).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const progressionData = data.weeklyProgression.map((item) => ({
    date: item.week,
    commentaire: item.score,
    dissertation: null,
    oral: null,
  }));

  const recentEvaluations = data.timeline
    .filter((event) => event.type === 'evaluation')
    .slice(0, 4)
    .map((event) => ({
      id: event.id,
      feature: event.feature.replace(/_/g, ' '),
      date: new Date(event.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long' }),
      score: scoreFromEvent(event),
    }));

  const parentAdvice = {
    oral: {
      title: 'Mettre l’oral au centre cette semaine',
      detail: 'Demander une prise de parole courte mais régulière aide souvent plus qu’un long débrief occasionnel.',
      action: 'Planifier 10 minutes de lecture ou relance orale à heure fixe.',
    },
    ecrit: {
      title: 'Sécuriser la méthode d’écrit',
      detail: 'Le bon soutien parental ici consiste à stabiliser le cadre de travail, pas à commenter le fond littéraire.',
      action: 'Prévoir un créneau calme et vérifier seulement que le bloc écrit est réellement lancé.',
    },
    grammaire: {
      title: 'Réduire la dispersion sur la langue',
      detail: 'Quand la grammaire décroche, il vaut mieux des rappels courts et répétés que des révisions massives.',
      action: 'Favoriser un exercice ciblé de 5 à 10 minutes plutôt qu’une longue séance diffuse.',
    },
    lectureCursive: {
      title: 'Réactiver les œuvres avant qu’elles ne s’éloignent',
      detail: 'Le meilleur rôle parental est ici de remettre l’œuvre dans la conversation de façon légère mais régulière.',
      action: 'Demander un repère, une scène ou une idée-force au lieu d’un résumé intégral.',
    },
  }[weakestSkill.key as keyof typeof data.scores] ?? {
    title: 'Maintenir un rythme régulier',
    detail: 'La stabilité compte plus que les pics d’intensité.',
    action: 'Conserver des créneaux simples et répétables.',
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <section className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[var(--c-primary)] p-6 text-[var(--bg-page)] shadow-[var(--shadow-md)] md:p-8 lg:p-10">
        <div className="absolute inset-y-0 right-[-10%] hidden w-[42%] rounded-full bg-[radial-gradient(circle_at_center,_rgba(126,212,194,0.24),_transparent_70%)] blur-2xl lg:block" />
        <div className="absolute left-[-6%] top-[-18%] h-44 w-44 rounded-full bg-[rgba(216,163,99,0.16)] blur-3xl" />

        <div className="relative grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--color-amber-300)]">
              <ShieldCheck className="h-4 w-4" />
              Espace parent
            </div>
            <h1 style={EDITORIAL_HEADING} className="mt-6 text-4xl leading-tight tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl">
              Le suivi parent doit rendre la progression lisible, sans transformer la maison en salle de classe.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-200 sm:text-lg">
              Vue synthétique de <strong>{data.displayName}</strong>: niveau moyen, axe à resserrer, historique récent et prochaines fenêtres
              d’épreuve, dans un langage cohérent avec l’EAF.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5 text-sm">
              <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-slate-100">
                Moyenne actuelle&nbsp;: <strong>{averageScore} / 20</strong>
              </span>
              <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-slate-100">
                Point fort&nbsp;: <strong>{strongestSkill.label}</strong>
              </span>
              <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-slate-100">
                Focus semaine&nbsp;: <strong>{weakestSkill.label}</strong>
              </span>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/mon-parcours"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--bg-page)] px-6 py-3.5 text-sm font-bold text-[var(--c-primary)] transition-all hover:-translate-y-0.5 hover:bg-white"
              >
                Voir le parcours
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/profil"
                className="inline-flex items-center justify-center rounded-full border border-white/14 px-6 py-3.5 text-sm font-semibold text-[var(--bg-page)] transition-colors hover:bg-white/6"
              >
                Ouvrir le profil détaillé
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
            {[
              { label: 'Moyenne', value: `${averageScore} / 20`, icon: GraduationCap },
              { label: 'Sessions', value: `${data.totalSessions}`, icon: CheckCircle2 },
              { label: 'Série', value: `${data.streak} jours`, icon: Flame },
              { label: 'Écrit', value: formatCountdown(data.countdownEcrit, 'date non renseignée'), icon: CalendarDays },
            ].map((item) => (
              <div key={item.label} className="rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[var(--color-amber-300)]">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">{item.label}</p>
                    <p className="mt-1 text-xl font-bold text-white">{item.value}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="sm:col-span-2 rounded-[24px] border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--color-amber-300)]">Conseil parental de la semaine</p>
              <p className="mt-3 text-2xl font-semibold text-white">{parentAdvice.title}</p>
              <p className="mt-2 text-sm leading-7 text-slate-200">{parentAdvice.detail}</p>
            </div>
          </div>
        </div>
      </section>

      {data.error ? (
        <div className="rounded-[24px] border border-[var(--c-accent-text)]/25 bg-[var(--c-accent-subtle)] p-4 text-sm text-[var(--c-accent-text)] shadow-[var(--shadow-sm)]">
          <AlertTriangle className="mr-2 inline h-4 w-4" />
          {data.error}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[0.96fr_1.04fr]">
        <div className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-md)] md:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--c-success)]">Lecture parentale rapide</p>
          <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--c-primary)] sm:text-5xl">
            Les axes de progrès doivent être compréhensibles en moins d’une minute.
          </h2>

          <div className="mt-8 space-y-5">
            {skillEntries.map((skill) => (
              <div key={skill.key}>
                <div className="mb-2 flex items-center justify-between gap-3 text-sm font-medium">
                  <span className="text-[var(--c-primary)]">{skill.label}</span>
                  <span className="text-[var(--text-muted)]">{skill.score.toFixed(1)} / 20</span>
                </div>
                <div className="h-2.5 rounded-full bg-[var(--border-default)]">
                  <div
                    className={`h-2.5 rounded-full ${
                      skill.key === 'oral'
                        ? 'bg-[var(--c-success)]'
                        : skill.key === 'grammaire'
                          ? 'bg-[var(--color-amber-300)]'
                          : skill.key === 'lectureCursive'
                            ? 'bg-[var(--c-primary)]'
                            : 'bg-[var(--c-primary)]'
                    }`}
                    style={{ width: `${(skill.score / 20) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-primary)] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Axe fort</p>
              <p className="mt-3 text-lg font-semibold text-[var(--c-primary)]">{strongestSkill.label}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">C’est le registre où la confiance peut servir de levier positif.</p>
            </div>
            <div className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-primary)] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Axe fragile</p>
              <p className="mt-3 text-lg font-semibold text-[var(--c-primary)]">{weakestSkill.label}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">Le bon soutien familial consiste surtout à protéger un créneau calme sur cet axe.</p>
            </div>
          </div>

          <div className="mt-8 rounded-[24px] border border-[var(--c-primary)]/14 bg-[var(--bg-primary)] p-4">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--c-primary)]">
              <Target className="h-4 w-4" />
              Action concrète cette semaine
            </div>
            <p className="mt-3 text-sm leading-7 text-[var(--text-body)]">{parentAdvice.action}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-md)] md:p-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--c-success)]">Trajectoire récente</p>
                <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--c-primary)] sm:text-5xl">
                  La tendance hebdomadaire compte plus que l’impression du moment.
                </h2>
              </div>
              <div className="rounded-full border border-[var(--border-strong)] bg-[var(--bg-primary)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)]">
                Objectif de repère&nbsp;: 12 / 20
              </div>
            </div>

            <div className="mt-6">
              <ProgressionChart data={progressionData} target={12} />
            </div>
          </div>

          <div className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-md)] md:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--c-success)]">Évaluations récentes</p>
            <div className="mt-6 space-y-3">
              {recentEvaluations.length > 0 ? (
                recentEvaluations.map((item) => (
                  <article key={item.id} className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-primary)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--c-primary)]">{item.feature}</p>
                        <p className="mt-1 text-sm text-[var(--text-muted)]">{item.date}</p>
                      </div>
                      <div className="rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3 py-1 text-sm font-bold text-[var(--c-primary)]">
                        {item.score !== null ? `${item.score.toFixed(1)} / 20` : '—'}
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-primary)] p-4 text-sm leading-7 text-[var(--text-secondary)]">
                  Aucune évaluation suffisamment récente pour produire une lecture détaillée.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.94fr_1.06fr]">
        <div className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-md)] md:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--c-success)]">Points à surveiller</p>
          {weakSignals.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-2.5">
              {weakSignals.map(([skill, count]) => (
                <span key={skill} className="rounded-full border border-[var(--border-strong)] bg-[var(--bg-primary)] px-4 py-2 text-sm font-semibold text-[var(--c-primary)]">
                  {skill} ({count})
                </span>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-primary)] p-4 text-sm leading-7 text-[var(--text-secondary)]">
              Aucun signal faible fort n’est remonté sur la fenêtre récente.
            </div>
          )}
        </div>

        <div className="rounded-[24px] border border-[var(--c-primary)] bg-[var(--c-primary)] p-6 text-[var(--bg-page)] shadow-[var(--shadow-md)] md:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--color-amber-300)]">Position parentale utile</p>
          <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-white">
            Le bon soutien n’est ni le contrôle permanent, ni le retrait total.
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              {
                title: 'Rendre le créneau visible',
                detail: 'Mieux vaut un rendez-vous court mais stable qu’une pression diffuse toute la semaine.',
                icon: Clock3,
              },
              {
                title: 'Nommer l’axe travaillé',
                detail: 'Demander “quel axe travailles-tu aujourd’hui ?” est souvent plus utile que “tu as révisé ?”.',
                icon: Sparkles,
              },
              {
                title: 'Fermer la boucle',
                detail: 'Après la séance, un retour bref sur ce qui a été fait suffit à consolider l’engagement.',
                icon: MessageSquare,
              },
            ].map((item) => (
              <article key={item.title} className="rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[var(--color-amber-300)]">
                  <item.icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm font-semibold text-white">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-200">{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
