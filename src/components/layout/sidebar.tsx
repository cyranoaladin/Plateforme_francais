'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { DyslexiaToggle } from '@/components/accessibility/dyslexia-toggle';
import {
  Brain,
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
  Monitor,
  Flame,
  Award,
  Settings,
  Quote,
  Type,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { getCsrfTokenFromDocument } from '@/lib/security/csrf-client';
import { useTheme } from '@/components/theme/theme-provider';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, section: 'Pilotage', hint: 'Vue d’ensemble' },
  { name: 'Mon Parcours', href: '/mon-parcours', icon: Map, section: 'Pilotage', hint: 'Plan de progression' },
  { name: 'Profil', href: '/profil', icon: UserCircle2, section: 'Pilotage', hint: 'Cap et repères' },
  { name: 'Tuteur de parcours', href: '/tuteur', icon: MessagesSquare, section: 'Ateliers', hint: 'Question guidée' },
  { name: 'Atelier Écrit', href: '/atelier-ecrit', icon: PenTool, section: 'Ateliers', hint: 'Sujet, copie, rapport' },
  { name: 'Atelier Oral', href: '/atelier-oral', icon: Mic, section: 'Ateliers', hint: 'Simulation officielle' },
  { name: 'Atelier Langue', href: '/atelier-langue', icon: Type, section: 'Ateliers', hint: 'Grammaire ciblée' },
  { name: 'Quiz', href: '/quiz', icon: Brain, section: 'Ateliers', hint: 'Ancrage rapide' },
  { name: 'Carnet', href: '/carnet', icon: Quote, section: 'Ressources', hint: 'Notes personnelles' },
  { name: 'Bibliothèque', href: '/bibliotheque', icon: Library, section: 'Ressources', hint: 'Corpus et médias' },
];

