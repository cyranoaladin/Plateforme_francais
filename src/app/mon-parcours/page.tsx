'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
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
    ecrit: number;
    oral: number;
    grammaire: number;
    lectureCursive: number;
  };
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
    tone: 'bg-[var(--teal)] text-white',
    softTone: 'border-[var(--teal)]/16 bg-[var(--surface-teal-light)] text-[var(--teal)]',
    icon: Mic,
  },
  grammaire: {
    label: 'Grammaire',
    tone: 'bg-[var(--gold-muted)] text-white',
    softTone: 'border-[var(--gold-muted)]/16 bg-[var(--surface-premium)] text-[var(--warning-text)]',
    icon: BrainCircuit,
  },
  langue: {
    label: 'Langue',
    tone: 'bg-[var(--gold-muted)] text-white',
    softTone: 'border-[var(--gold-muted)]/16 bg-[var(--surface-premium)] text-[var(--warning-text)]',
    icon: BrainCircuit,
  },
  ecrit: {
    label: 'Écrit',
    tone: 'bg-[var(--navy)] text-white',
    softTone: 'border-[var(--navy)]/14 bg-[var(--surface-navy-light)] text-[var(--navy)]',
    icon: PenTool,
  },
  lecture: {
    label: 'Lecture',
    tone: 'bg-[var(--accent-violet)] text-white',
    softTone: 'border-[var(--accent-violet)]/16 bg-[var(--surface-violet-light)] text-[var(--accent-violet)]',
    icon: BookOpen,
  },
  revisions: {
    label: 'Révisions',
    tone: 'bg-[var(--accent-violet)] text-white',
    softTone: 'border-[var(--accent-violet)]/16 bg-[var(--surface-violet-light)] text-[var(--accent-violet)]',
    icon: BookOpen,
  },
  fiches: {
    label: 'Fiches',
    tone: 'bg-[var(--accent-violet)] text-white',
    softTone: 'border-[var(--accent-violet)]/16 bg-[var(--surface-violet-light)] text-[var(--accent-violet)]',
    icon: BookOpen,
  },
  quiz: {
    label: 'Quiz',
    tone: 'bg-[var(--navy)] text-white',
    softTone: 'border-[var(--navy)]/14 bg-[var(--surface-navy-light)] text-[var(--navy)]',
    icon: Sparkles,
  },
  organisation: {
    label: 'Organisation',
    tone: 'bg-[var(--accent-earth)] text-white',
    softTone: 'border-[var(--accent-earth)]/16 bg-[var(--surface-premium)] text-[var(--accent-earth)]',
    icon: CalendarDays,
  },
};

