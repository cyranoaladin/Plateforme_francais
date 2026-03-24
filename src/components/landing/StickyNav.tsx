/**
 * StickyNav — Sticky navigation bar that appears on scroll.
 * Dependencies: none (pure React + Tailwind)
 */
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

const STICKY_NAV_COPY = {
  navAria: 'Navigation principale',
  homeAria: 'Nexus Réussite — Accueil',
  brand: 'Nexus Réussite',
  sublabel: 'Préparation EAF',
  workshops: 'Ateliers',
  pricing: 'Tarifs',
  login: 'Connexion',
  primaryCta: 'Commencer gratuitement →',
  mobileCtaAria: 'Commencer gratuitement',
  mobileCta: 'Commencer',
} as const;

export function StickyNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4"
      aria-label={STICKY_NAV_COPY.navAria}
    >
      <div
        className={`pointer-events-auto mx-auto flex max-w-6xl items-center justify-between rounded-[22px] border px-4 py-2.5 transition-all duration-300 ease-out sm:px-5 sm:py-3 ${
          scrolled
            ? 'border-slate-200/80 bg-white/92 shadow-[0_10px_30px_rgba(15,23,42,0.10)] backdrop-blur-xl'
            : 'border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.08))] shadow-[0_12px_40px_rgba(2,6,23,0.22)] backdrop-blur-lg'
        }`}
      >
        <Link href="/" className="flex items-center gap-3" aria-label={STICKY_NAV_COPY.homeAria}>
          <Image
            src="/images/logo_nexus_reussite_nav.webp"
            alt=""
            width={96}
            height={96}
            className={`object-contain transition-all duration-300 ${scrolled ? 'h-9 w-9' : 'h-10 w-10'}`}
            aria-hidden="true"
          />
          <div className="min-w-0">
            <span
              className={`block truncate font-[family:var(--font-display)] leading-none tracking-[0.01em] transition-colors duration-300 ${
                scrolled ? 'text-[1.15rem] text-slate-900' : 'text-[1.2rem] text-white'
              }`}
            >
              {STICKY_NAV_COPY.brand}
            </span>
            <span
              className={`mt-1 hidden text-[0.66rem] font-semibold uppercase tracking-[0.22em] sm:block ${
                scrolled ? 'text-slate-500' : 'text-white/62'
              }`}
            >
              {STICKY_NAV_COPY.sublabel}
            </span>
          </div>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          <a
            href="#ateliers"
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
              scrolled
                ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            {STICKY_NAV_COPY.workshops}
          </a>
          <a
            href="#tarifs"
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
              scrolled
                ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            {STICKY_NAV_COPY.pricing}
          </a>
          <Link
            href={ROUTES.login}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
              scrolled
                ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            {STICKY_NAV_COPY.login}
          </Link>
          <Link
            href={ROUTES.register}
            className={`ml-2 inline-flex items-center rounded-full border px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 ${
              scrolled
                ? 'border-sapphire-800 bg-sapphire-700 shadow-[0_10px_24px_rgba(67,56,202,0.24)] hover:bg-sapphire-600 hover:shadow-[0_14px_30px_rgba(67,56,202,0.28)]'
                : 'border-white/16 bg-[linear-gradient(135deg,rgba(99,102,241,0.96),rgba(67,56,202,0.96))] shadow-[0_14px_34px_rgba(67,56,202,0.28)] hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(67,56,202,0.34)]'
            }`}
          >
            {STICKY_NAV_COPY.primaryCta}
          </Link>
        </div>

        <Link
          href={ROUTES.register}
          className={`inline-flex items-center rounded-full border px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 md:hidden ${
            scrolled
              ? 'border-sapphire-800 bg-sapphire-700 shadow-[0_10px_24px_rgba(67,56,202,0.24)]'
              : 'border-white/16 bg-[linear-gradient(135deg,rgba(99,102,241,0.96),rgba(67,56,202,0.96))] shadow-[0_14px_34px_rgba(67,56,202,0.28)]'
          }`}
          aria-label={STICKY_NAV_COPY.mobileCtaAria}
        >
          {STICKY_NAV_COPY.mobileCta}
        </Link>
      </div>
    </nav>
  );
}
