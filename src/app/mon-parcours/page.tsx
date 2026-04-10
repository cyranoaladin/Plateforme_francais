'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Map as MapIcon,
  Mic,
  PenTool,
  Clock,
  Calendar,
  BarChart3,
  GraduationCap,
} from 'lucide-react';
import { buildTuteurHref } from '@/lib/navigation/tuteur-link';
import { getCsrfToken } from '@/lib/security/csrf-client';

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



const TYPE_META: Record<
  string,
  {
    label: string;
    bgColor: string;
    borderColor: string;
    color: string;
    icon: typeof BrainCircuit;
  }
> = {
  oral: {
    label: 'Oral',
    bgColor: 'rgba(26,213,160,0.12)',
    borderColor: 'var(--eaf-teal-border)',
    color: 'var(--eaf-teal)',
    icon: Mic,
  },
  grammaire: {
    label: 'Grammaire',
    bgColor: 'rgba(255,181,71,0.10)',
    borderColor: 'var(--eaf-gold-border)',
    color: 'var(--eaf-gold)',
    icon: BrainCircuit,
  },
  langue: {
    label: 'Langue',
    bgColor: 'rgba(255,181,71,0.10)',
    borderColor: 'var(--eaf-gold-border)',
    color: 'var(--eaf-gold)',
    icon: BrainCircuit,
  },
  ecrit: {
    label: 'Écrit',
    bgColor: 'rgba(123,142,255,0.15)',
    borderColor: 'var(--eaf-indigo-border)',
    color: 'var(--eaf-indigo)',
    icon: PenTool,
  },
  lecture: {
    label: 'Lecture',
    bgColor: 'rgba(123,142,255,0.15)',
    borderColor: 'var(--eaf-indigo-border)',
    color: 'var(--eaf-indigo)',
    icon: BookOpen,
  },
  revisions: {
    label: 'Révisions',
    bgColor: 'rgba(255,181,71,0.10)',
    borderColor: 'var(--eaf-gold-border)',
    color: 'var(--eaf-gold)',
    icon: BookOpen,
  },
};

const PRIORITY_META = {
  high: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.25)', color: '#ef4444', label: 'Haute' },
  medium: { bg: 'rgba(255,181,71,0.10)', border: 'var(--eaf-gold-border)', color: 'var(--eaf-gold)', label: 'Moyenne' },
  low: { bg: 'rgba(26,213,160,0.08)', border: 'var(--eaf-teal-border)', color: 'var(--eaf-teal)', label: 'Faible' },
};

