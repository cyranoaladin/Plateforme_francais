'use client';

import Link from 'next/link';
import { useMemo, useSyncExternalStore, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flame,
  GraduationCap,
  Map as MapIcon,
  MessageSquare,
  Mic,
  PenTool,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui';
import { ParcoursRecommandation } from '@/components/dashboard/parcours-recommandation';
import { ProgressionChart } from '@/components/dashboard/progression-chart';
import { useDashboard } from '@/hooks/useDashboard';
import { getDashboardUpgradeState } from '@/lib/billing/dashboard-upgrade';
import { buildTuteurHref } from '@/lib/navigation/tuteur-link';
import { EmailVerificationBanner } from '@/components/ui/EmailVerificationBanner';

const SKILL_META = [
  {
    key: 'ecrit' as const,
    label: 'Écrit',
    accent: 'bg-[var(--bg-primary)]',
    textColor: 'text-[var(--text-primary-on-subtle)]',
    barColor: 'var(--c-primary)',
    copy: 'Structurer vite, sans perdre la tension de l’argumentation.',
  },
  {
    key: 'oral' as const,
    label: 'Oral',
    accent: 'bg-[var(--bg-success)]',
    textColor: 'text-[var(--text-success-on-subtle)]',
    barColor: 'var(--c-success)',
    copy: 'Garder une parole nette, mobile et assez solide pour tenir la relance.',
  },
  {
    key: 'grammaire' as const,
    label: 'Grammaire',
    accent: 'bg-[var(--c-accent-subtle)]',
    textColor: 'text-[var(--c-accent-text)]',
    barColor: 'var(--c-accent)',
    copy: 'Verrouiller les notions qui coûtent des points trop rapidement.',
  },
  {
    key: 'lectureCursive' as const,
    label: 'Lecture cursive',
    accent: 'bg-[var(--bg-reward)]',
    textColor: 'text-[var(--text-reward-on-subtle)]',
    barColor: 'var(--c-reward)',
    copy: 'Réactiver les œuvres pour qu’elles restent disponibles à l’oral.',
  },
];

const ACTIONS = {
  oral: [
    {
      title: 'Simulation orale guidée',
      detail: 'Remettre en route lecture, explication et relance sans te disperser.',
      duration: '15 min',
      href: '/atelier-oral',
      icon: Mic,
    },
    {
      title: 'Question de grammaire courte',
      detail: 'Réactiver une notion précise avant qu’elle ne sorte du radar.',
      duration: '5 min',
      href: '/atelier-langue',
      icon: BrainCircuit,
    },
    {
      title: 'Débrief avec Nexus',
      detail: 'Faire verbaliser ce qui a coincé et repartir avec un axe net.',
      duration: '8 min',
      href: '/tuteur',
      icon: MessageSquare,
    },
  ],
  ecrit: [
    {
      title: 'Bloc commentaire ou dissertation',
      detail: 'Passer d’une intention vague à une structure exploitable.',
      duration: '20 min',
      href: '/atelier-ecrit',
      icon: PenTool,
    },
    {
      title: 'Revoir la méthode utile',
      detail: 'Reprendre une ressource courte qui élimine les erreurs de charpente.',
      duration: '6 min',
      href: '/bibliotheque',
      icon: BookOpen,
    },
    {
      title: 'Questionner le tuteur',
      detail: 'Lever un blocage ciblé avant de relancer la production.',
      duration: '8 min',
      href: '/tuteur',
      icon: MessageSquare,
    },
  ],
  grammaire: [
    {
      title: 'Exercice de langue ciblé',
      detail: 'Travailler le point faible sans re-rentrer dans un tunnel théorique.',
      duration: '7 min',
      href: '/atelier-langue',
      icon: BrainCircuit,
    },
    {
      title: 'Retour au texte support',
      detail: 'Remettre la notion en contexte pour l’ancrer plus durablement.',
      duration: '8 min',
      href: '/bibliotheque',
      icon: BookOpen,
    },
    {
      title: 'Clarifier avec Nexus',
      detail: 'Formuler la règle, puis la réutiliser dans un cas proche.',
      duration: '8 min',
      href: '/tuteur',
      icon: MessageSquare,
    },
  ],
  lectureCursive: [
    {
      title: 'Réouvrir une œuvre',
      detail: 'Réactiver les repères, citations et enjeux qui servent vraiment.',
      duration: '12 min',
      href: '/bibliotheque',
      icon: BookOpen,
    },
    {
      title: 'Préparer l’oral sur l’œuvre',
      detail: 'Reconnecter la lecture au futur entretien, pas à une fiche morte.',
      duration: '15 min',
      href: '/atelier-oral',
      icon: Mic,
    },
    {
      title: 'Faire émerger les enjeux',
      detail: 'Utiliser Nexus pour transformer une lecture floue en matière exploitable.',
      duration: '8 min',
      href: '/tuteur',
      icon: MessageSquare,
    },
  ],
};

const FOCUS_COPY = {
  oral: {
    eyebrow: 'Axe dominant du moment',
    title: 'Stabiliser ta prise de parole avant d’augmenter le volume de travail.',
    detail: 'L’oral se gagne sur l’enchaînement des gestes justes, pas sur des sessions trop longues.',
  },
  ecrit: {
    eyebrow: 'Axe dominant du moment',
    title: 'Sécuriser la charpente de l’écrit avant de chercher plus d’ampleur.',
    detail: 'Quand la structure tient, les progrès deviennent enfin cumulables.',
  },
  grammaire: {
    eyebrow: 'Axe dominant du moment',
    title: 'Verrouiller le point de langue qui fait perdre des points trop vite.',
    detail: 'La bonne séance de grammaire est courte, contextualisée et immédiatement réutilisable.',
  },
  lectureCursive: {
    eyebrow: 'Axe dominant du moment',
    title: 'Réactiver les œuvres pour retrouver de la matière à l’oral et à l’écrit.',
    detail: 'La lecture utile n’est pas exhaustive: elle remet en circulation les repères décisifs.',
  },
};

const QUICK_ACCESS = [
  {
    title: 'Atelier oral',
    detail: 'Lecture, explication, entretien: repartir sur une séquence complète.',
    href: '/atelier-oral',
    icon: Mic,
    accent: 'bg-[var(--bg-success)] text-[var(--text-success-on-subtle)]',
  },
  {
    title: 'Atelier écrit',
    detail: 'Commentaire, dissertation ou sujet blanc selon le besoin réel.',
    href: '/atelier-ecrit',
    icon: PenTool,
    accent: 'bg-[var(--c-accent-subtle)] text-[var(--c-accent-text)]',
  },
  {
    title: 'Atelier langue',
    detail: 'Exercices courts pour verrouiller les notions qui coûtent le plus de points.',
    href: '/atelier-langue',
    icon: BrainCircuit,
    accent: 'bg-[var(--bg-primary)] text-[var(--text-primary-on-subtle)]',
  },
  {
    title: 'Quiz',
    detail: 'Ancrer les repères sur les œuvres, les méthodes et les attentes du bac.',
    href: '/quiz',
    icon: Target,
    accent: 'bg-[var(--bg-reward)] text-[var(--text-reward-on-subtle)]',
  },
  {
    title: 'Bibliothèque',
    detail: 'Ressources courtes pour relancer méthode, œuvres et repères utiles.',
    href: '/bibliotheque',
    icon: BookOpen,
    accent: 'bg-[var(--bg-primary)] text-[var(--text-primary-on-subtle)]',
  },
  {
    title: 'Tuteur Nexus',
    detail: 'Débloquer une difficulté précise au lieu de tourner en rond.',
    href: '/tuteur',
    icon: MessageSquare,
    accent: 'bg-[var(--bg-reward)] text-[var(--text-reward-on-subtle)]',
  },
];

const EMPTY_FOCUS_COPY = {
  eyebrow: 'Cap à lancer',
  title: 'Aucun signal fiable pour l’instant: il faut une première séance notée.',
  detail: 'Le tableau de bord affichera de vrais axes de force et de tension après un premier atelier évalué.',
};

const EMPTY_FOCUS_ACTIONS = [
  {
    title: 'Démarrer un oral blanc',
    detail: 'Créer un premier repère concret sur la lecture, l’explication et l’entretien.',
    duration: '15 min',
    href: '/atelier-oral',
    icon: Mic,
  },
  {
    title: 'Lancer un premier écrit',
    detail: 'Obtenir un signal utile sur la méthode et la structure dès la première copie.',
    duration: '20 min',
    href: '/atelier-ecrit',
    icon: PenTool,
  },
  {
    title: 'Ouvrir le tuteur',
    detail: 'Débloquer une première difficulté avant d’installer de mauvais réflexes.',
    duration: '8 min',
    href: '/tuteur',
    icon: MessageSquare,
  },
];

const DASHBOARD_COPY = {
  heroBadge: 'Pilotage du jour',
  heroTitleSuffix: ', voilà la priorité qui doit faire bouger ta semaine.',
  priorityPrefix: 'Axe prioritaire:',
  emptyPriority: 'Aucun score fiable pour l’instant. Lance un premier atelier noté pour faire émerger un vrai niveau, un point fort et une priorité utile.',
  seePath: 'Voir le parcours',
  strongPoint: 'Point fort courant:',
  tightenPoint: 'Angle à retendre:',
  averageLevel: 'Niveau moyen:',
  latestSession: 'Dernier passage:',
  profileTitle: 'Le profil n’est pas encore entièrement personnalisé.',
  profileBody: 'Finaliser la configuration permettra d’ancrer ton tableau de bord sur les œuvres, le niveau déclaré et les priorités à travailler.',
  resumeSetup: 'Reprendre la configuration',
  nowTitle: 'Ce que tu dois faire maintenant',
  estimatedTime: 'Temps estimé',
  why: 'Pourquoi',
  deadline: 'Échéance',
  startNow: 'Commencer maintenant',
  quickAlternative: 'Alternative rapide',
  deadlines: 'Échéances',
  dataErrorTitle: 'Un souci temporaire nous empêche d’afficher toutes les données',
  dataErrorBody: 'Rafraîchis la page dans quelques instants ou poursuis ta session normalement.',
  radarEyebrow: 'Boussole',
  radarTitle: 'Une lecture visuelle rapide de tes quatre grands axes.',
  average: 'Moyenne',
  radarLoading: 'Préparation de la boussole...',
  progressionEyebrow: 'Trajectoire',
  progressionTitle: 'La progression doit être lisible, pas seulement ressentie.',
  progressionLoading: 'Préparation de la trajectoire...',
  progressionRefreshing: 'Actualisation des données de progression en cours...',
  mapEyebrow: 'Cartographie fine',
  mapTitle: 'Ce que tu tiens bien, et ce qu’il faut remettre sous tension.',
  vigilanceEyebrow: 'Points de vigilance remontés',
  historyEyebrow: 'Historique utile',
  historyTitle: 'Ce qui a vraiment bougé dans tes dernières séances.',
  emptyActivityTitle: 'Ton fil d’activité est encore vierge',
  emptyActivityBody: 'Dès que tu lanceras un premier atelier ou un quiz, tes sessions apparaîtront ici pour suivre ta progression au fil des jours.',
  quickAccessEyebrow: 'Accès rapide',
  quickAccessTitle: 'Les ateliers utiles doivent rester à un clic, sans bruit visuel.',
  quickAccessBody: 'Choisis un bloc, lance-le, puis reviens vérifier l’effet réel sur tes scores et tes repères de travail.',
} as const;

function extractEventScore(event: {
  feature: string;
  path?: string;
  payload?: Record<string, string | number | boolean | string[]>;
  createdAt: string;
}): number | null {
  const score = event.payload?.score;
  const max = event.payload?.max;

  if (typeof score === 'number' && typeof max === 'number' && max > 0) {
    return Math.max(0, Math.min(20, Number(((score / max) * 20).toFixed(1))));
  }

  if (typeof score === 'number') {
    return Math.max(0, Math.min(20, Number((score <= 2 ? score * 10 : score).toFixed(1))));
  }

  return null;
}

function formatActivity(event: { id: string; type: string; feature: string; createdAt: string; path?: string }) {
  const feature = event.feature.replace(/_/g, ' ');
  const date = new Date(event.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

  const FEATURE_LABELS: Record<string, string> = {
    'page view': 'de page',
    'epreuve generate': 'Génération de sujet',
    'tuteur message': 'Message au tuteur',
    'oral session': 'Session orale',
    'quiz generate': 'Quiz',
    'parcours generate': 'Parcours',
  };
  const displayFeature = FEATURE_LABELS[feature] ?? feature;

  if (event.type === 'evaluation') return { id: event.id, label: `Évaluation ${displayFeature}`, date };
  if (event.type === 'navigation') return { id: event.id, label: displayFeature.startsWith('de ') ? `Consultation ${displayFeature}` : displayFeature, date };
  if (event.type === 'interaction') return { id: event.id, label: displayFeature, date };
  if (event.type === 'discussion') return { id: event.id, label: `Échange ${displayFeature}`, date };
  return { id: event.id, label: displayFeature, date };
}

function formatCountdown(value: number | null, label: string) {
  if (value === null) {
    return `${label}: date non renseignée`;
  }
  if (value < 0) {
    return `${label}: épreuve passée`;
  }
  return `${label}: J-${value}`;
}

function describeMomentum(current: number | null, previous: number | null) {
  if (current === null || previous === null) {
    return {
      label: 'Tendance en construction',
      detail: 'Quelques sessions supplémentaires permettront de dégager une trajectoire claire et fiable.',
    };
  }

  const delta = Number((current - previous).toFixed(1));
  if (delta >= 0.8) {
    return {
      label: 'Trajectoire en hausse',
      detail: `Tu gagnes ${delta.toFixed(1)} point sur la dernière fenêtre utile. Continue sans changer de méthode trop tôt.`,
    };
  }
  if (delta <= -0.8) {
    return {
      label: 'Trajectoire à resserrer',
      detail: `Tu perds ${Math.abs(delta).toFixed(1)} point. Mieux vaut réduire la dispersion et revenir à un bloc plus simple.`,
    };
  }
  return {
    label: 'Rythme stable',
    detail: 'La progression existe, mais elle demande encore quelques sessions pour devenir franchement lisible.',
  };
}

function averageScoreValue(scores: {
  oral: number | null;
  ecrit: number | null;
  grammaire: number | null;
  lectureCursive: number | null;
}) {
  const values = Object.values(scores).filter((value): value is number => typeof value === 'number');

  if (values.length === 0) {
    return null;
  }

  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1));
}

