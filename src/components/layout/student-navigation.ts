import {
  Brain,
  BookOpen,
  HelpCircle,
  LayoutDashboard,
  Library,
  Map,
  MessagesSquare,
  Mic,
  PenTool,
  Quote,
  Type,
  UserCircle2,
} from 'lucide-react';

type TimelineEntry = {
  createdAt: string;
  type: string;
  payload?: Record<string, number | string | boolean | string[]>;
};

export type StudentNavItem = {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  section: 'Pilotage' | 'Ateliers' | 'Ressources';
  hint: string;
};

export const studentNavItems: StudentNavItem[] = [
  { name: 'Tableau de bord', href: '/dashboard', icon: LayoutDashboard, section: 'Pilotage', hint: 'Vue d’ensemble' },
  { name: 'Mon Parcours', href: '/mon-parcours', icon: Map, section: 'Pilotage', hint: 'Plan de progression' },
  { name: 'Mon descriptif', href: '/descriptif-lecture', icon: BookOpen, section: 'Pilotage', hint: 'Textes réellement étudiés pour l\'oral' },
  { name: 'Profil', href: '/profil', icon: UserCircle2, section: 'Pilotage', hint: 'Cap et repères' },
  { name: 'Tuteur de parcours', href: '/tuteur', icon: MessagesSquare, section: 'Ateliers', hint: 'Question guidée' },
  { name: 'Atelier Écrit', href: '/atelier-ecrit', icon: PenTool, section: 'Ateliers', hint: 'Sujet, copie, rapport' },
  { name: 'Atelier Oral', href: '/atelier-oral', icon: Mic, section: 'Ateliers', hint: 'Simulation officielle' },
  { name: 'Atelier Langue', href: '/atelier-langue', icon: Type, section: 'Ateliers', hint: 'Grammaire ciblée' },
  { name: 'Quiz', href: '/quiz', icon: Brain, section: 'Ateliers', hint: 'Ancrage rapide' },
  { name: 'Carnet', href: '/carnet', icon: Quote, section: 'Ressources', hint: 'Notes personnelles' },
  { name: 'Bibliothèque', href: '/bibliotheque', icon: Library, section: 'Ressources', hint: 'Corpus et médias' },
];

export const studentNavSections = [
  {
    label: 'Pilotage',
    description: 'Voir où tu en es et quoi lancer ensuite.',
    items: studentNavItems.filter((item) => item.section === 'Pilotage'),
  },
  {
    label: 'Ateliers',
    description: 'Pratique guidée, évaluée et relancée selon le parcours.',
    items: studentNavItems.filter((item) => item.section === 'Ateliers'),
  },
  {
    label: 'Ressources',
    description: 'Matière personnelle et supports à exploiter.',
    items: studentNavItems.filter((item) => item.section === 'Ressources'),
  },
] as const;

export const studentMobilePrimaryNavItems = [
  { name: 'Accueil', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Tuteur', href: '/tuteur', icon: MessagesSquare },
  { name: 'Oral', href: '/atelier-oral', icon: Mic },
  { name: 'Écrit', href: '/atelier-ecrit', icon: PenTool },
  { name: 'Quiz', href: '/quiz', icon: HelpCircle },
] as const;

export const studentMobileOverflowItems = [
  { name: 'Parcours', href: '/mon-parcours', icon: Map },
  { name: 'Langue', href: '/atelier-langue', icon: Type },
  { name: 'Descriptif', href: '/descriptif-lecture', icon: BookOpen },
  { name: 'Carnet', href: '/carnet', icon: Quote },
  { name: 'Bibliothèque', href: '/bibliotheque', icon: Library },
  { name: 'Profil', href: '/profil', icon: UserCircle2 },
] as const;

function computeStreak(dates: string[]): number {
  const daySet = new Set(
    dates.map((value) => {
      const d = new Date(value);
      return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
    }),
  );
  let streak = 0;
  const cursor = new Date();

  while (true) {
    const key = `${cursor.getUTCFullYear()}-${cursor.getUTCMonth()}-${cursor.getUTCDate()}`;
    if (!daySet.has(key)) {
      if (streak === 0) {
        cursor.setUTCDate(cursor.getUTCDate() - 1);
        const prev = `${cursor.getUTCFullYear()}-${cursor.getUTCMonth()}-${cursor.getUTCDate()}`;
        if (!daySet.has(prev)) return 0;
      } else break;
    }

    if (daySet.has(key)) {
      streak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
      continue;
    }

    break;
  }

  return streak;
}

export function computeSidebarLearningSignals(timeline: TimelineEntry[]): {
  globalScore: number | null;
  streak: number;
} {
  const evalScores = timeline
    .filter((item) => item.type === 'evaluation' && typeof item.payload?.score === 'number')
    .map((item) => Number(item.payload?.score ?? 0));

  const averageScore = evalScores.length > 0
    ? evalScores.reduce((sum, value) => sum + value, 0) / evalScores.length
    : null;

  const normalizedScore = averageScore === null
    ? null
    : Number(Math.max(0, Math.min(20, averageScore <= 2 ? averageScore * 10 : averageScore)).toFixed(1));

  return {
    globalScore: normalizedScore,
    streak: computeStreak(timeline.map((item) => item.createdAt)),
  };
}
