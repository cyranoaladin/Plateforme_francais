'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Award,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Flame,
  Mic,
  PenTool,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import { buildTuteurHref } from '@/lib/navigation/tuteur-link';

type StudentProfile = {
  skillMap: {
    ecrit: number;
    oral: number;
    grammaire: number;
    lectureCursive: number;
    lastUpdated: string;
  };
  errorBank: Array<{
    type: string;
    description: string;
    count: number;
    firstSeen: string;
  }>;
  studyPlan: {
    tasks: Array<{
      id: string;
      description: string;
      dueDate: string;
      estimatedMinutes: number;
      skill: string;
      priority: 'high' | 'medium' | 'low';
    }>;
  };
  badges: string[];
  streak: number;
  totalSessions: number;
  totalCopies: number;
  displayName?: string;
  selectedOeuvres?: string[];
  oeuvreChoisieEntretien?: string;
};

const EDITORIAL_HEADING = {
  fontFamily: "var(--font-display)",
};

const FALLBACK_PROFILE: StudentProfile = {
  skillMap: {
    ecrit: 11.2,
    oral: 12.1,
    grammaire: 10.6,
    lectureCursive: 11.4,
    lastUpdated: new Date().toISOString(),
  },
  errorBank: [],
  studyPlan: {
    tasks: [],
  },
  badges: [],
  streak: 0,
  totalSessions: 0,
  totalCopies: 0,
  displayName: 'Élève',
  selectedOeuvres: [],
};

const SKILL_META = [
  {
    key: 'ecrit' as const,
    label: 'Écrit',
    accent: 'bg-[var(--navy)]',
    copy: 'Construire plus vite une réponse solide, sans perdre la tension du sujet.',
    icon: PenTool,
  },
  {
    key: 'oral' as const,
    label: 'Oral',
    accent: 'bg-[var(--teal)]',
    copy: 'Tenir la lecture, l’explication et la relance avec plus de fluidité.',
    icon: Mic,
  },
  {
    key: 'grammaire' as const,
    label: 'Grammaire',
    accent: 'bg-[var(--gold-muted)]',
    copy: 'Stabiliser les notions qui font perdre des points trop vite.',
    icon: BrainCircuit,
  },
  {
    key: 'lectureCursive' as const,
    label: 'Lecture cursive',
    accent: 'bg-[#6b587d]',
    copy: 'Garder les œuvres et leurs enjeux disponibles au moment utile.',
    icon: BookOpen,
  },
];

const BADGE_STYLES = [
  'from-[var(--navy)] to-[#315f88]',
  'from-[var(--teal)] to-[#43b9aa]',
  'from-[#7a4b24] to-[#d6a15d]',
  'from-[#503a64] to-[#9a88b0]',
];

const PRIORITY_STYLE = {
  high: 'border-[var(--gold-muted)]/18 bg-[#fdf4e9] text-[#9a5f25]',
  medium: 'border-[var(--navy)]/14 bg-[#eef3f8] text-[var(--navy)]',
  low: 'border-[var(--teal)]/14 bg-[#eef9f6] text-[var(--teal)]',
};

function formatShortDate(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return 'Date à préciser';
  }
  return parsed.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

