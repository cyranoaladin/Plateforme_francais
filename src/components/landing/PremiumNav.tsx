'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NAV_COPY = {
  brand: 'Plateforme Français',
  method: 'Méthode',
  pricing: 'Tarifs',
  testimonials: 'Témoignages',
  login: 'Connexion',
  freeTrialButton: 'Essai Gratuit',
} as const;

export function PremiumNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4"
      aria-label="Navigation principale"
    >
      <div
        className={`mx-auto flex max-w-6xl items-center justify-between rounded-2xl border px-4 py-3 transition-all duration-300 sm:px-6 sm:py-4 ${
          scrolled
            ? 'border-indigo-200/60 bg-white/97 shadow-xl backdrop-blur-2xl'
            : 'border-indigo-200/40 bg-white/85 shadow-lg backdrop-blur-xl'
        }`}
      >
        {/* Logo */}
        <Link
          href="#"
          className="flex items-center gap-2 group"
          aria-label={NAV_COPY.brand}
        >
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 shadow-md group-hover:shadow-lg transition-all" />
          <span className="hidden font-playfair text-lg font-700 text-slate-900 sm:block group-hover:text-indigo-700 transition-colors">
            {NAV_COPY.brand}
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden items-center gap-8 md:flex">
          <a
            href="#method"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-indigo-600"
          >
            {NAV_COPY.method}
          </a>
          <a
            href="#pricing"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-indigo-600"
          >
            {NAV_COPY.pricing}
          </a>
          <a
            href="#testimonials"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-indigo-600"
          >
            {NAV_COPY.testimonials}
          </a>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="#login" className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-indigo-600 md:block">
            {NAV_COPY.login}
          </Link>
          <a
            href="#signup"
            className="hidden sm:inline-flex h-8 px-3 text-sm rounded-[var(--radius-md)] font-medium bg-gradient-to-r from-[var(--c-reward)] to-[var(--color-amber-300)] text-[var(--text-reward-on-subtle)] font-semibold hover:brightness-110 hover:-translate-y-[1px] hover:shadow-[var(--shadow-md)] transition-all duration-[var(--transition-normal)] items-center justify-center"
          >
            {NAV_COPY.freeTrialButton}
          </a>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="inline-flex md:hidden"
            aria-label="Menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <X className="h-6 w-6 text-slate-900" />
            ) : (
              <Menu className="h-6 w-6 text-slate-900" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="absolute left-3 right-3 top-16 space-y-2 rounded-2xl border border-slate-200/60 bg-white/95 p-4 shadow-lg backdrop-blur-xl sm:left-5 sm:right-5">
          <a
            href="#method"
            className="block rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-indigo-600"
            onClick={() => setMobileOpen(false)}
          >
            {NAV_COPY.method}
          </a>
          <a
            href="#pricing"
            className="block rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-indigo-600"
            onClick={() => setMobileOpen(false)}
          >
            {NAV_COPY.pricing}
          </a>
          <a
            href="#testimonials"
            className="block rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-indigo-600"
            onClick={() => setMobileOpen(false)}
          >
            {NAV_COPY.testimonials}
          </a>
          <a
            href="#login"
            className="block rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-indigo-600"
            onClick={() => setMobileOpen(false)}
          >
            {NAV_COPY.login}
          </a>
          <a
            href="#signup"
            onClick={() => setMobileOpen(false)}
            className="block w-full h-8 px-3 text-sm rounded-[var(--radius-md)] font-medium bg-gradient-to-r from-[var(--c-reward)] to-[var(--color-amber-300)] text-[var(--text-reward-on-subtle)] font-semibold hover:brightness-110 hover:-translate-y-[1px] hover:shadow-[var(--shadow-md)] transition-all duration-[var(--transition-normal)] text-center"
          >
            {NAV_COPY.freeTrialButton}
          </a>
        </div>
      )}
    </nav>
  );
}
