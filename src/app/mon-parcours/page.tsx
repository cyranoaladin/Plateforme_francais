'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  Map as MapIcon,
  MessageSquare,
  Mic,
  PenTool,
  Sparkles,
  Target,
} from 'lucide-react';
import { buildTuteurHref } from '@/lib/navigation/tuteur-link';
import { getCsrfTokenFromDocument } from '@/lib/security/csrf-client';
import { Card, Badge } from '@/components/ui';
import { StateNotice } from '@/components/ui/state-notice';

type Plan = {
  semaines: {
    numero: number;
    objectif: string;
    activites: { type: string; titre: string; duree: string; lien: string }[];
  }[];
};

type ProfilePayload = {
  displayName: string;
  selectedOeuvres?: string[];
  oeuvreChoisieEntretien?: string;
  skillMap?: {
    ecrit: number | null;
    oral: number | null;
    grammaire: number | null;
    lectureCursive: number | null;
  };
  hasEvaluationData?: boolean;
  studyPlan?: {
    tasks: Array<{
      id: string;
      description: string;
      dueDate: string;
      estimatedMinutes: number;
      skill: string;
      priority: 'high' | 'medium' | 'low';
    }>;
  };
};

type WeekTask = {
  id: string;
  titre: string;
  type: string;
  duree: string;
  lien: string;
  semaine: number;
};

const EDITORIAL_HEADING = {
  fontFamily: "var(--font-display)",
};

const TYPE_META: Record<
  string,
  {
    label: string;
    tone: string;
    softTone: string;
    icon: typeof BrainCircuit;
  }
> = {
  oral: {
    label: 'Oral',
    tone: 'bg-[var(--c-success)] text-[var(--text-on-primary)]',
    softTone: 'border-[var(--border-success)] bg-[var(--bg-success)] text-[var(--text-success-on-subtle)]',
    icon: Mic,
  },
  grammaire: {
    label: 'Grammaire',
    tone: 'bg-[var(--c-reward)] text-[var(--text-on-primary)]',
    softTone: 'border-[var(--border-reward)] bg-[var(--bg-reward)] text-[var(--text-reward-on-subtle)]',
    icon: BrainCircuit,
  },
  langue: {
    label: 'Langue',
    tone: 'bg-[var(--c-reward)] text-[var(--text-on-primary)]',
    softTone: 'border-[var(--border-reward)] bg-[var(--bg-reward)] text-[var(--text-reward-on-subtle)]',
    icon: BrainCircuit,
  },
  ecrit: {
    label: 'Écrit',
    tone: 'bg-[var(--c-primary)] text-[var(--text-on-primary)]',
    softTone: 'border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary-on-subtle)]',
    icon: PenTool,
  },
  lecture: {
    label: 'Lecture',
    tone: 'bg-[var(--c-primary)] text-[var(--text-on-primary)]',
    softTone: 'border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary-on-subtle)]',
    icon: BookOpen,
  },
  revisions: {
    label: 'Révisions',
    tone: 'bg-[var(--c-primary)] text-[var(--text-on-primary)]',
    softTone: 'border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary-on-subtle)]',
    icon: BookOpen,
  },
  fiches: {
    label: 'Fiches',
    tone: 'bg-[var(--c-primary)] text-[var(--text-on-primary)]',
    softTone: 'border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary-on-subtle)]',
    icon: BookOpen,
  },
  quiz: {
    label: 'Quiz',
    tone: 'bg-[var(--c-primary)] text-[var(--text-on-primary)]',
    softTone: 'border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary-on-subtle)]',
    icon: Sparkles,
  },
  organisation: {
    label: 'Organisation',
    tone: 'bg-[var(--c-reward)] text-[var(--text-on-primary)]',
    softTone: 'border-[var(--border-reward)] bg-[var(--bg-reward)] text-[var(--text-reward-on-subtle)]',
    icon: CalendarDays,
  },
};