export default function ProfilPage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/v1/student/profile');
        if (response.status === 401) {
          setProfile(FALLBACK_PROFILE);
          return;
        }
        if (!response.ok) {
          throw new Error('Chargement profil impossible.');
        }

        setProfile((await response.json()) as StudentProfile);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Erreur de chargement.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const resolvedProfile = profile ?? FALLBACK_PROFILE;
  const displayName = resolvedProfile.displayName ?? 'Élève';
  const averageScore = Number(
    (
      (resolvedProfile.skillMap.ecrit +
        resolvedProfile.skillMap.oral +
        resolvedProfile.skillMap.grammaire +
        resolvedProfile.skillMap.lectureCursive) /
      4
    ).toFixed(1),
  );

  const skillCards = SKILL_META.map((skill) => ({
    ...skill,
    score: resolvedProfile.skillMap[skill.key],
  }));

  const strongestSkill = skillCards.reduce((prev, current) => (current.score > prev.score ? current : prev), skillCards[0]);
  const weakestSkill = skillCards.reduce((prev, current) => (current.score < prev.score ? current : prev), skillCards[0]);
  const upcomingTasks = resolvedProfile.studyPlan.tasks.slice(0, 3);
  const topErrors = resolvedProfile.errorBank.slice(0, 5);
  const tutorHref = buildTuteurHref({
    workId: resolvedProfile.oeuvreChoisieEntretien ?? resolvedProfile.selectedOeuvres?.[0] ?? null,
  });

  const profileSignal = useMemo(() => {
    if (averageScore >= 13.5) {
      return {
        label: 'Base solide',
        detail: 'Le profil est déjà crédible. L’enjeu est maintenant de rendre la régularité plus nette que l’intensité.',
      };
    }
    if (averageScore >= 11) {
      return {
        label: 'Progression engagée',
        detail: 'Le niveau est intermédiaire mais exploitable. Les gains viendront surtout d’un meilleur ciblage, pas d’un volume aveugle.',
      };
    }
    return {
      label: 'Relance prioritaire',
      detail: 'Le profil montre un besoin de réamorçage sur les bases. Il faut réduire la dispersion et remettre le bon axe au centre.',
    };
  }, [averageScore]);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-64 max-w-6xl items-center justify-center p-8">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--navy)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <section className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[var(--navy)] p-6 text-[#f7f2ea] shadow-[var(--shadow-xl)] md:p-8 lg:p-10">
        <div className="absolute inset-y-0 right-[-10%] hidden w-[42%] rounded-full bg-[radial-gradient(circle_at_center,_rgba(126,212,194,0.24),_transparent_70%)] blur-2xl lg:block" />
        <div className="absolute left-[-6%] top-[-18%] h-44 w-44 rounded-full bg-[rgba(216,163,99,0.16)] blur-3xl" />

        <div className="relative grid gap-8 xl:grid-cols-[1.02fr_0.98fr] xl:items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[#d7c4aa]">
              <ShieldCheck className="h-4 w-4" />
              Profil de progression EAF
            </div>
            <h1 style={EDITORIAL_HEADING} className="mt-6 text-4xl leading-tight tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl">
              {displayName}, ton profil doit te dire où appuyer, pas seulement où tu en es.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-200 sm:text-lg">
              Le rôle de cette page est de condenser ton état réel: compétences les plus stables, erreurs récurrentes, tâches immédiates et badges
              déjà acquis.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5 text-sm">
              <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-slate-100">
                Niveau moyen: <strong>{averageScore} / 20</strong>
              </span>
              <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-slate-100">
                Point fort: <strong>{strongestSkill.label}</strong>
              </span>
              <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-slate-100">
                Axe à retendre: <strong>{weakestSkill.label}</strong>
              </span>
              <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-slate-100">
                Mise à jour: <strong>{formatShortDate(resolvedProfile.skillMap.lastUpdated)}</strong>
              </span>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/mon-parcours"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f7f2ea] px-6 py-3.5 text-sm font-bold text-[var(--navy)] transition-all hover:-translate-y-0.5 hover:bg-white"
              >
                Ouvrir mon parcours
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={tutorHref}
                className="inline-flex items-center justify-center rounded-full border border-white/14 px-6 py-3.5 text-sm font-semibold text-[#f7f2ea] transition-colors hover:bg-white/6"
              >
                Débloquer un point précis
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
            {[
              { label: 'Série active', value: `${resolvedProfile.streak} jours`, icon: Flame },
              { label: 'Sessions', value: `${resolvedProfile.totalSessions}`, icon: Target },
              { label: 'Copies', value: `${resolvedProfile.totalCopies}`, icon: CheckCircle2 },
              { label: 'Badges', value: `${resolvedProfile.badges.length}`, icon: Award },
            ].map((item) => (
              <div key={item.label} className="rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#d7c4aa]">
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
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#d7c4aa]">Signal global</p>
              <p className="mt-3 text-2xl font-semibold text-white">{profileSignal.label}</p>
              <p className="mt-2 text-sm leading-7 text-slate-200">{profileSignal.detail}</p>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-[24px] border border-[#b65050]/25 bg-[var(--error-bg)] p-4 text-sm text-[#8f2d2d] shadow-[var(--shadow-sm)]">
          <AlertTriangle className="mr-2 inline h-4 w-4" />
          {error}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-[24px] border border-[var(--border-strong)] bg-white/90 p-6 shadow-[var(--shadow-md)] md:p-7">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--teal)]">Cartographie actuelle</p>
          <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--navy)] sm:text-5xl">
            Quatre axes lisibles, pour éviter une lecture floue de tes progrès.
          </h2>

          <div className="mt-8 space-y-5">
            {skillCards.map((skill) => {
              const Icon = skill.icon;
              return (
                <div key={skill.key}>
                  <div className="mb-2 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--surface-warm)] text-[var(--navy)]">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--navy)]">{skill.label}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{skill.copy}</p>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-slate-500">{skill.score.toFixed(1)} / 20</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[#e7ddcf]">
                    <div className={`h-2.5 rounded-full ${skill.accent}`} style={{ width: `${(skill.score / 20) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--surface-warm)] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Axe fort</p>
              <p className="mt-3 text-lg font-semibold text-[var(--navy)]">{strongestSkill.label}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">C’est là que le niveau est le plus naturellement stable aujourd’hui.</p>
            </div>
            <div className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--surface-warm)] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">Axe prioritaire</p>
              <p className="mt-3 text-lg font-semibold text-[var(--navy)]">{weakestSkill.label}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">C’est l’endroit où une séance bien choisie rapportera le plus vite.</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[24px] border border-[var(--border-strong)] bg-white/90 p-6 shadow-[var(--shadow-md)] md:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--teal)]">Points de vigilance</p>
            <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--navy)] sm:text-5xl">
              Les erreurs récurrentes doivent rester visibles, pas seulement ressenties.
            </h2>

            {topErrors.length === 0 ? (
              <div className="mt-8 rounded-[24px] border border-[var(--border-strong)] bg-[var(--surface-warm)] p-4 text-sm leading-7 text-slate-600">
                Aucune erreur récurrente forte n’est remontée pour l’instant. Continue à alimenter le profil avec des ateliers et des évaluations réelles.
              </div>
            ) : (
              <div className="mt-8 space-y-3">
                {topErrors.map((entry) => (
                  <article key={`${entry.type}-${entry.firstSeen}`} className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--surface-warm)] p-4">
                    <div className="flex items-start gap-4">
                      <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff3e4] text-[var(--gold-muted)]">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-[var(--navy)]">{entry.type}</p>
                          <span className="rounded-full border border-[var(--gold-muted)]/18 bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#9a5f25]">
                            {entry.count} occurrences
                          </span>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{entry.description}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[24px] border border-[var(--navy)] bg-[var(--navy)] p-6 text-[#f7f2ea] shadow-[var(--shadow-lg)] md:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#d7c4aa]">72 prochaines heures</p>
            <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-white">
              Les prochaines tâches doivent être courtes, claires et immédiatement lançables.
            </h2>

            <div className="mt-8 space-y-3">
              {upcomingTasks.length > 0 ? (
                upcomingTasks.map((task) => (
                  <article key={task.id} className="rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${PRIORITY_STYLE[task.priority]}`}>
                        {task.priority}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                        {task.estimatedMinutes} min · {formatShortDate(task.dueDate)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold leading-6 text-white">{task.description}</p>
                  </article>
                ))
              ) : (
                <div className="rounded-[24px] border border-white/10 bg-white/8 p-4 text-sm leading-7 text-slate-200">
                  Le plan court n’est pas encore suffisamment renseigné. Passe par le parcours ou le guidage de parcours pour faire émerger les
                  prochaines actions utiles.
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/mon-parcours"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f7f2ea] px-5 py-3 text-sm font-bold text-[var(--navy)] transition-all hover:-translate-y-0.5 hover:bg-white"
              >
                Voir tout le plan
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={tutorHref}
                className="inline-flex items-center justify-center rounded-full border border-white/14 px-5 py-3 text-sm font-semibold text-[#f7f2ea] transition-colors hover:bg-white/6"
              >
                Demander une relance
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-[var(--border-strong)] bg-white/90 p-6 shadow-[var(--shadow-md)] md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--teal)]">Badges et traces positives</p>
            <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--navy)] sm:text-5xl">
              Les marqueurs de progression comptent aussi pour soutenir la constance.
            </h2>
          </div>
          <div className="rounded-full border border-[var(--border-strong)] bg-[var(--surface-warm)] px-4 py-2 text-sm font-semibold text-slate-600">
            {resolvedProfile.badges.length} badges actifs
          </div>
        </div>

        {!resolvedProfile.badges.length ? (
          <div className="mt-8 rounded-[24px] border border-[var(--border-strong)] bg-[var(--surface-warm)] p-4 text-sm leading-7 text-slate-600">
            Aucun badge n’est encore enregistré. Les premiers arrivent vite dès que la régularité et les ateliers commencent à se cumuler.
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {resolvedProfile.badges.map((badge, index) => (
              <article
                key={badge}
                className={`rounded-[24px] border border-white/10 bg-gradient-to-br ${BADGE_STYLES[index % BADGE_STYLES.length]} p-5 text-white shadow-[var(--shadow-md)]`}
              >
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12">
                  <Sparkles className="h-5 w-5" />
                </div>
                <p className="mt-4 text-base font-semibold leading-7">{badge}</p>
                <p className="mt-2 text-sm leading-6 text-white/80">
                  Trace de progression utile: ce badge matérialise une régularité ou un passage de seuil déjà atteint.
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
