'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { DyslexiaToggle } from '@/components/accessibility/dyslexia-toggle';
import {
  LogOut,
  Sun,
  Moon,
  Monitor,
  Flame,
  Award,
  Settings,
  Sparkles,
  MoreHorizontal,
  UserCircle2,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { getCsrfTokenFromDocument } from '@/lib/security/csrf-client';
import { useTheme } from '@/components/theme/theme-provider';
import { toPublicPlanId } from '@/lib/billing/plan-catalog';
import type { ExamInfoPayload } from '@/lib/exam/exam-info';
import { setClientAuthenticated } from '@/lib/auth/client-auth-state';
import {
  computeSidebarLearningSignals,
  studentMobileOverflowItems,
  studentMobilePrimaryNavItems,
  studentNavSections,
} from '@/components/layout/student-navigation';
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

const SIDEBAR_COPY = {
  brandAlt: 'Nexus Réussite',
  brandTitle: 'Nexus Réussite',
  brandSubtitle: 'Tableau de bord EAF',
  brandBody: 'Travail guidé, progression lisible, matière exploitable.',
  metricDays: 'J-EAF',
  metricStreak: 'Série',
  metricBadges: 'Badges',
  trajectoryTitle: 'Trajectoire actuelle',
  settingsAria: 'Paramètres',
  logoutAria: 'Se déconnecter',
  desktopNavTitle: 'Navigation',
  desktopNavBody: 'Accès rapide aux ateliers et outils.',
  mobileMoreAria: 'Plus d’actions',
  mobileMore: 'Plus',
  mobileNavTitle: 'Navigation',
  mobileDisplayTitle: 'Affichage',
  mobileAccountTitle: 'Compte',
  profile: 'Profil',
  logout: 'Quitter',
} as const;

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

  // Close mobile overflow popover on outside click
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

  return (
    <>
      {/* ─── Desktop LEFT Sidebar (branding, stats, user, upgrade) ─── */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-72 flex-col border-r border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-md)] z-10">
        <div className="border-b border-[var(--border-default)] px-5 py-5">
          <div className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[linear-gradient(180deg,var(--bg-surface)_0%,var(--bg-page)_100%)] p-4 shadow-[var(--shadow-sm)]">
            <div className="flex items-center gap-3">
              <img
                src="/images/logo_nexus_reussite.png"
                alt={SIDEBAR_COPY.brandAlt}
                className="h-14 w-14 object-contain rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] p-1.5"
              />
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-reward)]">{SIDEBAR_COPY.brandTitle}</p>
                <p className="mt-1 text-sm font-semibold text-[var(--c-primary)]">{SIDEBAR_COPY.brandSubtitle}</p>
                <p className="text-xs text-[var(--text-secondary)]">{SIDEBAR_COPY.brandBody}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]/85 p-2.5 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-body)]">{SIDEBAR_COPY.metricDays}</p>
                <p className="mt-1 text-base font-bold text-[var(--c-primary)]">{joursAvantEAF !== null ? joursAvantEAF : '--'}</p>
              </div>
              <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]/85 p-2.5 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-body)]">{SIDEBAR_COPY.metricStreak}</p>
                <p className="mt-1 flex items-center justify-center gap-1 text-base font-bold text-[var(--c-primary)]">
                  <Flame className="h-3.5 w-3.5 text-[var(--c-accent)]" /> {streak}
                </p>
              </div>
              <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)]/85 p-2.5 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--text-body)]">{SIDEBAR_COPY.metricBadges}</p>
                <p className="mt-1 flex items-center justify-center gap-1 text-base font-bold text-[var(--c-primary)]">
                  <Award className="h-3.5 w-3.5 text-[var(--c-reward)]" /> {badgeCount}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-[var(--radius-xl)] border border-[var(--border-success)] bg-[var(--bg-success)] p-3.5">
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
                      strokeDasharray={`${Math.round((((globalScore ?? 0) / 20)) * 97.4)} 97.4`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[var(--c-primary)]">
                    {globalScore === null ? '--' : globalScore}
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--c-primary)]">{SIDEBAR_COPY.trajectoryTitle}</p>
                  <p className="text-xs leading-5 text-[var(--text-secondary)]">
                    {globalScore === null
                      ? 'Premier diagnostic à construire avec une séance évaluée.'
                      : `Objectif visé : ${me?.profile.targetScore ?? '14/20'}.`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1" />

        {/* ─── Upgrade CTA (FREE & PREMIUM only) ─── */}
        {planLoaded && planId !== null && shouldShowSidebarUpgrade(me?.role, publicPlanId) && (
          <div className="mx-4 mb-3">
            <Link
              href="/pricing"
              className="group relative flex items-center gap-3 overflow-hidden rounded-[20px] bg-gradient-to-r from-[var(--color-indigo-600)] to-[var(--color-indigo-400)] px-4 py-3.5 shadow-[var(--shadow-md)] transition-all hover:shadow-[var(--shadow-lg)] hover:-translate-y-0.5"
            >
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12)_0%,transparent_50%)]" />
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-lg)] bg-white/20 text-white">
                <Sparkles className="h-[18px] w-[18px]" />
              </div>
              <div className="relative min-w-0 flex-1">
                <p className="text-sm font-bold text-white">
                  {publicPlanId === 'FREEMIUM' ? 'Passer au Premium' : 'Passer au Masterium'}
                </p>
                <p className="text-xs text-white/75">
                  {publicPlanId === 'FREEMIUM'
                    ? '10 oraux par semaine, bibliothèque complète'
                    : 'Accès total, historique, support prioritaire'}
                </p>
              </div>
            </Link>
          </div>
        )}

        <div className="border-t border-[var(--border-default)] p-4 space-y-3">
          {/* ─── Theme Selector (3-state pill) ─── */}
          <div className="flex items-center justify-center rounded-full border border-[var(--border-default)] bg-[var(--bg-surface-secondary)] p-1 shadow-[var(--shadow-sm)]">
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
                    ? 'bg-[var(--bg-surface)] text-[var(--text-heading)] shadow-[var(--shadow-sm)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-body)]'
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
              aria-label={SIDEBAR_COPY.settingsAria}
              onClick={() => router.push('/profil')}
              className="min-h-[44px] min-w-[44px] rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)]/80 p-2.5 text-[var(--c-primary)] transition-colors hover:bg-[var(--bg-surface)]"
            >
              <Settings className="w-4 h-4" />
            </button>
            <DyslexiaToggle />
            <button
              aria-label={SIDEBAR_COPY.logoutAria}
              onClick={handleLogout}
              className="ml-auto min-h-[44px] min-w-[44px] rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)]/80 p-2.5 text-[var(--c-primary)] transition-colors hover:bg-[var(--bg-surface)]"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 p-2 rounded-[var(--radius-md)] hover:bg-muted/50 transition-colors cursor-pointer group"
            onClick={() => router.push('/profil')}
          >
            <div className="w-10 h-10 rounded-full bg-[var(--c-primary)]/12 flex items-center justify-center text-[var(--c-primary)] font-bold text-sm shrink-0 group-hover:ring-2 ring-[var(--c-primary)]/20 transition-all">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--c-primary)] truncate">{me?.profile.displayName ?? 'Élève'}</p>
              <p className="text-xs text-[var(--text-secondary)]">
                {planLoaded && planLabel && (
                <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] ${
                  publicPlanId === 'FREEMIUM' ? 'bg-[var(--c-primary)]/8 text-[var(--text-secondary)]'
                  : publicPlanId === 'PREMIUM' ? 'bg-[var(--c-success)]/12 text-[var(--c-success)]'
                  : 'bg-[var(--c-reward)]/12 text-[var(--c-reward)]'
                }`}>
                  {planLabel}
                </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── Desktop RIGHT Sidebar (navigation) ─── */}
      <aside className="hidden md:flex fixed inset-y-0 right-0 w-60 lg:w-64 flex-col border-l border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-md)] z-10">
        <div className="px-4 pt-5 pb-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--c-reward)]">{SIDEBAR_COPY.desktopNavTitle}</p>
          <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{SIDEBAR_COPY.desktopNavBody}</p>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-2">
          {studentNavSections.map((section) => (
            <section key={section.label}>
              <div className="mb-2 px-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--c-reward)]">{section.label}</p>
                <p className="mt-0.5 text-[11px] leading-4 text-[var(--text-secondary)]">{section.description}</p>
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center gap-2.5 rounded-[16px] border px-3 py-2.5 text-sm transition-all ${
                        isActive
                          ? 'border-[var(--color-indigo-700)] bg-[var(--color-indigo-700)] text-[var(--hero-surface-text)] shadow-[var(--shadow-sm)]'
                          : 'border-transparent bg-[var(--bg-surface)]/50 text-[var(--text-secondary)] hover:border-[var(--border-default)] hover:bg-[var(--bg-surface)] hover:text-[var(--c-primary)]'
                      }`}
                    >
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] ${
                        isActive ? 'bg-white/12 text-white' : 'bg-[var(--c-primary)]/8 text-[var(--c-primary)]'
                      }`}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold leading-tight ${isActive ? 'text-white' : 'text-[var(--c-primary)]'}`}>{item.name}</p>
                        <p className={`text-[11px] leading-tight ${isActive ? 'text-white/65' : 'text-[var(--text-secondary)]'}`}>{item.hint}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>
      </aside>

      {/* ─── Mobile Bottom Navigation ─── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[var(--border-default)] bg-[var(--bg-surface)]/96 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md shadow-[var(--shadow-md)]">
        <div className="flex gap-1.5 overflow-x-auto">
          {studentMobilePrimaryNavItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                aria-label={item.name}
                className={`flex min-h-[48px] min-w-[48px] flex-1 flex-col items-center justify-center rounded-[var(--radius-lg)] py-2 transition-all ${
                  active
                    ? 'bg-[var(--color-indigo-700)] text-[var(--hero-surface-text)] shadow-[var(--shadow-md)]'
                    : 'text-[var(--text-secondary)] active:bg-[var(--bg-surface)] active:text-[var(--c-primary)]'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="mt-0.5 text-[10px] font-bold leading-tight">{item.name}</span>
              </Link>
            );
          })}
          <div ref={mobileMoreRef} className="relative flex-1">
            <button
              aria-label={SIDEBAR_COPY.mobileMoreAria}
              onClick={() => setMobileMoreOpen((prev) => !prev)}
              className={`flex min-h-[48px] min-w-[48px] w-full flex-col items-center justify-center rounded-[var(--radius-lg)] py-2 transition-all ${
                mobileMoreOpen
                  ? 'bg-[var(--color-indigo-700)] text-[var(--hero-surface-text)] shadow-[var(--shadow-md)]'
                  : 'text-[var(--text-secondary)] active:bg-[var(--bg-surface)] active:text-[var(--c-primary)]'
              }`}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span className="mt-0.5 text-[10px] font-bold leading-tight">{SIDEBAR_COPY.mobileMore}</span>
            </button>
            {mobileMoreOpen && (
              <div className="absolute bottom-full right-0 mb-2 w-[min(92vw,280px)] rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 shadow-[var(--shadow-md)]">
                <div className="mb-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--c-reward)]">{SIDEBAR_COPY.mobileNavTitle}</p>
                  <div className="mt-2 space-y-1">
                    {studentMobileOverflowItems.map((item) => {
                      const active = pathname === item.href || pathname.startsWith(item.href);

                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={() => setMobileMoreOpen(false)}
                          className={`flex min-h-[44px] items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors ${
                            active
                              ? 'bg-[var(--color-indigo-700)] text-[var(--hero-surface-text)]'
                              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-secondary)] hover:text-[var(--c-primary)]'
                          }`}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                <div className="mb-3 border-t border-[var(--border-default)] pt-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--c-reward)]">{SIDEBAR_COPY.mobileDisplayTitle}</p>
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    {([
                      { pref: 'system' as const, icon: Monitor, label: 'Système' },
                      { pref: 'light' as const, icon: Sun, label: 'Clair' },
                      { pref: 'dark' as const, icon: Moon, label: 'Sombre' },
                    ]).map(({ pref, icon: Icon, label }) => (
                      <button
                        key={pref}
                        onClick={() => { setTheme(pref); }}
                        className={`flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] px-2 py-2 text-xs font-semibold transition-colors ${
                          preference === pref
                            ? 'bg-[var(--color-indigo-700)] text-[var(--hero-surface-text)]'
                            : 'bg-[var(--bg-surface-secondary)] text-[var(--text-secondary)]'
                        }`}
                        aria-pressed={preference === pref}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[var(--border-default)] pt-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--c-reward)]">{SIDEBAR_COPY.mobileAccountTitle}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={() => { setMobileMoreOpen(false); router.push('/profil'); }}
                      className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface-secondary)] px-3 py-2 text-sm font-medium text-[var(--c-primary)]"
                    >
                      <UserCircle2 className="h-4 w-4" />
                      {SIDEBAR_COPY.profile}
                    </button>
                    <button
                      onClick={() => { setMobileMoreOpen(false); void handleLogout(); }}
                      className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface-secondary)] px-3 py-2 text-sm font-medium text-[var(--c-primary)]"
                    >
                      <LogOut className="h-4 w-4" />
                      {SIDEBAR_COPY.logout}
                    </button>
                  </div>
                  <div className="mt-3">
                    <DyslexiaToggle />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