function formatScoreLabel(value: number | null) {
  if (value === null) {
    return 'Diagnostic à lancer';
  }

  return `${value.toFixed(1)} / 20`;
}

function buildSeries(feature: string, path?: string): 'commentaire' | 'dissertation' | 'oral' {
  const text = `${feature} ${path ?? ''}`.toLowerCase();

  if (text.includes('oral')) return 'oral';
  if (text.includes('dissert') || text.includes('essai')) return 'dissertation';
  return 'commentaire';
}

function pickPayloadString(
  payload: Record<string, string | number | boolean | string[]> | undefined,
  keys: string[],
): string | null {
  for (const key of keys) {
    const value = payload?.[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

export default function Dashboard() {
  const data = useDashboard();
  const chartsReady = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const [planId, setPlanId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/billing/status')
      .then(r => r.ok ? r.json() : null)
      .then((d: { subscription?: { planId?: string } } | null) => {
        if (d?.subscription?.planId) setPlanId(d.subscription.planId);
      })
      .catch(() => null);
  }, []);

  const weakestSkill = SKILL_META.reduce(
    (prev, curr) => ((data.scores[curr.key] ?? 0) < (data.scores[prev.key] ?? 0) ? curr : prev),
    SKILL_META[0],
  );
  const strongestSkill = SKILL_META.reduce(
    (prev, curr) => ((data.scores[curr.key] ?? 0) > (data.scores[prev.key] ?? 0) ? curr : prev),
    SKILL_META[0],
  );

  const radarData = SKILL_META.map((skill) => ({
    skill: skill.label,
    score: data.scores[skill.key] ?? 0,
    rawScore: data.scores[skill.key],
  }));
  const focusCopy = data.hasEvaluationData ? (FOCUS_COPY[weakestSkill.key] ?? FOCUS_COPY.ecrit) : EMPTY_FOCUS_COPY;
  const weakSignals = data.hasEvaluationData ? Object.entries(data.weakSignals).sort((a, b) => b[1] - a[1]).slice(0, 5) : [];
  const recentActivity = data.timeline.slice(0, 5).map(formatActivity);
  const averageScore = averageScoreValue(data.scores);

  const progressionData = useMemo(() => {
    const buckets = new Map<
      string,
      {
        label: string;
        commentaire: number[];
        dissertation: number[];
        oral: number[];
      }
    >();

    for (const event of data.timeline) {
      if (event.type !== 'evaluation') continue;
      const score = extractEventScore(event);
      if (score === null) continue;

      const date = new Date(event.createdAt);
      const key = date.toISOString().slice(0, 10);
      const label = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
      const bucket = buckets.get(key) ?? { label, commentaire: [], dissertation: [], oral: [] };
      bucket[buildSeries(event.feature, event.path)].push(score);
      buckets.set(key, bucket);
    }

    if (buckets.size === 0) {
      return data.weeklyProgression.map((item) => ({
        date: item.week,
        commentaire: item.score,
        dissertation: null,
        oral: null,
      }));
    }

    return Array.from(buckets.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .slice(-8)
      .map(([, values]) => ({
        date: values.label,
        commentaire: values.commentaire.length
          ? Number((values.commentaire.reduce((sum, value) => sum + value, 0) / values.commentaire.length).toFixed(1))
          : null,
        dissertation: values.dissertation.length
          ? Number((values.dissertation.reduce((sum, value) => sum + value, 0) / values.dissertation.length).toFixed(1))
          : null,
        oral: values.oral.length
          ? Number((values.oral.reduce((sum, value) => sum + value, 0) / values.oral.length).toFixed(1))
          : null,
      }));
  }, [data.timeline, data.weeklyProgression]);

  const tutorHref = useMemo(() => {
    let workId: string | null = data.oeuvreChoisieEntretien ?? data.selectedOeuvres[0] ?? null;
    let parcours: string | null = null;
    let sessionId: string | null = null;

    for (const event of data.timeline) {
      if (!workId) {
        workId = pickPayloadString(event.payload, ['workId', 'oeuvreChoisie', 'oeuvre']);
      }
      if (!parcours) {
        parcours = pickPayloadString(event.payload, ['parcours']);
      }
      if (!sessionId) {
        sessionId = pickPayloadString(event.payload, ['sessionId']);
      }

      if (workId && parcours && sessionId) {
        break;
      }
    }

    return buildTuteurHref({ workId, parcours, sessionId });
  }, [data.oeuvreChoisieEntretien, data.selectedOeuvres, data.timeline]);

  const focusActions = useMemo(
    () =>
      (data.hasEvaluationData ? (ACTIONS[weakestSkill.key] ?? ACTIONS.ecrit) : EMPTY_FOCUS_ACTIONS).map((action) => ({
        ...action,
        href: action.href === '/tuteur' ? tutorHref : action.href,
      })),
    [data.hasEvaluationData, tutorHref, weakestSkill.key],
  );

  const latestProgressScore = data.weeklyProgression.at(-1)?.score ?? null;
  const previousProgressScore = data.weeklyProgression.at(-2)?.score ?? null;
  const momentum = describeMomentum(latestProgressScore, previousProgressScore);
  const ritualLead = focusActions[0];
  const ritualBackup = focusActions[1] ?? null;
  const latestInsight = recentActivity[0] ?? null;
  const upgradeState = getDashboardUpgradeState(planId);
  const examInfo = data.examInfo;
  const BackupIcon = ritualBackup?.icon;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
      <EmailVerificationBanner emailVerified={!!data.emailVerified} />
      {upgradeState && (
        <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[var(--color-indigo-600)] to-[var(--color-indigo-400)] px-6 py-5 shadow-[0_4px_20px_var(--shadow-md)]">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.1)_0%,transparent_60%)]" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-white/80" />
              <div>
                <p className="text-sm font-bold text-white">{upgradeState.title}</p>
                <p className="mt-1 text-sm leading-6 text-white/70">{upgradeState.detail}</p>
              </div>
            </div>
            <Link
              href="/pricing"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--c-accent)] px-6 py-3 text-sm font-bold text-[var(--text-on-accent)] shadow-lg transition hover:bg-[var(--c-accent-hover)] hover:shadow-xl"
            >
              {upgradeState.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      <section className="relative overflow-hidden rounded-[28px] border border-[var(--border-primary)] bg-[linear-gradient(135deg,var(--color-indigo-700)_0%,var(--color-indigo-600)_44%,var(--color-indigo-800)_100%)] p-5 text-[var(--bg-page)] shadow-[var(--shadow-md)] md:p-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/12 blur-2xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-14 left-[14%] h-32 w-32 rounded-full bg-[var(--color-amber-300)]/12 blur-3xl" />

        <div className="relative grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-start">
          <div>
            <div className="hero-kicker">
              <ShieldCheck className="h-4 w-4" />
              {DASHBOARD_COPY.heroBadge}
            </div>

            <div className="hero-body mt-4 flex flex-wrap gap-2 text-xs font-semibold">
              {examInfo ? (
                <>
                  <span className="hero-chip px-3 py-1.5">{examInfo.phaseLabel}</span>
                  <span className="hero-chip px-3 py-1.5">{examInfo.examDayLabel}</span>
                </>
              ) : null}
              <span className="hero-chip px-3 py-1.5">{formatCountdown(data.countdownEcrit, 'Écrit')}</span>
              <span className="hero-chip px-3 py-1.5">{formatCountdown(data.countdownOral, 'Oral')}</span>
            </div>

            <h1 className="editorial-heading mt-6 max-w-4xl text-4xl text-white sm:text-5xl">
              {data.displayName}{DASHBOARD_COPY.heroTitleSuffix}
            </h1>

            <p className="hero-body mt-4 max-w-3xl text-base leading-8 sm:text-lg">
              {data.hasEvaluationData ? (
                <>
                  {DASHBOARD_COPY.priorityPrefix} <strong>{weakestSkill.label.toLowerCase()}</strong>. {focusCopy.detail}
                </>
              ) : (
                <>{DASHBOARD_COPY.emptyPriority}</>
              )}
            </p>

            {examInfo ? (
              <p className="hero-body-muted mt-4 max-w-3xl text-sm leading-6">{examInfo.phaseAction}</p>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={ritualLead.href}
                className="hero-primary-action min-h-[46px] px-5 py-3 text-sm"
              >
                {ritualLead.title}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/mon-parcours"
                className="hero-secondary-action min-h-[46px] px-5 py-3 text-sm"
              >
                {DASHBOARD_COPY.seePath}
                <MapIcon className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 flex flex-wrap gap-2.5 text-sm">
              <span className="hero-chip px-4 py-2 text-[var(--hero-glass-text)]">
                {DASHBOARD_COPY.strongPoint} <strong>{data.hasEvaluationData ? strongestSkill.label : 'En construction'}</strong>
              </span>
              <span className="hero-chip px-4 py-2 text-[var(--hero-glass-text)]">
                {DASHBOARD_COPY.tightenPoint} <strong>{data.hasEvaluationData ? weakestSkill.label : 'À préciser'}</strong>
              </span>
              <span className="hero-chip px-4 py-2 text-[var(--hero-glass-text)]">
                {DASHBOARD_COPY.averageLevel} <strong>{formatScoreLabel(averageScore)}</strong>
              </span>
              <span className="hero-chip px-4 py-2 text-[var(--hero-glass-text)]">
                {DASHBOARD_COPY.latestSession} <strong>{latestInsight?.date ?? 'pas encore de séance'}</strong>
              </span>
            </div>

            {!data.onboardingCompleted ? (
              <div className="hero-glass-card mt-6 rounded-[24px] p-4 text-white shadow-[var(--shadow-md)]">
                <p className="text-sm font-semibold">{DASHBOARD_COPY.profileTitle}</p>
                <p className="hero-body mt-2 text-sm leading-7">{DASHBOARD_COPY.profileBody}</p>
                <Link
                  href="/onboarding"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-white transition-colors hover:text-[var(--color-amber-300)]"
                >
                  {DASHBOARD_COPY.resumeSetup}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : null}

            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Série active', value: `${data.streak} jours`, icon: Flame },
                { label: 'Sessions tracées', value: `${data.totalSessions}`, icon: Target },
                {
                  label: 'Personnalisation',
                  value: data.onboardingCompleted ? 'Activée' : 'À terminer',
                  icon: CheckCircle2,
                },
                { label: 'Repère fort', value: data.hasEvaluationData ? strongestSkill.label : 'À construire', icon: GraduationCap },
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

          <div className="grid gap-4">
            <Card variant="glass" className="rounded-[24px] p-5 text-white">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--color-amber-300)]">
                <Sparkles className="h-4 w-4" />
                {DASHBOARD_COPY.nowTitle}
              </div>
              <h2 className="editorial-heading mt-4 text-3xl text-white">
                {ritualLead.title}
              </h2>
              <p className="hero-body mt-3 text-sm leading-7">{ritualLead.detail}</p>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="hero-glass-card rounded-[18px] px-4 py-3">
                  <p className="ui-stat-label hero-body-muted">{DASHBOARD_COPY.estimatedTime}</p>
                  <p className="mt-1 text-lg font-semibold text-white">{ritualLead.duration}</p>
                </div>
                <div className="hero-glass-card rounded-[18px] px-4 py-3">
                  <p className="ui-stat-label hero-body-muted">{DASHBOARD_COPY.why}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{data.hasEvaluationData ? weakestSkill.label : 'Premier repère noté'}</p>
                </div>
                <div className="hero-glass-card rounded-[18px] px-4 py-3">
                  <p className="ui-stat-label hero-body-muted">{DASHBOARD_COPY.deadline}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{formatCountdown(data.countdownEcrit, 'Écrit')}</p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2.5">
                <Link
                  href={ritualLead.href}
                  className="hero-primary-action min-h-[44px] px-5 py-3 text-sm"
                >
                  {DASHBOARD_COPY.startNow}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {ritualBackup ? (
                  <Link
                    href={ritualBackup.href}
                    className="hero-secondary-action min-h-[44px] px-5 py-3 text-sm"
                  >
                    {DASHBOARD_COPY.quickAlternative}
                    {BackupIcon ? <BackupIcon className="h-4 w-4" /> : null}
                  </Link>
                ) : null}
              </div>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card variant="glass" className="rounded-[24px] p-5 text-white">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--color-amber-300)]">{DASHBOARD_COPY.deadlines}</p>
                <div className="mt-4 space-y-3">
                  {[
                    { label: 'Écrit', value: data.countdownEcrit, icon: CalendarDays },
                    { label: 'Oral', value: data.countdownOral, icon: Clock3 },
                  ].map((item) => (
                    <div key={item.label} className="hero-glass-card rounded-[16px] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-[var(--color-amber-300)]">
                          <item.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                          <p className="mt-1 text-lg font-semibold text-white">
                            {item.value === null ? 'Date à confirmer' : item.value < 0 ? 'Épreuve passée' : `J-${item.value}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {examInfo?.oralDateStatus !== 'planned' && examInfo?.oralDateNote ? (
                  <p className="mt-4 text-xs leading-6 text-slate-300">{examInfo.oralDateNote}</p>
                ) : null}
              </Card>

              <Card variant="glass" className="rounded-[24px] p-5 text-white">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--color-amber-300)]">
                  {latestInsight ? 'Dernière séance utile' : data.onboardingCompleted ? 'Prochain repère' : 'Profil à finaliser'}
                </p>
                <p className="mt-4 text-2xl font-semibold leading-tight text-white">
                  {latestInsight ? latestInsight.label : data.onboardingCompleted ? focusCopy.eyebrow : 'Reprendre la configuration'}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-200">
                  {latestInsight
                    ? `Dernier signal enregistré le ${latestInsight.date}. Reviens ici après la prochaine séance pour vérifier ce qui a réellement bougé.`
                    : data.onboardingCompleted
                      ? 'Une nouvelle séance évaluée permettra d’affiner les recommandations et la cartographie des axes.'
                      : 'Les œuvres, la classe et les objectifs doivent être renseignés pour personnaliser la suite.'}
                </p>
                <Link
                  href={latestInsight ? ritualLead.href : data.onboardingCompleted ? ritualLead.href : '/onboarding'}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-white transition-colors hover:text-[var(--color-amber-300)]"
                >
                  {latestInsight ? 'Relancer sur cette base' : data.onboardingCompleted ? 'Lancer la prochaine séance' : 'Finaliser le profil'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {data.error ? (
        <div className="rounded-[24px] border border-[var(--c-accent-text)]/25 bg-[var(--c-accent-subtle)] p-5 text-sm text-[var(--c-accent-text)] shadow-[var(--shadow-md)]">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--c-accent)]/10 text-[var(--c-accent)]">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <p className="font-semibold text-[var(--c-primary)]">{DASHBOARD_COPY.dataErrorTitle}</p>
              <p className="mt-1 text-sm leading-7">{data.error}</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">{DASHBOARD_COPY.dataErrorBody}</p>
            </div>
          </div>
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[0.94fr_1.06fr]">
        <div className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface)]/90 p-6 shadow-[var(--shadow-md)] md:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--c-success)]">{DASHBOARD_COPY.radarEyebrow}</p>
              <h2 className="font-display mt-3 text-2xl leading-tight tracking-[-0.03em] text-[var(--c-primary)] sm:text-3xl">
                {DASHBOARD_COPY.radarTitle}
              </h2>
            </div>
            <div className="shrink-0 self-start rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-muted)]">
              {DASHBOARD_COPY.average} {formatScoreLabel(averageScore)}
            </div>
          </div>

          <div className="mt-6 min-w-0">
            {chartsReady ? (
              <ResponsiveContainer width="100%" height={320} minWidth={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--border-strong)" />
                  <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: 'var(--text-chart)' }} />
                  <PolarRadiusAxis domain={[0, 20]} tick={{ fontSize: 10, fill: 'var(--text-chart-muted)' }} />
                  <Radar dataKey="score" stroke="var(--c-primary)" fill="var(--c-primary)" fillOpacity={0.22} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 rounded-[24px] bg-[var(--bg-surface-secondary)] text-sm text-[var(--text-muted)]">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--c-primary)]/20 border-t-[var(--c-primary)]" />
                {DASHBOARD_COPY.radarLoading}
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2.5">
            {radarData.map((item) => (
              <span key={item.skill} className="rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text-secondary)]">
                {item.skill}: {formatScoreLabel(item.rawScore)}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface)]/90 p-6 shadow-[var(--shadow-md)] md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--c-success)]">{DASHBOARD_COPY.progressionEyebrow}</p>
              <h2 className="font-display mt-3 text-3xl leading-tight tracking-[-0.03em] text-[var(--c-primary)]">
                {DASHBOARD_COPY.progressionTitle}
              </h2>
            </div>
            <div className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] px-4 py-3 text-sm text-[var(--text-secondary)]">
              <p className="font-semibold text-[var(--c-primary)]">{momentum.label}</p>
              <p className="mt-1 max-w-sm text-xs leading-5 text-[var(--text-muted)]">{momentum.detail}</p>
            </div>
          </div>

          <div className="mt-6">
            {chartsReady ? (
              <ProgressionChart data={progressionData} target={12} />
            ) : (
              <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-[24px] bg-[var(--bg-surface-secondary)] text-sm text-[var(--text-muted)]">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--c-primary)]/20 border-t-[var(--c-primary)]" />
                {DASHBOARD_COPY.progressionLoading}
              </div>
            )}
          </div>

          {data.isLoading ? <p className="mt-3 text-xs text-[var(--text-muted)]">{DASHBOARD_COPY.progressionRefreshing}</p> : null}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.98fr_1.02fr]">
        <div className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface)]/90 p-6 shadow-[var(--shadow-md)] md:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--c-success)]">{DASHBOARD_COPY.mapEyebrow}</p>
              <h2 className="font-display mt-3 text-2xl leading-tight tracking-[-0.03em] text-[var(--c-primary)] sm:text-3xl">
                {DASHBOARD_COPY.mapTitle}
              </h2>
            </div>
            <Link
              href="/mon-parcours"
              className="inline-flex min-h-[44px] shrink-0 items-center gap-2 self-start rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] px-4 py-2 text-sm font-semibold text-[var(--c-primary)] transition-colors hover:border-[var(--c-success)] hover:text-[var(--c-success)]"
            >
              {DASHBOARD_COPY.seePath}
              <MapIcon className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 space-y-5">
            {SKILL_META.map((skill) => {
              const score = data.scores[skill.key];
              return (
                <div key={skill.key} className={`rounded-[var(--radius-lg)] p-4 ${skill.accent}`}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm font-medium">
                    <div>
                      <span className={skill.textColor}>{skill.label}</span>
                      <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{skill.copy}</p>
                    </div>
                    <span className="shrink-0 text-[var(--text-muted)]">{formatScoreLabel(score)}</span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-[var(--border-default)]">
                    <div className="h-2.5 rounded-full" style={{ width: `${((score ?? 0) / 20) * 100}%`, background: skill.barColor }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">{DASHBOARD_COPY.vigilanceEyebrow}</p>
            {weakSignals.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {weakSignals.map(([skill, count]) => (
                  <span key={skill} className="rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] px-3.5 py-1.5 text-xs font-semibold text-[var(--c-primary)]">
                    {skill} ({count})
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
                {data.hasEvaluationData
                  ? 'Aucun point de vigilance particulier sur la période récente. Continue sur ta lancée.'
                  : 'Aucun point de vigilance exploitable pour l’instant. Lance un premier atelier pour faire apparaître les zones à travailler.'}
              </p>
            )}
          </div>

          <ParcoursRecommandation weakSignals={data.weakSignals} />
        </div>

        <div className="space-y-6">
          <div className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface)]/90 p-6 shadow-[var(--shadow-md)] md:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--c-success)]">{DASHBOARD_COPY.historyEyebrow}</p>
                <h2 className="font-display mt-3 text-3xl leading-tight tracking-[-0.03em] text-[var(--c-primary)]">
                  {DASHBOARD_COPY.historyTitle}
                </h2>
              </div>
              <div className="rounded-[18px] border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                <p className="font-semibold text-[var(--c-primary)]">{latestInsight ? latestInsight.date : 'Aucune séance utile'}</p>
                <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">
                  {latestInsight ? 'Repars de ce dernier repère pour garder une progression lisible.' : 'Une première séance évaluée fera apparaître le bon historique.'}
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] p-4">
                    <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--c-primary)] text-[var(--bg-page)]">
                      <Clock3 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--c-primary)]">{item.label}</p>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">{item.date}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center gap-3 rounded-[24px] border border-dashed border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] p-6 text-center">
                  <Clock3 className="h-10 w-10 text-[var(--text-muted)]" />
                  <p className="text-sm font-semibold text-[var(--c-primary)]">{DASHBOARD_COPY.emptyActivityTitle}</p>
                  <p className="max-w-sm text-sm leading-7 text-[var(--text-secondary)]">{DASHBOARD_COPY.emptyActivityBody}</p>
                </div>
              )}
            </div>
          </div>

          <Card padding="md" className="border border-[var(--border-strong)] bg-[var(--bg-surface)]/90 shadow-[var(--shadow-md)] md:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--c-success)]">{DASHBOARD_COPY.quickAccessEyebrow}</p>
            <h2 className="font-display mt-4 text-3xl leading-tight tracking-[-0.03em] text-[var(--c-primary)]">
              {DASHBOARD_COPY.quickAccessTitle}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">{DASHBOARD_COPY.quickAccessBody}</p>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {QUICK_ACCESS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.title}
                    href={item.href === '/tuteur' ? tutorHref : item.href}
                    className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] p-4 text-[var(--c-primary)] shadow-[var(--shadow-sm)] transition-all hover:-translate-y-0.5 hover:border-[var(--border-primary)] hover:shadow-[var(--shadow-md)]"
                  >
                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${item.accent}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="mt-4 text-base font-semibold">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{item.detail}</p>
                  </Link>
                );
              })}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
