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
  fontFamily: "'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, serif",
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
    tone: 'bg-[#0f766e] text-white',
    softTone: 'border-[#0f766e]/16 bg-[#eef9f6] text-[#0f766e]',
    icon: Mic,
  },
  grammaire: {
    label: 'Grammaire',
    tone: 'bg-[#b87333] text-white',
    softTone: 'border-[#b87333]/16 bg-[#fdf4e9] text-[#9a5f25]',
    icon: BrainCircuit,
  },
  langue: {
    label: 'Langue',
    tone: 'bg-[#b87333] text-white',
    softTone: 'border-[#b87333]/16 bg-[#fdf4e9] text-[#9a5f25]',
    icon: BrainCircuit,
  },
  ecrit: {
    label: 'Écrit',
    tone: 'bg-[#17324d] text-white',
    softTone: 'border-[#17324d]/14 bg-[#eef3f8] text-[#17324d]',
    icon: PenTool,
  },
  lecture: {
    label: 'Lecture',
    tone: 'bg-[#6b587d] text-white',
    softTone: 'border-[#6b587d]/16 bg-[#f4eff8] text-[#6b587d]',
    icon: BookOpen,
  },
  revisions: {
    label: 'Révisions',
    tone: 'bg-[#6b587d] text-white',
    softTone: 'border-[#6b587d]/16 bg-[#f4eff8] text-[#6b587d]',
    icon: BookOpen,
  },
  fiches: {
    label: 'Fiches',
    tone: 'bg-[#6b587d] text-white',
    softTone: 'border-[#6b587d]/16 bg-[#f4eff8] text-[#6b587d]',
    icon: BookOpen,
  },
  quiz: {
    label: 'Quiz',
    tone: 'bg-[#17324d] text-white',
    softTone: 'border-[#17324d]/14 bg-[#eef3f8] text-[#17324d]',
    icon: Sparkles,
  },
  organisation: {
    label: 'Organisation',
    tone: 'bg-[#7a4b24] text-white',
    softTone: 'border-[#7a4b24]/16 bg-[#fbf2ea] text-[#7a4b24]',
    icon: CalendarDays,
  },
};

