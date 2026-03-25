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
            ? 'border-slate-200/60 bg-white/95 shadow-lg backdrop-blur-xl'
            : 'border-slate-200/40 bg-white/80 shadow-md backdrop-blur-lg'
        }`}
      >
        {/* Logo */}
        <Link
          href="#"
          className="flex items-center gap-2"
          aria-label={NAV_COPY.brand}
        >
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-700" />
          <span className="hidden font-playfair text-lg font-700 text-slate-900 sm:block">
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
          <Button
            variant="gold"
            size="sm"
            className="hidden sm:inline-flex"
            asChild
          >
            <a href="#signup">{NAV_COPY.freeTrialButton}</a>
          </Button>

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
          <Button
            variant="gold"
            size="sm"
            className="w-full"
            asChild
          >
            <a href="#signup" onClick={() => setMobileOpen(false)}>
              {NAV_COPY.freeTrialButton}
            </a>
          </Button>
        </div>
      )}
    </nav>
  );
}