const PRIORITY_META = {
  high: 'border-[var(--border-reward)] bg-[var(--bg-reward)] text-[var(--text-reward-on-subtle)]',
  medium: 'border-[var(--border-primary)] bg-[var(--bg-primary)] text-[var(--text-primary-on-subtle)]',
  low: 'border-[var(--border-success)] bg-[var(--bg-success)] text-[var(--text-success-on-subtle)]',
};

function normalizeHref(href: string): string {
  if (!href) return '/mon-parcours';
  return href.startsWith('/') ? href : `/${href}`;
}

function progressRatio(done: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
}

function formatDueDate(date: string): string {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return 'Date à préciser';
  }

  return parsed.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
  });
}

function formatScoreLabel(value: number | null): string {
  if (value === null) {
    return 'Diagnostic à lancer';
  }

  return `${value.toFixed(1)} / 20`;
}

export default function MonParcoursPage() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [profileResponse, planResponse] = await Promise.all([
          fetch('/api/v1/student/profile'),
          fetch('/api/v1/parcours/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': getCsrfTokenFromDocument(),
            },
            body: JSON.stringify({}),
          }),
        ]);

        if (profileResponse.status === 401 || planResponse.status === 401) {
          setProfile(null);
          setPlan(null);
          return;
        }

        if (profileResponse.ok) {
          setProfile((await profileResponse.json()) as ProfilePayload);
        }

        if (!planResponse.ok) {
          throw new Error('Génération du parcours indisponible.');
        }

        setPlan((await planResponse.json()) as Plan);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Erreur de chargement.');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const priorityTasks = profile?.studyPlan?.tasks?.slice(0, 3) ?? [];

  const weekTasks = useMemo(() => {
    if (!plan) {
      return [] as WeekTask[];
    }

    return plan.semaines.flatMap((week) =>
      week.activites.slice(0, 5).map((activity, idx) => ({
        id: `${week.numero}-${idx}-${activity.titre}`,
        titre: activity.titre,
        type: activity.type,
        duree: activity.duree,
        lien: normalizeHref(activity.lien),
        semaine: week.numero,
      })),
    );
  }, [plan]);

  const totalWeeks = plan?.semaines.length ?? 0;
  const totalActivities = weekTasks.length;
  const completedActivities = checkedIds.size;
  const completionPercent = progressRatio(completedActivities, totalActivities);
  const nextPendingTask = weekTasks.find((task) => !checkedIds.has(task.id)) ?? null;
  const tutorHref = buildTuteurHref({
    workId: profile?.oeuvreChoisieEntretien ?? profile?.selectedOeuvres?.[0] ?? null,
  });

  const skillSummary = useMemo(() => {
    if (!profile?.skillMap) {
      return [] as Array<{ label: string; score: number | null; accent: string }>;
    }

    return [
      { label: 'Écrit', score: profile.skillMap.ecrit, accent: 'bg-[var(--c-primary)]' },
      { label: 'Oral', score: profile.skillMap.oral, accent: 'bg-[var(--c-success)]' },
      { label: 'Grammaire', score: profile.skillMap.grammaire, accent: 'bg-[var(--c-accent)]' },
      { label: 'Lecture cursive', score: profile.skillMap.lectureCursive, accent: 'bg-[var(--c-reward)]' },
    ];
  }, [profile?.skillMap]);

  const toggleActivity = async (id: string) => {
    const next = new Set(checkedIds);
    const willBeChecked = !next.has(id);
    if (willBeChecked) {
      next.add(id);
    } else {
      next.delete(id);
    }
    setCheckedIds(next);

    try {
      await fetch('/api/v1/memory/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': getCsrfTokenFromDocument(),
        },
        body: JSON.stringify({
          type: 'interaction',
          feature: 'study_plan_toggle',
          path: '/mon-parcours',
          payload: {
            taskId: id,
            done: willBeChecked,
          },
        }),
      });
    } catch {
      // noop
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <section className="hero-premium-panel relative overflow-hidden rounded-[24px] p-6 md:p-8 lg:p-10">
        <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[var(--color-indigo-400)] opacity-25" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-10 right-6 h-20 w-20 rounded-full bg-[var(--color-indigo-700)] opacity-40" />

        <div className="relative grid gap-8 xl:grid-cols-[1.04fr_0.96fr] xl:items-start">
          <div>
            <div className="hero-kicker">
              <MapIcon className="h-4 w-4" />
              Feuille de route Nexus
            </div>
            <h1 style={EDITORIAL_HEADING} className="mt-6 text-4xl leading-tight tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl">
              Ton parcours doit rendre la semaine lisible avant de la rendre ambitieuse.
            </h1>
            <p className="hero-body mt-5 max-w-3xl text-base leading-8 sm:text-lg">
              {profile?.displayName ? `${profile.displayName}, ` : ''}ici, le plan transforme le profil, l’historique de travail et les attendus
              officiels en blocs concrets: quoi lancer, dans quel ordre, et comment reprendre sans perdre le fil.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={nextPendingTask?.lien ?? '/atelier-oral'}
                className="hero-primary-action px-6 py-3.5 text-sm"
              >
                {nextPendingTask ? 'Lancer la prochaine activité' : 'Ouvrir un atelier'}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/dashboard"
                className="hero-secondary-action px-6 py-3.5 text-sm"
              >
                Retour au tableau de bord
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
            {[
              { label: 'Semaines cadrées', value: `${totalWeeks}`, icon: CalendarDays },
              { label: 'Blocs prévus', value: `${totalActivities}`, icon: Target },
              { label: 'Blocs cochés', value: `${completedActivities}`, icon: CheckCircle2 },
              { label: 'Avancement', value: `${completionPercent}%`, icon: Sparkles },
            ].map((item) => (
              <div key={item.label} className="hero-glass-card rounded-[24px] p-4">
                <div className="flex items-center gap-3">
                  <div className="hero-icon-badge h-11 w-11">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="ui-stat-label">{item.label}</p>
                    <p className="mt-1 text-xl font-bold text-white">{item.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {error ? (
        <StateNotice
          title="Le parcours n’a pas pu être chargé"
          description={`${error} Rafraîchis la page ou réessaie dans quelques instants.`}
          variant="error"
        />
      ) : null}

      {isLoading ? (
        <StateNotice
          title="Construction de ton plan personnalisé"
          description="Ton profil et tes activités sont en cours d’analyse pour te proposer une feuille de route adaptée. Cela ne prend que quelques secondes."
          variant="loading"
        />
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="space-y-6">
          {priorityTasks.length > 0 ? (
            <Card variant="default" padding="md" className="bg-[var(--bg-surface)]/90 border-[var(--border-strong)] shadow-[var(--shadow-md)] md:p-7" role="region" aria-label="Priorités immédiates">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--c-success)]">Priorités immédiates</p>
                  <h2 style={EDITORIAL_HEADING} className="mt-4 text-3xl leading-tight tracking-[-0.03em] text-[var(--c-primary)] sm:text-4xl md:text-5xl">
                    Les trois prochains blocs qui méritent d’ouvrir la semaine.
                  </h2>
                </div>
                <Badge variant="outline" size="md" className="border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] font-semibold text-[var(--text-secondary)]">
                  Plan nourri par le travail réel
                </Badge>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {priorityTasks.map((task) => (
                  <Card key={task.id} variant="default" padding="sm" className="border-[var(--border-strong)] bg-[var(--bg-surface-secondary)]" role="article">
                    <Badge variant="default" size="sm" className={`font-bold uppercase tracking-[0.16em] ${PRIORITY_META[task.priority]}`}>
                      {task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Faible'}
                    </Badge>
                    <p className="mt-4 text-sm font-semibold leading-6 text-[var(--c-primary)]">{task.description}</p>
                    <p className="mt-3 text-sm text-[var(--text-muted)]">
                      {task.estimatedMinutes} min · {formatDueDate(task.dueDate)}
                    </p>
                  </Card>
                ))}
              </div>
            </Card>
          ) : null}

          {(plan?.semaines ?? []).map((week) => {
            const weekEntries = week.activites.slice(0, 5).map((activity, idx) => ({
              activity,
              id: `${week.numero}-${idx}-${activity.titre}`,
            }));
            const completedWeek = weekEntries.filter((entry) => checkedIds.has(entry.id)).length;
            const weekProgress = progressRatio(completedWeek, weekEntries.length);

            return (
              <Card key={week.numero} variant="default" padding="md" className="bg-[var(--bg-surface)]/90 border-[var(--border-strong)] shadow-[var(--shadow-md)] md:p-7" role="region" aria-label={`Semaine ${week.numero}`}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--c-success)]">Semaine {week.numero}</p>
                    <h2 style={EDITORIAL_HEADING} className="mt-3 text-3xl leading-tight tracking-[-0.03em] text-[var(--c-primary)]">
                      {week.objectif}
                    </h2>
                  </div>
                  <Card variant="default" padding="sm" className="min-w-[180px] rounded-[22px] border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] text-sm text-[var(--text-secondary)]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-[var(--c-primary)]">Avancement</span>
                      <span>{weekProgress}%</span>
                    </div>
                    <div className="mt-3 h-2.5 rounded-full bg-[var(--border-default)]">
                      <div className="h-2.5 rounded-full bg-[var(--c-primary)]" style={{ width: `${weekProgress}%` }} />
                    </div>
                    <p className="mt-3 text-xs text-[var(--text-muted)]">
                      {completedWeek} / {weekEntries.length} activités cochées
                    </p>
                  </Card>
                </div>

                <div className="mt-6 space-y-3">
                  {weekEntries.map(({ activity, id }) => {
                    const checked = checkedIds.has(id);
                    const meta = TYPE_META[activity.type] ?? TYPE_META.ecrit;
                    const Icon = meta.icon;

                    return (
                      <Card
                        key={id}
                        variant="default"
                        padding="sm"
                        className={`transition-all ${
                          checked
                            ? 'border-[var(--c-success)]/24 bg-[var(--bg-success)] shadow-[var(--shadow-sm)]'
                            : 'border-[var(--border-strong)] bg-[var(--bg-surface)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]'
                        }`}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => void toggleActivity(id)}
                              className="mt-1 h-4 w-4 accent-[var(--c-primary)]"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="default" size="sm" className={`font-bold uppercase tracking-[0.16em] ${meta.tone}`}>
                                  {meta.label}
                                </Badge>
                                <Badge variant="outline" size="sm" className="border-[var(--border-strong)] font-semibold text-[var(--text-muted)]">
                                  <Icon className="h-3.5 w-3.5" />
                                  {activity.duree}
                                </Badge>
                              </div>
                              <p className="mt-3 text-sm font-semibold leading-6 text-[var(--c-primary)]">{activity.titre}</p>
                            </div>
                          </div>

                          <Link
                            href={normalizeHref(activity.lien)}
                            className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-2 text-sm font-semibold text-[var(--c-primary)] transition-colors hover:border-[var(--c-success)] hover:text-[var(--c-success)]"
                          >
                            Ouvrir
                          </Link>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </Card>
            );
          })}

          {weekTasks.length === 0 && !isLoading ? (
            <StateNotice
              title="Ton parcours se construit à partir de tes premières activités"
              description="Finalise la configuration de ton parcours ou lance un premier atelier : la plateforme pourra alors te proposer une feuille de route personnalisée, semaine par semaine."
              variant="empty"
              icon={MapIcon}
              center
              action={
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
                  <Link
                    href="/onboarding"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--c-primary)] px-5 py-3 text-sm font-bold text-[var(--bg-page)] transition-all hover:-translate-y-0.5"
                  >
                    Terminer la configuration
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href={tutorHref}
                    className="inline-flex items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] px-5 py-3 text-sm font-semibold text-[var(--c-primary)] transition-colors hover:border-[var(--c-success)] hover:text-[var(--c-success)]"
                  >
                    Ouvrir le guidage
                  </Link>
                </div>
              }
            />
          ) : null}
        </div>

        <aside className="space-y-6 xl:sticky xl:top-8 xl:self-start">
          <Card variant="default" padding="md" className="bg-[var(--bg-surface)]/90 border-[var(--border-strong)] shadow-[var(--shadow-md)] md:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--c-success)]">Cap du moment</p>
            <h2 style={EDITORIAL_HEADING} className="mt-4 text-3xl leading-tight tracking-[-0.03em] text-[var(--c-primary)]">
              Une vue compacte pour reprendre le plan sans inertie.
            </h2>

            <div className="mt-6 rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-[var(--c-primary)]">Progression globale</span>
                <span className="text-sm font-bold text-[var(--text-secondary)]">{completionPercent}%</span>
              </div>
              <div className="mt-3 h-2.5 rounded-full bg-[var(--border-default)]">
                <div className="h-2.5 rounded-full bg-[var(--c-primary)]" style={{ width: `${completionPercent}%` }} />
              </div>
              <p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">
                {completedActivities} blocs validés sur {totalActivities || 0}. L’objectif est de garder une cadence tenable, pas de cocher pour cocher.
              </p>
            </div>

            <div className="mt-5 rounded-[24px] border border-[var(--border-primary)] bg-[var(--bg-primary)] p-4">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--c-primary)]">
                <Target className="h-4 w-4" />
                Prochain bloc conseillé
              </div>
              <p className="mt-3 text-sm font-semibold leading-6 text-[var(--c-primary)]">
                {nextPendingTask ? nextPendingTask.titre : 'Aucun bloc en attente pour le moment.'}
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {nextPendingTask
                  ? `${nextPendingTask.duree} · semaine ${nextPendingTask.semaine}`
                  : 'Le plan courant est entièrement coché ou pas encore généré.'}
              </p>
              <Link
                href={nextPendingTask?.lien ?? '/atelier-oral'}
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[var(--c-primary)] transition-colors hover:text-[var(--c-success)]"
              >
                Lancer ce bloc
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {[
                {
                  title: 'Revenir au tableau de bord',
                  detail: 'Reprendre les signaux récents et vérifier ce que la dernière session a bougé.',
                  href: '/dashboard',
                  icon: MapIcon,
                },
                {
                  title: 'Débloquer un passage précis',
                  detail: 'Utiliser le guidage de parcours pour débloquer un passage avant de relancer la semaine.',
                  href: tutorHref,
                  icon: MessageSquare,
                },
              ].map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="rounded-[22px] border border-[var(--border-strong)] bg-[var(--bg-surface)] p-4 transition-all hover:-translate-y-0.5 hover:border-[var(--c-success)]"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--c-primary)] text-[var(--bg-page)]">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-[var(--c-primary)]">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{item.detail}</p>
                </Link>
              ))}
            </div>
          </Card>

          {skillSummary.length > 0 ? (
            <Card variant="default" padding="md" className="bg-[var(--bg-surface)]/90 border-[var(--border-strong)] shadow-[var(--shadow-md)] md:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--c-success)]">Niveau de départ</p>
              <h2 style={EDITORIAL_HEADING} className="mt-4 text-3xl leading-tight tracking-[-0.03em] text-[var(--c-primary)]">
                Le parcours doit rester cohérent avec le profil mesuré.
              </h2>
              <div className="mt-6 space-y-5">
                {skillSummary.map((skill) => (
                  <div key={skill.label}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm font-medium">
                      <span className="text-[var(--c-primary)]">{skill.label}</span>
                      <span className="text-[var(--text-muted)]">{formatScoreLabel(skill.score)}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-[var(--border-default)]">
                      <div className={`h-2.5 rounded-full ${skill.accent}`} style={{ width: `${((skill.score ?? 0) / 20) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
