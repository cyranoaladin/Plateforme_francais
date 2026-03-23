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
import { Card, Badge } from '@/components/ui';
import { StateNotice } from '@/components/ui/state-notice';

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
    accent: 'bg-[var(--c-primary)]',
    copy: 'Construire plus vite une réponse solide, sans perdre la tension du sujet.',
    icon: PenTool,
  },
  {
    key: 'oral' as const,
    label: 'Oral',
    accent: 'bg-[var(--c-success)]',
    copy: 'Tenir la lecture, l’explication et la relance avec plus de fluidité.',
    icon: Mic,
  },
  {
    key: 'grammaire' as const,
    label: 'Grammaire',
    accent: 'bg-[var(--color-amber-300)]',
    copy: 'Stabiliser les notions qui font perdre des points trop vite.',
    icon: BrainCircuit,
  },
  {
    key: 'lectureCursive' as const,
    label: 'Lecture cursive',
    accent: 'bg-[var(--c-primary)]',
    copy: 'Garder les œuvres et leurs enjeux disponibles au moment utile.',
    icon: BookOpen,
  },
];

const BADGE_STYLES = [
  'from-[var(--c-primary)] to-[#315f88]',
  'from-[var(--c-success)] to-[#43b9aa]',
  'from-[var(--color-amber-700)] to-[#d6a15d]',
  'from-[#503a64] to-[#9a88b0]',
];