const SAMPLE_SEMAINES = [
  {
    numero: 1,
    objectif: 'Entraînements intensifs dissertation + oral (mars-avril)',
    activites: [
      { type: 'ecrit', titre: 'Plan de dissertation en temps limité', duree: '40 min', lien: '/atelier-ecrit' },
      { type: 'oral', titre: 'Simulation complète 12 + 8', duree: '30 min', lien: '/atelier-oral' },
      { type: 'revisions', titre: 'Révision citations utiles', duree: '20 min', lien: '/bibliotheque' },
    ],
  },
  {
    numero: 2,
    objectif: 'Consolidation grammaire + lecture cursive',
    activites: [
      { type: 'grammaire', titre: 'Exercices de syntaxe complexes', duree: '25 min', lien: '/atelier-langue' },
      { type: 'lecture', titre: 'Lecture analytique de passage', duree: '35 min', lien: '/bibliotheque' },
      { type: 'oral', titre: 'Présentation + entretien', duree: '20 min', lien: '/atelier-oral' },
    ],
  },
  {
    numero: 3,
    objectif: 'Préparation intensive à l\'épreuve écrite',
    activites: [
      { type: 'ecrit', titre: 'Commentaire composé complet', duree: '4h', lien: '/atelier-ecrit' },
      { type: 'ecrit', titre: 'Dissertation sur sujet imposé', duree: '4h', lien: '/atelier-ecrit' },
      { type: 'revisions', titre: 'Relecture des fiches méthode', duree: '30 min', lien: '/carnet' },
    ],
  },
  {
    numero: 4,
    objectif: 'Affûtage oral et révisions finales',
    activites: [
      { type: 'oral', titre: 'Mock exam oral complet', duree: '45 min', lien: '/atelier-oral' },
      { type: 'oral', titre: 'Entraînement lecture expressive', duree: '15 min', lien: '/atelier-oral' },
      { type: 'revisions', titre: 'Dernière revue du corpus', duree: '1h', lien: '/bibliotheque' },
    ],
  },
];

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
  if (Number.isNaN(parsed.getTime())) return 'Date à préciser';
  return parsed.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function formatScoreLabel(value: number | null): string {
  if (value === null) return 'Diagnostic à lancer';
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
        const csrfToken = await getCsrfToken();

        const [profileResponse, planResponse] = await Promise.all([
          fetch('/api/v1/student/profile'),
          fetch('/api/v1/parcours/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': csrfToken,
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
          // Use sample data if API fails
          setPlan({ semaines: SAMPLE_SEMAINES });
        } else {
          const planData = await planResponse.json() as Plan;
          setPlan(planData.semaines?.length ? planData : { semaines: SAMPLE_SEMAINES });
        }
      } catch {
        // Fallback to sample data
        setPlan({ semaines: SAMPLE_SEMAINES });
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const priorityTasks = profile?.studyPlan?.tasks?.slice(0, 3) ?? [
    { id: '1', description: 'Simulation orale 12+8 min', estimatedMinutes: 25, dueDate: '2026-04-11', priority: 'high' as const, skill: 'oral' },
    { id: '2', description: 'Question de grammaire sur phrase courte', estimatedMinutes: 20, dueDate: '2026-04-12', priority: 'medium' as const, skill: 'grammaire' },
    { id: '3', description: 'Plan détaillé de dissertation', estimatedMinutes: 30, dueDate: '2026-04-13', priority: 'medium' as const, skill: 'ecrit' },
  ];

  const weekTasks = useMemo(() => {
    const semaines = plan?.semaines ?? SAMPLE_SEMAINES;
    return semaines.flatMap((week) =>
      week.activites.slice(0, 5).map((activity, idx) => ({
        id: `${week.numero}-${idx}-${activity.titre}`,
        titre: activity.titre,
        type: activity.type,
        duree: activity.duree,
        lien: normalizeHref(activity.lien),
        semaine: week.numero,
      }))
    );
  }, [plan]);

  const totalWeeks = plan?.semaines.length ?? SAMPLE_SEMAINES.length;
  const totalActivities = weekTasks.length;
  const completedActivities = checkedIds.size;
  const completionPercent = progressRatio(completedActivities, totalActivities);
  const nextPendingTask = weekTasks.find((task) => !checkedIds.has(task.id)) ?? null;
  const tutorHref = buildTuteurHref({
    workId: profile?.oeuvreChoisieEntretien ?? profile?.selectedOeuvres?.[0] ?? null,
  });

  const skillSummary = useMemo(() => {
    if (!profile?.skillMap) {
      return [
        { label: 'Écrit', score: 7.3, color: '#ef4444' },
        { label: 'Oral', score: 7.7, color: 'var(--eaf-teal)' },
        { label: 'Grammaire', score: 7.1, color: 'var(--eaf-orange)' },
        { label: 'Lecture cursive', score: 7.4, color: 'var(--eaf-indigo)' },
      ];
    }
    return [
      { label: 'Écrit', score: profile.skillMap.ecrit, color: '#ef4444' },
      { label: 'Oral', score: profile.skillMap.oral, color: 'var(--eaf-teal)' },
      { label: 'Grammaire', score: profile.skillMap.grammaire, color: 'var(--eaf-orange)' },
      { label: 'Lecture cursive', score: profile.skillMap.lectureCursive, color: 'var(--eaf-indigo)' },
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
      const csrfToken = await getCsrfToken();
      await fetch('/api/v1/memory/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
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

  const semaines = plan?.semaines ?? SAMPLE_SEMAINES;

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* ─── D.1 HERO CARD FEUILLE DE ROUTE ─── */}
      <section 
        className="relative overflow-hidden rounded-[24px] p-8 md:p-10"
        style={{ 
          background: 'linear-gradient(135deg, #0d1a35 0%, #111c30 60%, #0f1629 100%)',
          border: '1px solid var(--eaf-indigo-border)'
        }}
      >
        {/* Decorative orbs */}
        <div 
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-25"
          style={{ background: 'radial-gradient(circle, var(--eaf-indigo), transparent 70%)' }}
        />
        <div 
          className="pointer-events-none absolute -bottom-10 right-6 h-20 w-20 rounded-full opacity-40"
          style={{ background: 'radial-gradient(circle, var(--eaf-indigo), transparent 70%)' }}
        />

        <div className="relative">
          <div className="flex items-center gap-2 mb-6">
            <MapIcon className="h-4 w-4" style={{ color: 'var(--eaf-indigo)' }} />
            <span 
              className="text-[11px] font-semibold uppercase tracking-[0.06em]"
              style={{ color: 'var(--eaf-indigo)' }}
            >
              Feuille de route Nexus
            </span>
          </div>

          <h1 
            className="text-[36px] md:text-[40px] font-bold leading-[1.1] tracking-[-1.8px] max-w-[600px] mb-5"
            style={{ 
              fontFamily: 'var(--eaf-font-display)',
              color: 'var(--eaf-text-primary)'
            }}
          >
            Ton parcours doit rendre la semaine lisible avant de la rendre ambitieuse.
          </h1>

          <p 
            className="text-[14px] leading-[1.6] max-w-[560px] mb-7"
            style={{ color: 'var(--eaf-text-secondary)' }}
          >
            {profile?.displayName ? `${profile.displayName}, ` : ''}ici, le plan transforme le profil, l&apos;histoire de travail et les attendus officiels en blocs concrets : quoi lancer, dans quel ordre, et comment reprendre sans perdre le fil.
          </p>

          {/* 4 Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7">
            {[
              { label: 'SEMAINES CADRÉES', value: String(totalWeeks) },
              { label: 'BLOCS PRÉVUS', value: String(totalActivities) },
              { label: 'BLOCS COCHÉS', value: String(completedActivities) },
              { label: 'AVANCEMENT', value: `${completionPercent}%` },
            ].map((stat) => (
              <div 
                key={stat.label}
                className="rounded-xl p-4"
                style={{ 
                  background: 'rgba(255,255,255,0.04)', 
                  border: '1px solid var(--eaf-border)'
                }}
              >
                <p 
                  className="text-[10px] font-semibold uppercase tracking-wide mb-1"
                  style={{ color: 'var(--eaf-text-tertiary)' }}
                >
                  {stat.label}
                </p>
                <p 
                  className="text-[28px] font-bold"
                  style={{ 
                    fontFamily: 'var(--eaf-font-display)',
                    color: 'var(--eaf-text-primary)'
                  }}
                >
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap gap-3">
            <Link
              href={nextPendingTask?.lien ?? '/atelier-oral'}
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[14px] font-semibold text-white transition-all"
              style={{ background: 'var(--eaf-orange)' }}
            >
              {nextPendingTask ? 'Lancer la prochaine activité' : 'Ouvrir un atelier'}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[14px] font-medium transition-all"
              style={{ 
                background: 'transparent',
                border: '1px solid var(--eaf-border)',
                color: 'var(--eaf-text-secondary)'
              }}
            >
              Retour au tableau de bord
            </Link>
          </div>
        </div>
      </section>

      {/* ─── D.2 MESSAGE CHARGEMENT ─── */}
      {isLoading && (
        <div 
          className="flex items-center gap-4 rounded-[14px] p-5"
          style={{ 
            background: 'var(--eaf-bg1)', 
            border: '1px solid var(--eaf-border)'
          }}
        >
          <div 
            className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--eaf-border)] border-t-[var(--eaf-indigo)]"
          />
          <div>
            <p 
              className="text-[14px] font-semibold"
              style={{ color: 'var(--eaf-text-primary)' }}
            >
              Construction de ton plan personnalisé
            </p>
            <p 
              className="text-[12px]"
              style={{ color: 'var(--eaf-text-secondary)' }}
            >
              Ton profil et tes activités sont en cours d&apos;analyse pour te proposer une feuille de route adaptée.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div 
          className="rounded-[14px] p-5"
          style={{ 
            background: 'var(--eaf-orange-dim)', 
            border: '1px solid var(--eaf-orange-border)'
          }}
        >
          <p style={{ color: 'var(--eaf-orange)' }}>{error}</p>
        </div>
      )}

      {/* ─── D.3 GRID 2 COLONNES: Priorités + Cap ─── */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Priorités immédiates */}
        <div 
          className="rounded-[18px] p-6 relative"
          style={{ 
            background: 'var(--eaf-bg1)', 
            border: '1px solid var(--eaf-border)'
          }}
        >
          <div className="flex items-start justify-between mb-5">
            <div>
              <span 
                className="text-[11px] font-semibold uppercase tracking-[0.06em]"
                style={{ color: 'var(--eaf-indigo)' }}
              >
                Priorités immédiates
              </span>
              <h2 
                className="text-[26px] font-bold mt-1"
                style={{ 
                  fontFamily: 'var(--eaf-font-display)',
                  color: 'var(--eaf-text-primary)'
                }}
              >
                Les trois prochains blocs qui méritent d&apos;ouvrir la semaine.
              </h2>
            </div>
            <span 
              className="absolute top-6 right-6 rounded-full px-3 py-1.5 text-[11px] text-center max-w-[90px]"
              style={{ 
                background: 'var(--eaf-bg3)', 
                border: '1px solid var(--eaf-border)',
                color: 'var(--eaf-text-tertiary)'
              }}
            >
              Plan nourri par le travail réel
            </span>
          </div>

          <div className="space-y-3">
            {priorityTasks.map((task) => (
              <div 
                key={task.id}
                className="rounded-xl p-4 transition-all cursor-pointer"
                style={{ 
                  background: 'var(--eaf-bg1)', 
                  border: '1px solid var(--eaf-border)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--eaf-indigo-border)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--eaf-border)';
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span 
                    className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
                    style={{ 
                      background: PRIORITY_META[task.priority].bg,
                      border: `1px solid ${PRIORITY_META[task.priority].border}`,
                      color: PRIORITY_META[task.priority].color
                    }}
                  >
                    {PRIORITY_META[task.priority].label}
                  </span>
                  <span 
                    className="text-[11px] flex items-center gap-1"
                    style={{ color: 'var(--eaf-text-tertiary)' }}
                  >
                    <Clock className="h-3 w-3" />
                    {task.estimatedMinutes} min
                    <span className="mx-1">·</span>
                    <Calendar className="h-3 w-3" />
                    {formatDueDate(task.dueDate)}
                  </span>
                </div>
                <p 
                  className="text-[14px] font-semibold"
                  style={{ color: 'var(--eaf-text-primary)' }}
                >
                  {task.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Cap du moment */}
        <div 
          className="rounded-[18px] p-6"
          style={{ 
            background: 'var(--eaf-bg1)', 
            border: '1px solid var(--eaf-border)'
          }}
        >
          <span 
            className="text-[11px] font-semibold uppercase tracking-[0.06em]"
            style={{ color: 'var(--eaf-indigo)' }}
          >
            Cap du moment
          </span>
          <h2 
            className="text-[22px] font-bold mt-1 mb-5"
            style={{ 
              fontFamily: 'var(--eaf-font-display)',
              color: 'var(--eaf-text-primary)'
            }}
          >
            Une vue compacte pour reprendre le plan sans inertie.
          </h2>

          {/* Progression globale */}
          <div 
            className="rounded-xl p-4 mb-4"
            style={{ 
              background: 'var(--eaf-bg2)', 
              border: '1px solid var(--eaf-border)'
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span 
                className="text-[13px] font-medium"
                style={{ color: 'var(--eaf-text-primary)' }}
              >
                Progression globale
              </span>
              <span 
                className="text-[13px] font-bold"
                style={{ color: 'var(--eaf-indigo)' }}
              >
                {completionPercent}%
              </span>
            </div>
            <div 
              className="h-1.5 rounded-full mb-2"
              style={{ background: 'var(--eaf-bg3)' }}
            >
              <div 
                className="h-1.5 rounded-full transition-all duration-500"
                style={{ 
                  width: `${completionPercent}%`,
                  background: 'var(--eaf-gradient-progress)'
                }}
              />
            </div>
            <p 
              className="text-[11px]"
              style={{ color: 'var(--eaf-text-tertiary)' }}
            >
              {completedActivities} blocs validés sur {totalActivities || 0}. L&apos;objectif est de garder une cadence tenable, pas de cocher pour cocher.
            </p>
          </div>

          {/* 3 Suggestions */}
          <div className="space-y-3">
            <div 
              className="flex items-start gap-3 rounded-xl p-3"
              style={{ background: 'var(--eaf-bg2)', border: '1px solid var(--eaf-border)' }}
            >
              <div 
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                style={{ background: 'rgba(123,142,255,0.15)' }}
              >
                <Calendar className="h-3.5 w-3.5" style={{ color: 'var(--eaf-indigo)' }} />
              </div>
              <div>
                <p 
                  className="text-[11px] font-semibold uppercase mb-0.5"
                  style={{ color: 'var(--eaf-indigo)' }}
                >
                  Prochain bloc conseillé
                </p>
                <p 
                  className="text-[13px] font-semibold mb-0.5"
                  style={{ color: 'var(--eaf-text-primary)' }}
                >
                  {nextPendingTask?.titre ?? 'Plan de dissertation en temps limité'}
                </p>
                <p 
                  className="text-[11px] mb-1"
                  style={{ color: 'var(--eaf-text-secondary)' }}
                >
                  {nextPendingTask?.duree ?? '40 min'} · semaine {nextPendingTask?.semaine ?? 1}
                </p>
                <Link 
                  href={nextPendingTask?.lien ?? '/atelier-ecrit'}
                  className="text-[12px] font-medium"
                  style={{ color: 'var(--eaf-indigo)' }}
                >
                  Lancer ce bloc →
                </Link>
              </div>
            </div>

            <div 
              className="flex items-start gap-3 rounded-xl p-3"
              style={{ background: 'var(--eaf-bg2)', border: '1px solid var(--eaf-border)' }}
            >
              <div 
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                style={{ background: 'rgba(26,213,160,0.12)' }}
              >
                <GraduationCap className="h-3.5 w-3.5" style={{ color: 'var(--eaf-teal)' }} />
              </div>
              <div>
                <p 
                  className="text-[13px] font-semibold mb-0.5"
                  style={{ color: 'var(--eaf-text-primary)' }}
                >
                  Revenir au tableau de bord
                </p>
                <p 
                  className="text-[12px]"
                  style={{ color: 'var(--eaf-text-secondary)' }}
                >
                  Reprendre les signaux récents et vérifier ce que la dernière session a bougé.
                </p>
              </div>
            </div>

            <div 
              className="flex items-start gap-3 rounded-xl p-3"
              style={{ background: 'var(--eaf-bg2)', border: '1px solid var(--eaf-border)' }}
            >
              <div 
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                style={{ background: 'rgba(255,181,71,0.10)' }}
              >
                <BarChart3 className="h-3.5 w-3.5" style={{ color: 'var(--eaf-gold)' }} />
              </div>
              <div>
                <p 
                  className="text-[13px] font-semibold mb-0.5"
                  style={{ color: 'var(--eaf-text-primary)' }}
                >
                  Débloquer un passage précis
                </p>
                <p 
                  className="text-[12px]"
                  style={{ color: 'var(--eaf-text-secondary)' }}
                >
                  Utiliser le guidage de parcours pour débloquer un passage avant de relancer la semaine.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── D.4 SEMAINES ─── */}
      {semaines.map((week) => {
        const weekEntries = week.activites.map((activity, idx) => ({
          activity,
          id: `${week.numero}-${idx}-${activity.titre}`,
        }));
        const completedWeek = weekEntries.filter((entry) => checkedIds.has(entry.id)).length;
        const weekProgress = progressRatio(completedWeek, weekEntries.length);

        return (
          <div 
            key={week.numero}
            className="rounded-[18px] overflow-hidden"
            style={{ 
              background: 'var(--eaf-bg1)', 
              border: '1px solid var(--eaf-border)'
            }}
          >
            {/* Header semaine */}
            <div 
              className="flex items-center justify-between p-5"
              style={{ background: 'var(--eaf-bg2)', borderBottom: '1px solid var(--eaf-border)' }}
            >
              <div>
                <span 
                  className="text-[11px] font-semibold uppercase tracking-[0.06em]"
                  style={{ color: 'var(--eaf-indigo)' }}
                >
                  Semaine {week.numero}
                </span>
                <h3 
                  className="text-[20px] font-bold mt-1"
                  style={{ 
                    fontFamily: 'var(--eaf-font-display)',
                    color: 'var(--eaf-text-primary)'
                  }}
                >
                  {week.objectif}
                </h3>
              </div>
              <div 
                className="rounded-full px-3 py-1.5 text-center"
                style={{ background: 'var(--eaf-bg3)', border: '1px solid var(--eaf-border)' }}
              >
                <span 
                  className="text-[11px] block"
                  style={{ color: 'var(--eaf-text-tertiary)' }}
                >
                  Avancement
                </span>
                <span 
                  className="text-[14px] font-bold block"
                  style={{ color: 'var(--eaf-text-primary)' }}
                >
                  {weekProgress}%
                </span>
                <span 
                  className="text-[10px] block"
                  style={{ color: 'var(--eaf-text-tertiary)' }}
                >
                  {completedWeek} / {weekEntries.length} activités cochées
                </span>
              </div>
            </div>

            {/* Liste activités */}
            <div className="p-5 space-y-2.5">
              {weekEntries.map(({ activity, id }) => {
                const checked = checkedIds.has(id);
                const meta = TYPE_META[activity.type] ?? TYPE_META.ecrit;


                return (
                  <div 
                    key={id}
                    className="flex items-center gap-3 rounded-xl p-3.5 transition-all"
                    style={{ 
                      background: checked ? 'var(--eaf-teal-dim)' : 'var(--eaf-bg2)',
                      border: checked ? '1px solid var(--eaf-teal-border)' : '1px solid var(--eaf-border)'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => void toggleActivity(id)}
                      className="h-4 w-4 rounded cursor-pointer"
                      style={{ 
                        accentColor: 'var(--eaf-teal)',
                        border: checked ? '2px solid var(--eaf-teal)' : '2px solid var(--eaf-border)',
                      }}
                    />

                    <span 
                      className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase shrink-0"
                      style={{ 
                        background: meta.bgColor,
                        border: `1px solid ${meta.borderColor}`,
                        color: meta.color
                      }}
                    >
                      {meta.label}
                    </span>

                    <Clock className="h-3 w-3 shrink-0" style={{ color: 'var(--eaf-text-tertiary)' }} />
                    <span 
                      className="text-[11px] shrink-0"
                      style={{ color: 'var(--eaf-text-secondary)' }}
                    >
                      {activity.duree}
                    </span>

                    <span 
                      className="text-[13px] font-medium flex-1"
                      style={{ color: 'var(--eaf-text-primary)' }}
                    >
                      {activity.titre}
                    </span>

                    <Link
                      href={normalizeHref(activity.lien)}
                      className="rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all shrink-0"
                      style={{ 
                        background: 'transparent',
                        border: '1px solid var(--eaf-border)',
                        color: 'var(--eaf-text-secondary)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--eaf-indigo-border)';
                        e.currentTarget.style.color = 'var(--eaf-indigo)';
                        e.currentTarget.style.background = 'var(--eaf-indigo-dim)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--eaf-border)';
                        e.currentTarget.style.color = 'var(--eaf-text-secondary)';
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      Ouvrir
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* ─── D.5 NIVEAU DE DÉPART ─── */}
      <div 
        className="rounded-[18px] p-7"
        style={{ 
          background: 'var(--eaf-bg1)', 
          border: '1px solid var(--eaf-border)'
        }}
      >
        <div className="mb-5">
          <span 
            className="text-[11px] font-semibold uppercase tracking-[0.06em]"
            style={{ color: 'var(--eaf-indigo)' }}
          >
            Niveau de départ
          </span>
          <h2 
            className="text-[22px] font-bold mt-1"
            style={{ 
              fontFamily: 'var(--eaf-font-display)',
              color: 'var(--eaf-text-primary)'
            }}
          >
            Le parcours doit rester cohérent avec le profil mesuré.
          </h2>
        </div>

        <div className="space-y-4">
          {skillSummary.map((skill) => (
            <div key={skill.label} className="flex items-center gap-4">
              <span 
                className="text-[13px] font-medium w-28 shrink-0"
                style={{ color: 'var(--eaf-text-secondary)' }}
              >
                {skill.label}
              </span>
              <div 
                className="h-1.5 flex-1 rounded-full"
                style={{ background: 'var(--eaf-bg3)' }}
              >
                <div 
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${((skill.score ?? 0) / 20) * 100}%`,
                    background: skill.color
                  }}
                />
              </div>
              <span 
                className="text-[12px] font-semibold w-16 text-right shrink-0"
                style={{ color: 'var(--eaf-text-primary)' }}
              >
                {formatScoreLabel(skill.score)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Error state / Empty state fallback ─── */}
      {weekTasks.length === 0 && !isLoading && (
        <div 
          className="rounded-[18px] p-8 text-center"
          style={{ 
            background: 'var(--eaf-bg1)', 
            border: '1px solid var(--eaf-border)'
          }}
        >
          <MapIcon className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--eaf-text-tertiary)' }} />
          <h3 
            className="text-[18px] font-bold mb-2"
            style={{ color: 'var(--eaf-text-primary)' }}
          >
            Ton parcours se construit à partir de tes premières activités
          </h3>
          <p 
            className="text-[14px] mb-5"
            style={{ color: 'var(--eaf-text-secondary)' }}
          >
            Finalise la configuration de ton parcours ou lance un premier atelier.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[14px] font-semibold text-white"
              style={{ background: 'var(--eaf-orange)' }}
            >
              Terminer la configuration
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={tutorHref}
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-[14px] font-medium"
              style={{ 
                background: 'transparent',
                border: '1px solid var(--eaf-border)',
                color: 'var(--eaf-text-secondary)'
              }}
            >
              Ouvrir le guidage
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
