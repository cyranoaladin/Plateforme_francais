'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Mic,
  PenTool,
  BookOpen,
  Library,
  LogOut,
  Map,
  HelpCircle,
  MessagesSquare,
  UserCircle2,
  Sun,
  Moon,
  Flame,
  Award,
  Sparkles,
  Settings,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { getCsrfTokenFromDocument } from '@/lib/security/csrf-client';
import { useTheme } from '@/components/theme/theme-provider';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Tuteur IA', href: '/tuteur', icon: MessagesSquare },
  { name: 'Atelier Écrit', href: '/atelier-ecrit', icon: PenTool },
  { name: 'Atelier Oral', href: '/atelier-oral', icon: Mic },
  { name: 'Atelier Langue', href: '/atelier-langue', icon: BookOpen },
  { name: 'Mon Parcours', href: '/mon-parcours', icon: Map },
  { name: 'Quiz', href: '/quiz', icon: HelpCircle },
  { name: 'Bibliothèque', href: '/bibliotheque', icon: Library },
  { name: 'Profil', href: '/profil', icon: UserCircle2 },
];

const mobileNavItems = [
  { name: 'Accueil', href: '/', icon: LayoutDashboard },
  { name: 'Tuteur', href: '/tuteur', icon: MessagesSquare },
  { name: 'Écrit', href: '/atelier-ecrit', icon: PenTool },
  { name: 'Oral', href: '/atelier-oral', icon: Mic },
  { name: 'Langue', href: '/atelier-langue', icon: BookOpen },
  { name: 'Plus', href: '/bibliotheque', icon: Library },
];

type AuthMe = {
  email: string;
  role: 'eleve' | 'enseignant' | 'parent';
  profile: {
    displayName: string;
    targetScore: string;
    eafDate?: string;
    badges?: string[];
  };
};

type TimelinePayload = {
  timeline: Array<{ createdAt: string; type: string; payload?: Record<string, number | string | boolean | string[]> }>;
};

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

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const [me, setMe] = useState<AuthMe | null>(null);
  const [globalScore, setGlobalScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);
  const [nowTs] = useState(() => Date.now());

  useEffect(() => {
    const load = async () => {
      try {
        const [meResponse, timelineResponse] = await Promise.all([
          fetch('/api/v1/auth/me'),
          fetch('/api/v1/memory/timeline?limit=200'),
        ]);

        if (meResponse.ok) {
          const meData = (await meResponse.json()) as AuthMe;
          setMe(meData);
          setBadgeCount(meData.profile.badges?.length ?? 0);
        }

        if (timelineResponse.ok) {
          const payload = (await timelineResponse.json()) as TimelinePayload;
          const evalScores = payload.timeline
            .filter((item) => item.type === 'evaluation' && typeof item.payload?.score === 'number')
            .map((item) => Number(item.payload?.score ?? 0));

          const avg = evalScores.length > 0 ? evalScores.reduce((a, b) => a + b, 0) / evalScores.length : 10;
          const normalized = Math.max(0, Math.min(20, avg <= 2 ? avg * 10 : avg));
          setGlobalScore(Number(normalized.toFixed(1)));
          setStreak(computeStreak(payload.timeline.map((item) => item.createdAt)));
        }
      } catch {
        // ignore
      }
    };

    void load();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/v1/auth/logout', {
      method: 'POST',
      headers: {
        'X-CSRF-Token': getCsrfTokenFromDocument(),
      },
    });
    router.push('/login');
    router.refresh();
  };

  const initials = me?.profile.displayName
    ?.split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? 'EL';

  const countdown = me?.profile.eafDate
    ? Math.max(0, Math.ceil((new Date(me.profile.eafDate).getTime() - nowTs) / (1000 * 60 * 60 * 24)))
    : null;

  const items = me?.role === 'enseignant'
    ? [{ name: 'Enseignant', href: '/enseignant', icon: LayoutDashboard }]
    : me?.role === 'parent'
      ? [{ name: 'Parent', href: '/parent', icon: LayoutDashboard }]
      : navItems;

  return (
    <>
      {/* ─── Desktop Sidebar ─── */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-72 bg-card border-r border-border flex-col shadow-sm z-10">
        {/* Logo */}
        <div className="p-6">
          <Link href="/" className="flex items-center gap-2.5 text-primary group">
            <Sparkles className="w-7 h-7 fill-primary/20 group-hover:scale-110 transition-transform" />
            <span className="text-xl font-bold tracking-tight">Nexus EAF</span>
          </Link>
        </div>

        {/* Stats compactes */}
        <div className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl border border-border p-2.5 text-center bg-muted/30 hover:bg-muted/50 transition-colors">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">J-EAF</p>
              <p className="text-base font-bold text-primary mt-0.5">{countdown !== null ? countdown : '--'}</p>
            </div>
            <div className="rounded-xl border border-border p-2.5 text-center bg-muted/30 hover:bg-muted/50 transition-colors">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Streak</p>
              <p className="text-base font-bold mt-0.5 flex items-center justify-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-500" /> {streak}
              </p>
            </div>
            <div className="rounded-xl border border-border p-2.5 text-center bg-muted/30 hover:bg-muted/50 transition-colors">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Badges</p>
              <p className="text-base font-bold mt-0.5 flex items-center justify-center gap-1">
                <Award className="w-3.5 h-3.5 text-yellow-500" /> {badgeCount}
              </p>
            </div>
          </div>

          {/* Score global compact */}
          <div className="rounded-xl border border-border p-3 bg-muted/30 flex items-center gap-4">
            <div className="relative w-12 h-12 shrink-0">
              <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" className="text-primary" strokeWidth="3"
                  strokeDasharray={`${Math.round((globalScore / 20) * 97.4)} 97.4`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">{globalScore}</div>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Score global</p>
              <p className="text-xs text-muted-foreground">Objectif : {me?.profile.targetScore ?? '14/20'}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {items.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
                  isActive
                    ? 'bg-primary/10 text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <item.icon className={`w-[18px] h-[18px] ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer user card */}
        <div className="p-4 border-t border-border space-y-3">
          <div className="flex items-center gap-3">
            <button
              aria-label="Basculer le thème"
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              aria-label="Paramètres"
              onClick={() => router.push('/profil')}
              className="p-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              aria-label="Se déconnecter"
              onClick={handleLogout}
              className="p-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors ml-auto"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group"
            onClick={() => router.push('/profil')}
          >
            <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-sm shrink-0 group-hover:ring-2 ring-primary/30 transition-all">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{me?.profile.displayName ?? 'Élève'}</p>
              <p className="text-xs text-muted-foreground">Premium EAF</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── Mobile Bottom Navigation ─── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur-md px-1 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="grid grid-cols-6 gap-0.5">
          {mobileNavItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                aria-label={item.name}
                className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-all ${
                  active ? 'text-primary bg-primary/10 scale-105' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[9px] mt-0.5 font-bold">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