const PRIORITY_STYLE = {
  high: 'border-[var(--color-amber-300)]/18 bg-[var(--surface-premium)] text-[var(--warning-text)]',
  medium: 'border-[var(--c-primary)]/14 bg-[var(--surface-navy-light)] text-[var(--c-primary)]',
  low: 'border-[var(--c-success)]/14 bg-[var(--surface-teal-light)] text-[var(--c-success)]',
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
          throw new Error('Le chargement du profil a rencontré un problème. Réessaie dans un instant.');
        }

        setProfile((await response.json()) as StudentProfile);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Un problème temporaire empêche le chargement du profil.');
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
      <div className="mx-auto max-w-6xl p-4 md:p-8">
        <StateNotice
          title="Chargement de ton profil de progression"
          description="Tes compétences, erreurs récurrentes et badges sont en cours de chargement. Cela ne prend que quelques secondes."
          variant="loading"
          center
          className="mx-auto max-w-xl"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <section className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[var(--c-primary)] p-6 text-[var(--bg-page)] shadow-[var(--shadow-md)] md:p-8 lg:p-10">
        <div className="absolute inset-y-0 right-[-10%] hidden w-[42%] rounded-full bg-[radial-gradient(circle_at_center,_rgba(126,212,194,0.24),_transparent_70%)] blur-2xl lg:block" />
        <div className="absolute left-[-6%] top-[-18%] h-44 w-44 rounded-full bg-[rgba(216,163,99,0.16)] blur-3xl" />

        <div className="relative grid gap-8 xl:grid-cols-[1.02fr_0.98fr] xl:items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--color-amber-300)]">
              <ShieldCheck className="h-4 w-4" />
              Profil de progression EAF
            </div>
            <h1 style={EDITORIAL_HEADING} className="mt-6 text-4xl leading-tight tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl">
              {displayName}, ton profil doit te dire où appuyer, pas seulement où tu en es.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--color-slate-300)] sm:text-lg">
              Le rôle de cette page est de condenser ton état réel : compétences les plus stables, erreurs récurrentes, tâches immédiates et badges
              déjà acquis.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5 text-sm">
              <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-[var(--color-slate-300)]">
                Niveau moyen{'\u00a0'}: <strong>{averageScore} / 20</strong>
              </span>
              <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-[var(--color-slate-300)]">
                Point fort{'\u00a0'}: <strong>{strongestSkill.label}</strong>
              </span>
              <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-[var(--color-slate-300)]">
                Axe à retendre{'\u00a0'}: <strong>{weakestSkill.label}</strong>
              </span>
              <span className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-[var(--color-slate-300)]">
                Mise à jour{'\u00a0'}: <strong>{formatShortDate(resolvedProfile.skillMap.lastUpdated)}</strong>
              </span>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/mon-parcours"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--bg-page)] px-6 py-3.5 text-sm font-bold text-[var(--c-primary)] transition-all hover:-translate-y-0.5 hover:bg-white"
              >
                Ouvrir mon parcours
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={tutorHref}
                className="inline-flex items-center justify-center rounded-full border border-white/14 px-6 py-3.5 text-sm font-semibold text-[var(--bg-page)] transition-colors hover:bg-white/6"
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
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[var(--color-amber-300)]">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--text-placeholder)]">{item.label}</p>
                    <p className="mt-1 text-xl font-bold text-white">{item.value}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="sm:col-span-2 rounded-[24px] border border-white/10 bg-white/8 p-5 backdrop-blur-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--color-amber-300)]">Signal global</p>
              <p className="mt-3 text-2xl font-semibold text-white">{profileSignal.label}</p>
              <p className="mt-2 text-sm leading-7 text-[var(--color-slate-300)]">{profileSignal.detail}</p>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <StateNotice
          title="Impossible de charger certaines données du profil"
          description={`${error} Rafraîchis la page ou réessaie dans quelques instants.`}
          variant="error"
        />
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card variant="default" className="rounded-[24px] bg-[var(--bg-surface)]/90 shadow-[var(--shadow-md)]" padding="md">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--c-success)]">Cartographie actuelle</p>
          <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--c-primary)] sm:text-5xl">
            Quatre axes lisibles, pour éviter une lecture floue de tes progrès.
          </h2>

          <div className="mt-8 space-y-5">
            {skillCards.map((skill) => {
              const Icon = skill.icon;
              return (
                <div key={skill.key}>
                  <div className="mb-2 flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--bg-surface-secondary)] text-[var(--c-primary)]">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--c-primary)]">{skill.label}</p>
                        <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{skill.copy}</p>
                      </div>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-[var(--text-muted)]">{skill.score.toFixed(1)} / 20</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-[var(--border-default)]">
                    <div className={`h-2.5 rounded-full ${skill.accent}`} style={{ width: `${(skill.score / 20) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Card variant="default" className="rounded-[24px] border-[var(--border-strong)] bg-[var(--bg-surface-secondary)]" padding="sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Axe fort</p>
              <p className="mt-3 text-lg font-semibold text-[var(--c-primary)]">{strongestSkill.label}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">C’est là que le niveau est le plus naturellement stable aujourd’hui.</p>
            </Card>
            <Card variant="default" className="rounded-[24px] border-[var(--border-strong)] bg-[var(--bg-surface-secondary)]" padding="sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Axe prioritaire</p>
              <p className="mt-3 text-lg font-semibold text-[var(--c-primary)]">{weakestSkill.label}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">C’est l’endroit où une séance bien choisie rapportera le plus vite.</p>
            </Card>
          </div>
        </Card>

        <div className="space-y-6">
          <Card variant="default" className="rounded-[24px] bg-[var(--bg-surface)]/90 shadow-[var(--shadow-md)]" padding="md">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--c-success)]">Points de vigilance</p>
            <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--c-primary)] sm:text-5xl">
              Les erreurs récurrentes doivent rester visibles, pas seulement ressenties.
            </h2>

            {topErrors.length === 0 ? (
              <div className="mt-8">
                <StateNotice
                  title="Aucune erreur récurrente identifiée"
                  description="Au fil de tes ateliers et évaluations, les points de vigilance récurrents apparaîtront ici pour t’aider à cibler tes prochaines révisions."
                  variant="empty"
                  icon={CheckCircle2}
                  center
                />
              </div>
            ) : (
              <div className="mt-8 space-y-3">
                {topErrors.map((entry) => (
                  <article key={`${entry.type}-${entry.firstSeen}`} className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] p-4">
                    <div className="flex items-start gap-4">
                      <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-premium)] text-[var(--color-amber-300)]">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-[var(--c-primary)]">{entry.type}</p>
                          <Badge variant="outline" size="sm" className="border-[var(--color-amber-300)]/18 font-bold uppercase tracking-[0.16em] text-[var(--warning-text)]">
                            {entry.count} occurrences
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{entry.description}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </Card>

          <Card variant="dark" className="rounded-[24px] border border-[var(--c-primary)] shadow-[var(--shadow-md)]" padding="md">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--color-amber-300)]">72 prochaines heures</p>
            <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-white">
              Les prochaines tâches doivent être courtes, claires et immédiatement lançables.
            </h2>

            <div className="mt-8 space-y-3">
              {upcomingTasks.length > 0 ? (
                upcomingTasks.map((task) => (
                  <article key={task.id} className="rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Badge variant="default" size="sm" className={`font-bold uppercase tracking-[0.16em] ${PRIORITY_STYLE[task.priority]}`}>
                        {task.priority}
                      </Badge>
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-slate-300)]">
                        {task.estimatedMinutes} min · {formatShortDate(task.dueDate)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold leading-6 text-white">{task.description}</p>
                  </article>
                ))
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-[24px] border border-white/10 bg-white/8 p-6 text-center backdrop-blur-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                    <Target className="h-5 w-5 text-[var(--color-slate-300)]" />
                  </div>
                  <p className="text-sm font-semibold text-white">Pas encore de tâches planifiées</p>
                  <p className="max-w-sm text-sm leading-7 text-[var(--color-slate-300)]">
                    Ouvre ton parcours ou lance un atelier pour que les prochaines actions concrètes apparaissent ici.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/mon-parcours"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--bg-page)] px-5 py-3 text-sm font-bold text-[var(--c-primary)] transition-all hover:-translate-y-0.5 hover:bg-white"
              >
                Voir tout le plan
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={tutorHref}
                className="inline-flex items-center justify-center rounded-full border border-white/14 px-5 py-3 text-sm font-semibold text-[var(--bg-page)] transition-colors hover:bg-white/6"
              >
                Demander une relance
              </Link>
            </div>
          </Card>
        </div>
      </section>

      <Card variant="default" className="rounded-[24px] bg-[var(--bg-surface)]/90 shadow-[var(--shadow-md)]" padding="md">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--c-success)]">Badges et traces positives</p>
            <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--c-primary)] sm:text-5xl">
              Les marqueurs de progression comptent aussi pour soutenir la constance.
            </h2>
          </div>
          <Badge variant="outline" size="md" className="border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] font-semibold text-[var(--text-secondary)]">
            {resolvedProfile.badges.length} badges actifs
          </Badge>
        </div>

        {!resolvedProfile.badges.length ? (
          <div className="mt-8">
            <StateNotice
              title="Tes premiers badges arrivent bientôt"
              description="Chaque atelier terminé, chaque série de jours actifs et chaque seuil franchi te rapprochent d’un nouveau badge. Continue sur ta lancée !"
              variant="empty"
              icon={Award}
              center
              action={
                <Link
                  href="/atelier-ecrit"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] px-5 py-2.5 text-sm font-semibold text-[var(--c-primary)] transition-colors hover:border-[var(--c-success)] hover:text-[var(--c-success)]"
                >
                  Lancer un atelier
                  <ArrowRight className="h-4 w-4" />
                </Link>
              }
            />
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
                  Trace de progression utile : ce badge matérialise une régularité ou un passage de seuil déjà atteint.
                </p>
              </article>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