const PRIORITY_META = {
  high: 'border-[#b87333]/18 bg-[#fdf4e9] text-[#9a5f25]',
  medium: 'border-[#17324d]/14 bg-[#eef3f8] text-[#17324d]',
  low: 'border-[#0f766e]/14 bg-[#eef9f6] text-[#0f766e]',
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
      { label: 'Écrit', score: profile.skillMap.ecrit, accent: 'bg-[#17324d]' },
      { label: 'Oral', score: profile.skillMap.oral, accent: 'bg-[#0f766e]' },
      { label: 'Grammaire', score: profile.skillMap.grammaire, accent: 'bg-[#b87333]' },
      { label: 'Lecture cursive', score: profile.skillMap.lectureCursive, accent: 'bg-[#6b587d]' },
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
      <section className="relative overflow-hidden rounded-[38px] border border-white/10 bg-[#17324d] p-6 text-[#f7f2ea] shadow-[0_32px_90px_rgba(23,50,77,0.24)] md:p-8 lg:p-10">
        <div className="absolute inset-y-0 right-[-8%] hidden w-[40%] rounded-full bg-[radial-gradient(circle_at_center,_rgba(126,212,194,0.24),_transparent_70%)] blur-2xl lg:block" />
        <div className="absolute left-[-6%] top-[-20%] h-44 w-44 rounded-full bg-[rgba(216,163,99,0.16)] blur-3xl" />

        <div className="relative grid gap-8 xl:grid-cols-[1.04fr_0.96fr] xl:items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[#d7c4aa]">
              <MapIcon className="h-4 w-4" />
              Feuille de route Nexus
            </div>
            <h1 style={EDITORIAL_HEADING} className="mt-6 text-4xl leading-tight tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl">
              Ton parcours doit rendre la semaine lisible avant de la rendre ambitieuse.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-200 sm:text-lg">
              {profile?.displayName ? `${profile.displayName}, ` : ''}ici, le plan transforme le profil, l’historique de travail et les attendus
              officiels en blocs concrets: quoi lancer, dans quel ordre, et comment reprendre sans perdre le fil.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href={nextPendingTask?.lien ?? '/atelier-oral'}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#f7f2ea] px-6 py-3.5 text-sm font-bold text-[#17324d] transition-all hover:-translate-y-0.5 hover:bg-white"
              >
                {nextPendingTask ? 'Lancer la prochaine activité' : 'Ouvrir un atelier'}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-white/14 px-6 py-3.5 text-sm font-semibold text-[#f7f2ea] transition-colors hover:bg-white/6"
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
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-[24px] border border-[#b65050]/25 bg-[#fff0ef] p-4 text-sm text-[#8f2d2d] shadow-[0_12px_28px_rgba(182,80,80,0.08)]">
          <AlertTriangle className="mr-2 inline h-4 w-4" />
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-[30px] border border-[#d8ccb9] bg-white/90 p-6 text-sm text-slate-500 shadow-[0_18px_45px_rgba(23,50,77,0.06)]">
          Chargement du plan personnalisé à partir du profil et des activités déjà réalisées...
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="space-y-6">
          {priorityTasks.length > 0 ? (
            <section className="rounded-[30px] border border-[#d8ccb9] bg-white/90 p-6 shadow-[0_18px_45px_rgba(23,50,77,0.06)] md:p-7">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#0f766e]">Priorités immédiates</p>
                  <h2 style={EDITORIAL_HEADING} className="mt-4 text-4xl leading-tight tracking-[-0.03em] text-[#17324d] sm:text-5xl">
                    Les trois prochains blocs qui méritent d’ouvrir la semaine.
                  </h2>
                </div>
                <div className="rounded-full border border-[#d8ccb9] bg-[#f8f4ec] px-4 py-2 text-sm font-semibold text-slate-600">
                  Plan nourri par le travail réel
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {priorityTasks.map((task) => (
                  <article key={task.id} className="rounded-[24px] border border-[#d8ccb9] bg-[#f8f4ec] p-4">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${PRIORITY_META[task.priority]}`}>
                      {task.priority}
                    </span>
                    <p className="mt-4 text-sm font-semibold leading-6 text-[#17324d]">{task.description}</p>
                    <p className="mt-3 text-sm text-slate-500">
                      {task.estimatedMinutes} min · {formatDueDate(task.dueDate)}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          {(plan?.semaines ?? []).map((week) => {
            const weekEntries = week.activites.slice(0, 5).map((activity, idx) => ({
              activity,
              id: `${week.numero}-${idx}-${activity.titre}`,
            }));
            const completedWeek = weekEntries.filter((entry) => checkedIds.has(entry.id)).length;
            const weekProgress = progressRatio(completedWeek, weekEntries.length);

            return (
              <section key={week.numero} className="rounded-[30px] border border-[#d8ccb9] bg-white/90 p-6 shadow-[0_18px_45px_rgba(23,50,77,0.06)] md:p-7">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#0f766e]">Semaine {week.numero}</p>
                    <h2 style={EDITORIAL_HEADING} className="mt-3 text-3xl leading-tight tracking-[-0.03em] text-[#17324d]">
                      {week.objectif}
                    </h2>
                  </div>
                  <div className="min-w-[180px] rounded-[22px] border border-[#d8ccb9] bg-[#f8f4ec] px-4 py-3 text-sm text-slate-600">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-[#17324d]">Avancement</span>
                      <span>{weekProgress}%</span>
                    </div>
                    <div className="mt-3 h-2.5 rounded-full bg-[#e7ddcf]">
                      <div className="h-2.5 rounded-full bg-[#17324d]" style={{ width: `${weekProgress}%` }} />
                    </div>
                    <p className="mt-3 text-xs text-slate-500">
                      {completedWeek} / {weekEntries.length} activités cochées
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {weekEntries.map(({ activity, id }) => {
                    const checked = checkedIds.has(id);
                    const meta = TYPE_META[activity.type] ?? TYPE_META.ecrit;
                    const Icon = meta.icon;

                    return (
                      <div
                        key={id}
                        className={`rounded-[24px] border p-4 transition-all ${
                          checked
                            ? 'border-[#0f766e]/24 bg-[#eef8f0] shadow-[0_12px_30px_rgba(15,118,110,0.08)]'
                            : 'border-[#d8ccb9] bg-[#fcfaf6] hover:-translate-y-0.5 hover:shadow-[0_16px_35px_rgba(23,50,77,0.06)]'
                        }`}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => void toggleActivity(id)}
                              className="mt-1 h-4 w-4 accent-[#17324d]"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${meta.tone}`}>
                                  {meta.label}
                                </span>
                                <span className="inline-flex items-center gap-2 rounded-full border border-[#d8ccb9] bg-white px-3 py-1 text-xs font-semibold text-slate-500">
                                  <Icon className="h-3.5 w-3.5" />
                                  {activity.duree}
                                </span>
                              </div>
                              <p className="mt-3 text-sm font-semibold leading-6 text-[#17324d]">{activity.titre}</p>
                            </div>
                          </div>

                          <Link
                            href={normalizeHref(activity.lien)}
                            className="inline-flex items-center justify-center rounded-full border border-[#d8ccb9] bg-white px-4 py-2 text-sm font-semibold text-[#17324d] transition-colors hover:border-[#0f766e] hover:text-[#0f766e]"
                          >
                            Ouvrir
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {weekTasks.length === 0 && !isLoading ? (
            <div className="rounded-[30px] border border-[#d8ccb9] bg-white/90 p-6 shadow-[0_18px_45px_rgba(23,50,77,0.06)]">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#0f766e]">Parcours indisponible</p>
              <h2 style={EDITORIAL_HEADING} className="mt-4 text-3xl leading-tight tracking-[-0.03em] text-[#17324d]">
                Il n’y a pas encore assez de matière pour composer une feuille de route utile.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
                Termine l’onboarding, lance un premier atelier, puis reviens ici pour afficher un parcours plus net et réellement personnalisé.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/onboarding"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#17324d] px-5 py-3 text-sm font-bold text-[#f7f2ea] transition-all hover:-translate-y-0.5"
                >
                  Terminer l’onboarding
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={tutorHref}
                  className="inline-flex items-center justify-center rounded-full border border-[#d8ccb9] bg-[#f8f4ec] px-5 py-3 text-sm font-semibold text-[#17324d] transition-colors hover:border-[#0f766e] hover:text-[#0f766e]"
                >
                  Ouvrir le guidage
                </Link>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="space-y-6 xl:sticky xl:top-8 xl:self-start">
          <section className="rounded-[30px] border border-[#d8ccb9] bg-white/90 p-6 shadow-[0_18px_45px_rgba(23,50,77,0.06)] md:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#0f766e]">Cap du moment</p>
            <h2 style={EDITORIAL_HEADING} className="mt-4 text-3xl leading-tight tracking-[-0.03em] text-[#17324d]">
              Une vue compacte pour reprendre le plan sans inertie.
            </h2>

            <div className="mt-6 rounded-[24px] border border-[#d8ccb9] bg-[#f8f4ec] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-[#17324d]">Progression globale</span>
                <span className="text-sm font-bold text-slate-600">{completionPercent}%</span>
              </div>
              <div className="mt-3 h-2.5 rounded-full bg-[#e7ddcf]">
                <div className="h-2.5 rounded-full bg-[#17324d]" style={{ width: `${completionPercent}%` }} />
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                {completedActivities} blocs validés sur {totalActivities || 0}. L’objectif est de garder une cadence tenable, pas de cocher pour cocher.
              </p>
            </div>

            <div className="mt-5 rounded-[24px] border border-[#17324d]/14 bg-[#eef3f8] p-4">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#17324d]">
                <Target className="h-4 w-4" />
                Prochain bloc conseillé
              </div>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#17324d]">
                {nextPendingTask ? nextPendingTask.titre : 'Aucun bloc en attente pour le moment.'}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {nextPendingTask
                  ? `${nextPendingTask.duree} · semaine ${nextPendingTask.semaine}`
                  : 'Le plan courant est entièrement coché ou pas encore généré.'}
              </p>
              <Link
                href={nextPendingTask?.lien ?? '/atelier-oral'}
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#17324d] transition-colors hover:text-[#0f766e]"
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
                  className="rounded-[22px] border border-[#d8ccb9] bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-[#0f766e]"
                >
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#17324d] text-[#f7f2ea]">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <p className="mt-4 text-sm font-semibold text-[#17324d]">{item.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
                </Link>
              ))}
            </div>
          </section>

          {skillSummary.length > 0 ? (
            <section className="rounded-[30px] border border-[#d8ccb9] bg-white/90 p-6 shadow-[0_18px_45px_rgba(23,50,77,0.06)] md:p-7">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#0f766e]">Niveau de départ</p>
              <h2 style={EDITORIAL_HEADING} className="mt-4 text-3xl leading-tight tracking-[-0.03em] text-[#17324d]">
                Le parcours doit rester cohérent avec le profil mesuré.
              </h2>
              <div className="mt-6 space-y-5">
                {skillSummary.map((skill) => (
                  <div key={skill.label}>
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm font-medium">
                      <span className="text-[#17324d]">{skill.label}</span>
                      <span className="text-slate-500">{skill.score.toFixed(1)} / 20</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-[#e7ddcf]">
                      <div className={`h-2.5 rounded-full ${skill.accent}`} style={{ width: `${(skill.score / 20) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