const mobileNavItems = [
  { name: 'Accueil', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Tuteur', href: '/tuteur', icon: MessagesSquare },
  { name: 'Oral', href: '/atelier-oral', icon: Mic },
  { name: 'Quiz', href: '/quiz', icon: HelpCircle },
  { name: 'Carnet', href: '/carnet', icon: BookOpen },
  { name: 'Parcours', href: '/mon-parcours', icon: Map },
  { name: 'Profil', href: '/profil', icon: UserCircle2 },
];

type AuthMe = {
  email: string;
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
  const { preference, setTheme } = useTheme();

  const [me, setMe] = useState<AuthMe | null>(null);
  const [globalScore, setGlobalScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);
  const [mobileThemeOpen, setMobileThemeOpen] = useState(false);
  const mobileThemeRef = useRef<HTMLDivElement>(null);

  // Close mobile theme popover on outside click
  useEffect(() => {
    if (!mobileThemeOpen) return;
    const handler = (e: MouseEvent) => {
      if (mobileThemeRef.current && !mobileThemeRef.current.contains(e.target as Node)) {
        setMobileThemeOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [mobileThemeOpen]);

  const joursAvantEAF = useMemo(() => {
    const EAF_DATE = new Date('2026-06-11T08:00:00');
    const now = new Date();
    return Math.max(0, Math.ceil((EAF_DATE.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }, []);

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

  const navSections = [
    {
      label: 'Pilotage',
      description: 'Voir où tu en es et quoi lancer ensuite.',
      items: navItems.filter((item) => item.section === 'Pilotage'),
    },
    {
      label: 'Ateliers',
      description: 'Pratique guidée, évaluée et relancée selon le parcours.',
      items: navItems.filter((item) => item.section === 'Ateliers'),
    },
    {
      label: 'Ressources',
      description: 'Matière personnelle et supports à exploiter.',
      items: navItems.filter((item) => item.section === 'Ressources'),
    },
  ];

  return (
    <>
      {/* ─── Desktop Sidebar ─── */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-72 flex-col border-r border-[var(--border-light)] bg-[linear-gradient(180deg,var(--surface-warm)_0%,var(--surface-sand)_100%)] shadow-[var(--shadow-md)] z-10">
        <div className="border-b border-[var(--border-light)] px-5 py-5">
          <div className="rounded-[var(--radius-xl)] border border-[var(--border-light)] bg-[linear-gradient(180deg,var(--surface-ivory)_0%,var(--surface-parchment)_100%)] p-4 shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-3">
              <img
                src="/images/logo_nexus_reussite.png"
                alt="Nexus Réussite"
                className="h-14 w-14 object-contain rounded-full border border-[var(--border-light)] bg-[var(--card)] p-1.5"
              />
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--accent-bronze)]">Nexus Réussite</p>
                <p className="mt-1 text-sm font-semibold text-[var(--navy)]">Tableau de bord EAF</p>
                <p className="text-xs text-[var(--navy-muted)]">Travail guidé, progression lisible, matière exploitable.</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-[var(--radius-lg)] border border-[var(--border-light)] bg-[var(--card)]/85 p-2.5 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-warm)]">J-EAF</p>
                <p className="mt-1 text-base font-bold text-[var(--navy)]">{joursAvantEAF !== null ? joursAvantEAF : '--'}</p>
              </div>
              <div className="rounded-[var(--radius-lg)] border border-[var(--border-light)] bg-[var(--card)]/85 p-2.5 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-warm)]">Streak</p>
                <p className="mt-1 flex items-center justify-center gap-1 text-base font-bold text-[var(--navy)]">
                  <Flame className="h-3.5 w-3.5 text-[var(--accent)]" /> {streak}
                </p>
              </div>
              <div className="rounded-[var(--radius-lg)] border border-[var(--border-light)] bg-[var(--card)]/85 p-2.5 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-warm)]">Badges</p>
                <p className="mt-1 flex items-center justify-center gap-1 text-base font-bold text-[var(--navy)]">
                  <Award className="h-3.5 w-3.5 text-[var(--badge-gold)]" /> {badgeCount}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-[var(--radius-xl)] border border-[var(--border-success)] bg-[var(--success-bg)] p-3.5">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 shrink-0">
                  <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="3" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.5"
                      fill="none"
                      stroke="currentColor"
                      className="text-primary"
                      strokeWidth="3"
                      strokeDasharray={`${Math.round((globalScore / 20) * 97.4)} 97.4`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[var(--navy)]">{globalScore}</div>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--navy)]">Trajectoire actuelle</p>
                  <p className="text-xs leading-5 text-[var(--navy-muted)]">Objectif visé : {me?.profile.targetScore ?? '14/20'}.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
          {navSections.map((section) => (
            <section key={section.label}>
              <div className="mb-3 px-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--accent-bronze)]">{section.label}</p>
                <p className="mt-1 text-xs leading-5 text-[var(--navy-muted)]">{section.description}</p>
              </div>
              <div className="space-y-1.5">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center gap-3 rounded-[20px] border px-4 py-3 text-sm transition-all ${
                        isActive
                          ? 'border-[var(--navy)]/10 bg-[var(--navy)] text-white shadow-[var(--shadow-md)]'
                          : 'border-transparent bg-[var(--card)]/55 text-[var(--navy-muted)] hover:border-[var(--border-default)] hover:bg-[var(--card)] hover:text-[var(--navy)]'
                      }`}
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-lg)] ${
                        isActive ? 'bg-white/12 text-white' : 'bg-[var(--navy)]/8 text-[var(--navy)]'
                      }`}>
                        <item.icon className="h-[18px] w-[18px]" />
                      </div>
                      <div className="min-w-0">
                        <p className={`font-semibold ${isActive ? 'text-white' : 'text-[var(--navy)]'}`}>{item.name}</p>
                        <p className={`text-xs ${isActive ? 'text-white/70' : 'text-[var(--navy-muted)]'}`}>{item.hint}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>

        <div className="border-t border-[var(--border-light)] p-4 space-y-3">
          {/* ─── Theme Selector (3-state pill) ─── */}
          <div className="flex items-center justify-center rounded-full border border-[var(--border-light)] bg-[var(--surface-cream)] p-1 shadow-[var(--shadow-xs)]">
            {([
              { pref: 'system' as const, icon: Monitor, label: 'Système' },
              { pref: 'light' as const, icon: Sun, label: 'Clair' },
              { pref: 'dark' as const, icon: Moon, label: 'Sombre' },
            ]).map(({ pref, icon: Icon, label }) => (
              <button
                key={pref}
                onClick={() => setTheme(pref)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium transition-all duration-[var(--transition-base)] ${
                  preference === pref
                    ? 'bg-[var(--card)] text-[var(--text-heading)] shadow-[var(--shadow-sm)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-body)]'
                }`}
                title={label}
                aria-label={`Thème : ${label}`}
                aria-pressed={preference === pref}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              aria-label="Paramètres"
              onClick={() => router.push('/profil')}
              className="min-h-[44px] min-w-[44px] rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--card)]/80 p-2.5 text-[var(--navy)] transition-colors hover:bg-[var(--card)]"
            >
              <Settings className="w-4 h-4" />
            </button>
            <DyslexiaToggle />
            <button
              aria-label="Se déconnecter"
              onClick={handleLogout}
              className="ml-auto min-h-[44px] min-w-[44px] rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--card)]/80 p-2.5 text-[var(--navy)] transition-colors hover:bg-[var(--card)]"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 p-2 rounded-[var(--radius-md)] hover:bg-muted/50 transition-colors cursor-pointer group"
            onClick={() => router.push('/profil')}
          >
            <div className="w-10 h-10 rounded-full bg-[var(--navy)]/12 flex items-center justify-center text-[var(--navy)] font-bold text-sm shrink-0 group-hover:ring-2 ring-[var(--navy)]/20 transition-all">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--navy)] truncate">{me?.profile.displayName ?? 'Élève'}</p>
              <p className="text-xs text-[var(--navy-muted)]">Espace connecté EAF</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── Mobile Bottom Navigation ─── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[var(--border-default)] bg-[var(--surface-ivory)]/96 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md shadow-[var(--shadow-md)]">
        <div className="flex gap-1.5 overflow-x-auto">
          {mobileNavItems.map((item) => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                aria-label={item.name}
                className={`flex min-h-[48px] min-w-[48px] flex-1 flex-col items-center justify-center rounded-[var(--radius-lg)] py-2 transition-all ${
                  active
                    ? 'bg-[var(--navy)] text-white shadow-[var(--shadow-md)]'
                    : 'text-[var(--navy-muted)] active:bg-[var(--card)] active:text-[var(--navy)]'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="mt-0.5 text-[10px] font-bold leading-tight">{item.name}</span>
              </Link>
            );
          })}
          {/* ─── Mobile Theme Toggle ─── */}
          <div ref={mobileThemeRef} className="relative flex-1">
            <button
              aria-label="Changer le thème"
              onClick={() => setMobileThemeOpen((prev) => !prev)}
              className={`flex min-h-[48px] min-w-[48px] w-full flex-col items-center justify-center rounded-[var(--radius-lg)] py-2 transition-all ${
                mobileThemeOpen
                  ? 'bg-[var(--navy)] text-white shadow-[var(--shadow-md)]'
                  : 'text-[var(--navy-muted)] active:bg-[var(--card)] active:text-[var(--navy)]'
              }`}
            >
              {preference === 'dark' ? <Moon className="h-5 w-5" /> : preference === 'light' ? <Sun className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
              <span className="mt-0.5 text-[10px] font-bold leading-tight">Thème</span>
            </button>
            {mobileThemeOpen && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 rounded-[var(--radius-lg)] border border-[var(--border-light)] bg-[var(--card)] p-1.5 shadow-[var(--shadow-lg)] min-w-[180px]">
                {([
                  { pref: 'system' as const, icon: Monitor, label: 'Système' },
                  { pref: 'light' as const, icon: Sun, label: 'Clair' },
                  { pref: 'dark' as const, icon: Moon, label: 'Sombre' },
                ]).map(({ pref, icon: Icon, label }) => (
                  <button
                    key={pref}
                    onClick={() => { setTheme(pref); setMobileThemeOpen(false); }}
                    className={`flex w-full items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-all duration-[var(--transition-base)] ${
                      preference === pref
                        ? 'bg-[var(--surface-cream)] text-[var(--text-heading)]'
                        : 'text-[var(--text-muted)] hover:bg-[var(--surface-warm)] hover:text-[var(--text-body)]'
                    }`}
                    aria-pressed={preference === pref}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                    {preference === pref && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