const PRIORITY_META = {
  high: 'border-[var(--gold-muted)]/18 bg-[var(--surface-premium)] text-[var(--warning-text)]',
  medium: 'border-[var(--navy)]/14 bg-[var(--surface-navy-light)] text-[var(--navy)]',
  low: 'border-[var(--teal)]/14 bg-[var(--surface-teal-light)] text-[var(--teal)]',
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
      return [] as Array<{ label: string; score: number; accent: string }>;
    }

    return [
      { label: 'Écrit', score: profile.skillMap.ecrit, accent: 'bg-[var(--navy)]' },
      { label: 'Oral', score: profile.skillMap.oral, accent: 'bg-[var(--teal)]' },
      { label: 'Grammaire', score: profile.skillMap.grammaire, accent: 'bg-[var(--gold-muted)]' },
      { label: 'Lecture cursive', score: profile.skillMap.lectureCursive, accent: 'bg-[var(--accent-violet)]' },
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
      <section className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[var(--navy)] p-6 text-[var(--surface-parchment)] shadow-[var(--shadow-xl)] md:p-8 lg:p-10">
        <div className="absolute inset-y-0 right-[-8%] hidden w-[40%] rounded-full bg-[radial-gradient(circle_at_center,_rgba(126,212,194,0.24),_transparent_70%)] blur-2xl lg:block" />
        <div className="absolute left-[-6%] top-[-20%] h-44 w-44 rounded-full bg-[rgba(216,163,99,0.16)] blur-3xl" />

        <div className="relative grid gap-8 xl:grid-cols-[1.04fr_0.96fr] xl:items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--border-warm)]">
              <MapIcon className="h-4 w-4" />
              Feuille de route Nexus
            </div>
            <h1 style={EDITORIAL_HEADING} className="mt-6 text-4xl leading-tight tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl">
              Ton parcours doit rendre la semaine lisible avant de la rendre ambitieuse.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--text-on-navy-muted)] sm:text-lg">
              {profile?.displayName ? `${profile.displayName}, ` : ''}ici, le plan transforme le profil, l’historique de travail et les attendus
              officiels en blocs concrets: quoi lancer, dans quel ordre, et comment reprendre sans perdre le fil.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={nextPendingTask?.lien ?? '/atelier-oral'}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--surface-parchment)] px-6 py-3.5 text-sm font-bold text-[var(--navy)] transition-all hover:-translate-y-0.5 hover:bg-white"
              >
                {nextPendingTask ? 'Lancer la prochaine activité' : 'Ouvrir un atelier'}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-white/14 px-6 py-3.5 text-sm font-semibold text-[var(--surface-parchment)] transition-colors hover:bg-white/6"
              >
                Retour dashboard
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
              <div key={item.label} className="rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[var(--border-warm)]">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--text-placeholder)]">{item.label}</p>
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
            <Card variant="default" padding="md" className="bg-[var(--card)]/90 border-[var(--border-strong)] shadow-[var(--shadow-md)] md:p-7" role="region" aria-label="Priorités immédiates">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--teal)]">Priorités immédiates</p>
                  <h2 style={EDITORIAL_HEADING} className="mt-4 text-3xl leading-tight tracking-[-0.03em] text-[var(--navy)] sm:text-4xl md:text-5xl">
                    Les trois prochains blocs qui méritent d’ouvrir la semaine.
                  </h2>
                </div>
                <Badge variant="outline" size="md" className="border-[var(--border-strong)] bg-[var(--surface-warm)] font-semibold text-[var(--text-secondary)]">
                  Plan nourri par le travail réel
                </Badge>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {priorityTasks.map((task) => (
                  <Card key={task.id} variant="default" padding="sm" className="border-[var(--border-strong)] bg-[var(--surface-warm)]" role="article">
                    <Badge variant="default" size="sm" className={`font-bold uppercase tracking-[0.16em] ${PRIORITY_META[task.priority]}`}>
                      {task.priority}
                    </Badge>
                    <p className="mt-4 text-sm font-semibold leading-6 text-[var(--navy)]">{task.description}</p>
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
              <Card key={week.numero} variant="default" padding="md" className="bg-[var(--card)]/90 border-[var(--border-strong)] shadow-[var(--shadow-md)] md:p-7" role="region" aria-label={`Semaine ${week.numero}`}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--teal)]">Semaine {week.numero}</p>
                    <h2 style={EDITORIAL_HEADING} className="mt-3 text-3xl leading-tight tracking-[-0.03em] text-[var(--navy)]">
                      {week.objectif}
                    </h2>
                  </div>
                  <Card variant="default" padding="sm" className="min-w-[180px] rounded-[22px] border-[var(--border-strong)] bg-[var(--surface-warm)] text-sm text-[var(--text-secondary)]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-[var(--navy)]">Avancement</span>
                      <span>{weekProgress}%</span>
                    </div>
                    <div className="mt-3 h-2.5 rounded-full bg-[var(--surface-sand)]">
                      <div className="h-2.5 rounded-full bg-[var(--navy)]" style={{ width: `${weekProgress}%` }} />
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
                            ? 'border-[var(--teal)]/24 bg-[var(--success-bg)] shadow-[var(--shadow-sm)]'
                            : 'border-[var(--border-strong)] bg-[var(--surface-paper)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]'
                        }`}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => void toggleActivity(id)}
                              className="mt-1 h-4 w-4 accent-[var(--navy)]"
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
                              <p className="mt-3 text-sm font-semibold leading-6 text-[var(--navy)]">{activity.titre}</p>
                            </div>
                          </div>

                          <Link
                            href={normalizeHref(activity.lien)}
                            className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--card)] px-4 py-2 text-sm font-semibold text-[var(--navy)] transition-colors hover:border-[var(--teal)] hover:text-[var(--teal)]"
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
              description="Finalise ton onboarding ou lance un premier atelier : la plateforme pourra alors te proposer une feuille de route personnalisée, semaine par semaine."
              variant="empty"
              icon={MapIcon}
              center
              action={
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
                  <Link
                    href="/onboarding"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--navy)] px-5 py-3 text-sm font-bold text-[var(--surface-parchment)] transition-all hover:-translate-y-0.5"
                  >
                    Terminer l’onboarding
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href={tutorHref}
                    className="inline-flex items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--card)] px-5 py-3 text-sm font-semibold text-[var(--navy)] transition-colors hover:border-[var(--teal)] hover:text-[var(--teal)]"
                  >
                    Ouvrir le guidage
                  </Link>
                </div>
              }
            />
          ) : null}
        </div>

        <aside className="space-y-6 xl:sticky xl:top-8 xl:self-start">
          <Card variant="default" padding="md" className="bg-[var(--card)]/90 border-[var(--border-strong)] shadow-[var(--shadow-md)] md:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--teal)]">Cap du moment</p>
            <h2 style={EDITORIAL_HEADING} className="mt-4 text-3xl leading-tight tracking-[-0.03em] text-[var(--navy)]">
              Une vue compacte pour reprendre le plan sans inertie.
            </h2>

            <div className="mt-6 rounded-[24px] border border-[var(--border-strong)] bg-[var(--surface-warm)] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-[var(--navy)]">Progression globale</span>
                <span className="text-sm font-bold text-[var(--text-secondary)]">{completionPercent}%</span>
              </div>
              <div className="mt-3 h-2.5 rounded-full bg-[var(--surface-sand)]">
                <div className="h-2.5 rounded-full bg-[var(--navy)]" style={{ width: `${completionPercent}%` }} />
              </div>
              <p className="mt-3 text-xs leading-5 text-[var(--text-muted)]">
                {completedActivities} blocs validés sur {totalActivities || 0}. L’objectif est de garder une cadence tenable, pas de cocher pour cocher.
              </p>
            </div>

            <div className="mt-5 rounded-[24px] border border-[var(--navy)]/14 bg-[var(--surface-navy-light)] p-4">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--navy)]">
                <Target className="h-4 w-4" />
                Prochain bloc conseillé
              </div>
              <p className="mt-3 text-sm font-semibold leading-6 text-[var(--navy)]">
                {nextPendingTask ? nextPendingTask.titre : 'Aucun bloc en attente pour le moment.'}
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {nextPendingTask
                  ? `${nextPendingTask.duree} · semaine ${nextPendingTask.semaine}`
                  : 'Le plan courant est entièrement coché ou pas encore généré.'}
              </p>
              <Link
                href={nextPendingTask?.lien ?? '/atelier-oral'}
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[var(--navy)] transition-colors hover:text-[var(--teal)]"
              >
                Lancer ce bloc
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {[
                {
                  title: 'Revenir au dashboard',
                  detail: 'Reprendre les signaux récents et vérifier ce que la dernière session a bougé.',
                  href: '/',
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
                  className="rounded-[22px] border border-[var(--border-strong)] bg-[var(--card)] p-4 transition-all hover:-translate-y-0.5 hover:border-[var(--teal)]"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--navy)] text-[var(--surface-parchment)]">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-[var(--navy)]">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{item.detail}</p>
                </Link>
              ))}
            </div>
          </Card>

          {skillSummary.length > 0 ? (
            <Card variant="default" padding="md" className="bg-[var(--card)]/90 border-[var(--border-strong)] shadow-[var(--shadow-md)] md:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--teal)]">Niveau de départ</p>
              <h2 style={EDITORIAL_HEADING} className="mt-4 text-3xl leading-tight tracking-[-0.03em] text-[var(--navy)]">
                Le parcours doit rester cohérent avec le profil mesuré.
              </h2>
              <div className="mt-6 space-y-5">
                {skillSummary.map((skill) => (
                  <div key={skill.label}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm font-medium">
                      <span className="text-[var(--navy)]">{skill.label}</span>
                      <span className="text-[var(--text-muted)]">{skill.score.toFixed(1)} / 20</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-[var(--surface-sand)]">
                      <div className={`h-2.5 rounded-full ${skill.accent}`} style={{ width: `${(skill.score / 20) * 100}%` }} />
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
