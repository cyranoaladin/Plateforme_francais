'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { DyslexiaToggle } from '@/components/accessibility/dyslexia-toggle';
import {
  LogOut,
  Sun,
  Moon,
  Monitor,
  Sparkles,
  MoreHorizontal,
  UserCircle2,
  LayoutDashboard,
  Map,
  BookOpen,
  PenTool,
  Mic,
  Type,
  Brain,
  Library,
  Quote,
  MessagesSquare,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { getCsrfTokenFromDocument } from '@/lib/security/csrf-client';
import { useTheme } from '@/components/theme/theme-provider';
import { toPublicPlanId } from '@/lib/billing/plan-catalog';
import type { ExamInfoPayload } from '@/lib/exam/exam-info';
import { setClientAuthenticated } from '@/lib/auth/client-auth-state';
import type { PublicPlanId } from '@/lib/billing/plan-catalog';

type AuthMe = {
  email: string;
  role?: string;
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

// Navigation items for right sidebar
const PILOTAGE_ITEMS = [
  { name: 'Tableau de bord', href: '/dashboard', hint: 'Vue d\'ensemble', icon: LayoutDashboard },
  { name: 'Mon Parcours', href: '/mon-parcours', hint: 'Plan de progression', icon: Map },
  { name: 'Mon descriptif', href: '/descriptif-lecture', hint: 'Textes étudiés pour l\'oral', icon: BookOpen },
  { name: 'Profil', href: '/profil', hint: 'Cap et repères', icon: UserCircle2 },
];

const ATELIER_ITEMS = [
  { name: 'Tuteur de parcours', href: '/tuteur', hint: 'Question guidée', icon: MessagesSquare },
  { name: 'Atelier Écrit', href: '/atelier-ecrit', hint: 'Sujet, copie, rapport', icon: PenTool },
  { name: 'Atelier Oral', href: '/atelier-oral', hint: 'Simulation officielle', icon: Mic },
  { name: 'Atelier Langue', href: '/atelier-langue', hint: 'Grammaire ciblée', icon: Type },
  { name: 'Quiz', href: '/quiz', hint: 'Ancrage rapide', icon: Brain },
];

const RESSOURCE_ITEMS = [
  { name: 'Carnet', href: '/carnet', hint: 'Notes personnelles', icon: Quote },
  { name: 'Bibliothèque', href: '/bibliotheque', hint: 'Corpus et médias', icon: Library },
];

const MOBILE_PRIMARY_ITEMS = [
  { name: 'Accueil', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Tuteur', href: '/tuteur', icon: MessagesSquare },
  { name: 'Oral', href: '/atelier-oral', icon: Mic },
  { name: 'Écrit', href: '/atelier-ecrit', icon: PenTool },
  { name: 'Plus', href: '#', icon: MoreHorizontal, isMore: true },
];

const MOBILE_OVERFLOW_ITEMS = [
  { name: 'Parcours', href: '/mon-parcours', icon: Map },
  { name: 'Langue', href: '/atelier-langue', icon: Type },
  { name: 'Descriptif', href: '/descriptif-lecture', icon: BookOpen },
  { name: 'Carnet', href: '/carnet', icon: Quote },
  { name: 'Bibliothèque', href: '/bibliotheque', icon: Library },
  { name: 'Profil', href: '/profil', icon: UserCircle2 },
];

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

function computeSidebarLearningSignals(timeline: TimelinePayload['timeline']): {
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

export function shouldShowSidebarUpgrade(role: string | null | undefined, publicPlanId: PublicPlanId) {
  return role === 'eleve' && (publicPlanId === 'FREEMIUM' || publicPlanId === 'PREMIUM');
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { preference, setTheme } = useTheme();

  const [me, setMe] = useState<AuthMe | null>(null);
  const [globalScore, setGlobalScore] = useState<number | null>(null);
  const [streak, setStreak] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);
  const [planId, setPlanId] = useState<string | null>(null);
  const [planLabel, setPlanLabel] = useState<string>('');
  const [planLoaded, setPlanLoaded] = useState(false);
  const [joursAvantEAF, setJoursAvantEAF] = useState<number | null>(null);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const mobileMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mobileMoreOpen) return;
    const handler = (e: MouseEvent) => {
      if (mobileMoreRef.current && !mobileMoreRef.current.contains(e.target as Node)) {
        setMobileMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [mobileMoreOpen]);

  useEffect(() => {
    const load = async () => {
      try {
        const meResponse = await fetch('/api/v1/auth/me');

        if (meResponse.status === 401) {
          setClientAuthenticated(false);
          router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
          return;
        }

        if (meResponse.ok) {
          const meData = (await meResponse.json()) as AuthMe;
          setClientAuthenticated(true);
          setMe(meData);
          setBadgeCount(meData.profile.badges?.length ?? 0);
        }

        const [timelineResponse, billingResponse, examInfoResponse] = await Promise.all([
          fetch('/api/v1/memory/timeline?limit=200'),
          fetch('/api/v1/billing/status'),
          fetch('/api/v1/exam-info'),
        ]);

        if (billingResponse.ok) {
          const billingData = await billingResponse.json() as { subscription?: { planId?: string; plan?: string; label?: string } };
          if (billingData?.subscription?.planId) {
            setPlanId(billingData.subscription.planId);
            setPlanLabel(billingData.subscription.label ?? billingData.subscription.plan ?? billingData.subscription.planId);
          } else {
            setPlanId('FREE');
            setPlanLabel('Freemium');
          }
        } else {
          setPlanId('FREE');
          setPlanLabel('Freemium');
        }
        setPlanLoaded(true);

        if (timelineResponse.ok) {
          const payload = (await timelineResponse.json()) as TimelinePayload;
          const signals = computeSidebarLearningSignals(payload.timeline);
          setGlobalScore(signals.globalScore);
          setStreak(signals.streak);
        }

        if (examInfoResponse.ok) {
          const examInfo = await examInfoResponse.json() as ExamInfoPayload;
          setJoursAvantEAF(examInfo.daysUntilExam);
        }
      } catch {
        setClientAuthenticated(false);
        setPlanId('FREE');
        setPlanLabel('Freemium');
        setPlanLoaded(true);
      }
    };

    void load();
  }, [pathname, router]);

  const handleLogout = async () => {
    await fetch('/api/v1/auth/logout', {
      method: 'POST',
      headers: {
        'X-CSRF-Token': getCsrfTokenFromDocument(),
      },
    });
    setClientAuthenticated(false);
    router.push('/login');
    router.refresh();
  };

  const initials = me?.profile.displayName
    ?.split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? 'EL';

  const publicPlanId = toPublicPlanId(planId ?? 'FREEMIUM');

  // Navigation link component
  const NavLink = ({ item }: { item: typeof PILOTAGE_ITEMS[0] }) => {
    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
    return (
      <Link
        href={item.href}
        className="group flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-all duration-150"
        style={{
          background: isActive ? 'var(--eaf-indigo-dim)' : 'transparent',
          border: isActive ? '1px solid var(--eaf-indigo-border)' : '1px solid transparent',
          color: isActive ? 'var(--eaf-indigo)' : 'var(--eaf-text-secondary)',
        }}
      >
        <item.icon className="h-3.5 w-3.5 shrink-0" />
        <span>{item.name}</span>
      </Link>
    );
  };

  return (
    <>
      {/* ─── LEFT SIDEBAR (160px) ─── */}
      <aside 
        className="hidden md:flex fixed inset-y-0 left-0 flex-col z-20"
        style={{ 
          width: '160px', 
          background: 'var(--eaf-bg1)',
          borderRight: '1px solid var(--eaf-border)'
        }}
      >
        {/* Profile zone */}
        <div className="px-4 py-5" style={{ borderBottom: '1px solid var(--eaf-border)' }}>
          {/* Avatar */}
          <div 
            className="flex h-10 w-10 items-center justify-center rounded-[10px] text-white text-sm font-bold mb-2"
            style={{ background: 'var(--eaf-gradient-indigo-deep)' }}
          >
            {initials}
          </div>
          
          {/* Brand name */}
          <p 
            className="text-[10px] font-bold uppercase tracking-[0.08em] mb-0.5"
            style={{ color: 'var(--eaf-indigo)' }}
          >
            NEXUS RÉUSSITE
          </p>
          <p 
            className="text-[11px] mb-1"
            style={{ color: 'var(--eaf-text-secondary)' }}
          >
            Tableau de bord EAF
          </p>
          <p 
            className="text-[10px] leading-[1.4]"
            style={{ color: 'var(--eaf-text-tertiary)' }}
          >
            Travail guidé, progression lisible, matière exploitable.
          </p>
        </div>

        {/* Quick stats (3 chips) */}
        <div 
          className="px-4 py-4 grid gap-1.5"
          style={{ 
            borderBottom: '1px solid var(--eaf-border)',
            gridTemplateColumns: 'repeat(3, 1fr)'
          }}
        >
          {[
            { label: 'J-EAF', value: joursAvantEAF !== null ? String(joursAvantEAF) : '--' },
            { label: 'SÉRIE', value: String(streak) },
            { label: 'BADGES', value: String(badgeCount) },
          ].map((stat) => (
            <div 
              key={stat.label}
              className="text-center rounded-lg py-2 px-1"
              style={{ 
                background: 'var(--eaf-bg2)', 
                border: '1px solid var(--eaf-border)'
              }}
            >
              <p 
                className="text-[9px] font-semibold uppercase tracking-[0.04em] mb-1"
                style={{ color: 'var(--eaf-text-tertiary)' }}
              >
                {stat.label}
              </p>
              <p 
                className="text-base font-bold"
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

        {/* Trajectory card */}
        <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--eaf-border)' }}>
          <div 
            className="rounded-[10px] p-2.5"
            style={{ 
              background: 'var(--eaf-bg2)', 
              border: '1px solid var(--eaf-border)'
            }}
          >
            <p 
              className="text-[10px] font-semibold uppercase mb-1"
              style={{ color: 'var(--eaf-text-tertiary)' }}
            >
              Trajectoire actuelle
            </p>
            <p 
              className="text-[22px] font-bold"
              style={{ 
                fontFamily: 'var(--eaf-font-display)',
                color: 'var(--eaf-text-primary)'
              }}
            >
              {globalScore === null ? '--' : globalScore}
              <span className="text-sm font-normal" style={{ color: 'var(--eaf-text-tertiary)' }}>/20</span>
            </p>
            <p 
              className="text-[11px]"
              style={{ color: 'var(--eaf-text-tertiary)' }}
            >
              Objectif visé : {me?.profile.targetScore ?? '14/20'}
            </p>
            {/* Progress bar */}
            <div 
              className="h-1 rounded-full mt-2"
              style={{ background: 'var(--eaf-bg3)' }}
            >
              <div 
                className="h-1 rounded-full transition-all duration-500"
                style={{ 
                  width: `${((globalScore ?? 0) / 20) * 100}%`,
                  background: 'var(--eaf-gradient-progress)'
                }}
              />
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Upgrade CTA (FREE & PREMIUM only) */}
        {planLoaded && planId !== null && shouldShowSidebarUpgrade(me?.role, publicPlanId) && (
          <div className="mx-3 mb-3">
            <Link
              href="/pricing"
              className="group relative flex items-center gap-2 overflow-hidden rounded-[10px] px-3 py-2.5 transition-all"
              style={{ 
                background: 'linear-gradient(135deg, var(--eaf-indigo), #4458D4)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white truncate">
                  {publicPlanId === 'FREEMIUM' ? 'Passer au Premium' : 'Passer au Masterium'}
                </p>
              </div>
            </Link>
          </div>
        )}

        {/* Theme toggle */}
        <div className="px-3 py-3" style={{ borderTop: '1px solid var(--eaf-border)' }}>
          <div 
            className="flex rounded-lg p-1"
            style={{ 
              background: 'var(--eaf-bg2)', 
              border: '1px solid var(--eaf-border)'
            }}
          >
            {([
              { pref: 'system' as const, icon: Monitor, label: 'Système' },
              { pref: 'light' as const, icon: Sun, label: 'Clair' },
              { pref: 'dark' as const, icon: Moon, label: 'Sombre' },
            ]).map(({ pref, icon: Icon }) => (
              <button
                key={pref}
                onClick={() => setTheme(pref)}
                className="flex flex-1 items-center justify-center rounded-md py-1.5 text-xs font-medium transition-all"
                style={{
                  background: preference === pref ? 'var(--eaf-bg3)' : 'transparent',
                  color: preference === pref ? 'var(--eaf-text-primary)' : 'var(--eaf-text-tertiary)'
                }}
                title={pref}
                aria-label={`Thème: ${pref}`}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
          {/* Dyslexia toggle inline */}
          <div className="mt-2">
            <DyslexiaToggle />
          </div>
        </div>

        {/* User footer */}
        <div 
          className="px-3 py-3 flex items-center gap-2 cursor-pointer transition-colors hover:bg-[var(--eaf-bg2)]"
          style={{ borderTop: '1px solid var(--eaf-border)' }}
          onClick={() => router.push('/profil')}
        >
          <div 
            className="flex h-7 w-7 items-center justify-center rounded-md text-white text-xs font-bold shrink-0"
            style={{ background: 'var(--eaf-gradient-indigo-deep)' }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p 
              className="text-xs font-semibold truncate"
              style={{ color: 'var(--eaf-text-primary)' }}
            >
              {me?.profile.displayName ?? 'Élève'}
            </p>
            {planLoaded && planLabel && (
              <span 
                className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                style={{
                  background: publicPlanId === 'MASTERIUM' ? 'var(--eaf-gold-dim)' : 
                              publicPlanId === 'PREMIUM' ? 'var(--eaf-teal-dim)' : 'var(--eaf-bg3)',
                  color: publicPlanId === 'MASTERIUM' ? 'var(--eaf-gold)' : 
                         publicPlanId === 'PREMIUM' ? 'var(--eaf-teal)' : 'var(--eaf-text-secondary)',
                  border: `1px solid ${publicPlanId === 'MASTERIUM' ? 'var(--eaf-gold-border)' : 
                                       publicPlanId === 'PREMIUM' ? 'var(--eaf-teal-border)' : 'var(--eaf-border)'}`,
                }}
              >
                {planLabel}
              </span>
            )}
          </div>
          <button
            aria-label="Se déconnecter"
            onClick={(e) => { e.stopPropagation(); void handleLogout(); }}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: 'var(--eaf-text-tertiary)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--eaf-text-tertiary)'}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>

      {/* ─── RIGHT SIDEBAR (220px) ─── */}
      <aside 
        className="hidden md:flex fixed inset-y-0 right-0 flex-col z-20 overflow-y-auto"
        style={{ 
          width: '220px', 
          background: 'var(--eaf-bg1)',
          borderLeft: '1px solid var(--eaf-border)'
        }}
      >
        <div className="px-4 py-5">
          {/* NAVIGATION Group */}
          <div className="mb-5">
            <div 
              className="pb-1 mb-3"
              style={{ borderBottom: '1px solid var(--eaf-border)' }}
            >
              <p 
                className="text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: 'var(--eaf-text-tertiary)' }}
              >
                Navigation
              </p>
            </div>
            <p 
              className="text-[11px] leading-[1.4] mb-3"
              style={{ color: 'var(--eaf-text-tertiary)' }}
            >
              Accès rapide aux ateliers et outils.
            </p>
          </div>

          {/* PILOTAGE Group */}
          <div className="mb-5">
            <div 
              className="pb-1 mb-2"
              style={{ borderBottom: '1px solid var(--eaf-border)' }}
            >
              <p 
                className="text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: 'var(--eaf-text-tertiary)' }}
              >
                Pilotage
              </p>
            </div>
            <p 
              className="text-[11px] leading-[1.4] mb-2"
              style={{ color: 'var(--eaf-text-tertiary)' }}
            >
              Voir où tu en es et quoi lancer ensuite.
            </p>
            <div className="space-y-0.5">
              {PILOTAGE_ITEMS.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </div>

          {/* ATELIERS Group */}
          <div className="mb-5">
            <div 
              className="pb-1 mb-2"
              style={{ borderBottom: '1px solid var(--eaf-border)' }}
            >
              <p 
                className="text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: 'var(--eaf-text-tertiary)' }}
              >
                Ateliers
              </p>
            </div>
            <p 
              className="text-[11px] leading-[1.4] mb-2"
              style={{ color: 'var(--eaf-text-tertiary)' }}
            >
              Pratique guidée, évaluée et relancée selon le parcours.
            </p>
            <div className="space-y-0.5">
              {ATELIER_ITEMS.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </div>

          {/* RESSOURCES Group */}
          <div>
            <div 
              className="pb-1 mb-2"
              style={{ borderBottom: '1px solid var(--eaf-border)' }}
            >
              <p 
                className="text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: 'var(--eaf-text-tertiary)' }}
              >
                Ressources
              </p>
            </div>
            <p 
              className="text-[11px] leading-[1.4] mb-2"
              style={{ color: 'var(--eaf-text-tertiary)' }}
            >
              Matière personnelle et supports à exploiter.
            </p>
            <div className="space-y-0.5">
              {RESSOURCE_ITEMS.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto px-4 py-4" style={{ borderTop: '1px solid var(--eaf-border)' }}>
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="flex h-7 w-7 items-center justify-center rounded-md text-white text-xs font-bold"
              style={{ background: 'var(--eaf-gradient-indigo-deep)' }}
            >
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p 
                className="text-xs font-semibold truncate"
                style={{ color: 'var(--eaf-text-primary)' }}
              >
                {me?.profile.displayName ?? 'Élève'} ({planLabel || 'Freemium'})
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs transition-colors hover:text-red-400"
            style={{ color: 'var(--eaf-text-tertiary)' }}
          >
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* ─── MOBILE BOTTOM NAVIGATION ─── */}
      <nav 
        className="md:hidden fixed bottom-0 inset-x-0 z-40 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2"
        style={{ 
          background: 'var(--eaf-bg1)',
          borderTop: '1px solid var(--eaf-border)'
        }}
      >
        <div className="flex gap-1 overflow-x-auto">
          {MOBILE_PRIMARY_ITEMS.map((item) => {
            if (item.isMore) {
              return (
                <div ref={mobileMoreRef} key="more" className="relative flex-1">
                  <button
                    aria-label="Plus d'actions"
                    onClick={() => setMobileMoreOpen((prev) => !prev)}
                    className="flex min-h-[48px] min-w-[48px] w-full flex-col items-center justify-center rounded-lg py-1.5 transition-all"
                    style={{
                      background: mobileMoreOpen ? 'var(--eaf-indigo-dim)' : 'transparent',
                      color: mobileMoreOpen ? 'var(--eaf-indigo)' : 'var(--eaf-text-secondary)'
                    }}
                  >
                    <MoreHorizontal className="h-5 w-5" />
                    <span className="mt-0.5 text-[10px] font-bold">Plus</span>
                  </button>
                  {mobileMoreOpen && (
                    <div 
                      className="absolute bottom-full right-0 mb-2 w-[280px] rounded-lg p-3 shadow-lg"
                      style={{ 
                        background: 'var(--eaf-bg1)', 
                        border: '1px solid var(--eaf-border)'
                      }}
                    >
                      <div className="mb-3">
                        <p 
                          className="text-[10px] font-semibold uppercase tracking-[0.08em] mb-2"
                          style={{ color: 'var(--eaf-text-tertiary)' }}
                        >
                          Navigation
                        </p>
                        <div className="space-y-1">
                          {MOBILE_OVERFLOW_ITEMS.map((navItem) => {
                            const active = pathname === navItem.href || pathname.startsWith(navItem.href);
                            return (
                              <Link
                                key={navItem.name}
                                href={navItem.href}
                                onClick={() => setMobileMoreOpen(false)}
                                className="flex min-h-[40px] items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
                                style={{
                                  background: active ? 'var(--eaf-indigo-dim)' : 'transparent',
                                  color: active ? 'var(--eaf-indigo)' : 'var(--eaf-text-secondary)'
                                }}
                              >
                                <navItem.icon className="h-4 w-4 shrink-0" />
                                <span>{navItem.name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mb-3 pt-3" style={{ borderTop: '1px solid var(--eaf-border)' }}>
                        <p 
                          className="text-[10px] font-semibold uppercase tracking-[0.08em] mb-2"
                          style={{ color: 'var(--eaf-text-tertiary)' }}
                        >
                          Affichage
                        </p>
                        <div className="grid grid-cols-3 gap-1.5">
                          {([
                            { pref: 'system' as const, icon: Monitor, label: 'Système' },
                            { pref: 'light' as const, icon: Sun, label: 'Clair' },
                            { pref: 'dark' as const, icon: Moon, label: 'Sombre' },
                          ]).map(({ pref, icon: Icon, label }) => (
                            <button
                              key={pref}
                              onClick={() => { setTheme(pref); }}
                              className="flex flex-col items-center justify-center gap-1 rounded-md px-2 py-2 text-xs font-semibold transition-colors"
                              style={{
                                background: preference === pref ? 'var(--eaf-indigo-dim)' : 'var(--eaf-bg2)',
                                color: preference === pref ? 'var(--eaf-indigo)' : 'var(--eaf-text-secondary)'
                              }}
                              aria-pressed={preference === pref}
                            >
                              <Icon className="h-4 w-4" />
                              <span>{label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3" style={{ borderTop: '1px solid var(--eaf-border)' }}>
                        <p 
                          className="text-[10px] font-semibold uppercase tracking-[0.08em] mb-2"
                          style={{ color: 'var(--eaf-text-tertiary)' }}
                        >
                          Compte
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setMobileMoreOpen(false); router.push('/profil'); }}
                            className="flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors"
                            style={{ 
                              background: 'var(--eaf-bg2)',
                              color: 'var(--eaf-text-primary)'
                            }}
                          >
                            <UserCircle2 className="h-4 w-4" />
                            Profil
                          </button>
                          <button
                            onClick={() => { setMobileMoreOpen(false); void handleLogout(); }}
                            className="flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors"
                            style={{ 
                              background: 'var(--eaf-bg2)',
                              color: 'var(--eaf-text-primary)'
                            }}
                          >
                            <LogOut className="h-4 w-4" />
                            Quitter
                          </button>
                        </div>
                        <div className="mt-3">
                          <DyslexiaToggle />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            }
            
            const active = pathname === item.href || pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                aria-label={item.name}
                className="flex min-h-[48px] min-w-[48px] flex-1 flex-col items-center justify-center rounded-lg py-1.5 transition-all"
                style={{
                  background: active ? 'var(--eaf-indigo-dim)' : 'transparent',
                  color: active ? 'var(--eaf-indigo)' : 'var(--eaf-text-secondary)'
                }}
              >
                <item.icon className="h-5 w-5" />
                <span className="mt-0.5 text-[10px] font-bold leading-tight">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
