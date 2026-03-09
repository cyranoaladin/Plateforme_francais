'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Menu, X } from 'lucide-react';
import { track } from '@/components/analytics/events';

const NAV_LINKS = [
  { label: 'La méthode', href: '#comment-ca-marche' },
  { label: 'Ateliers', href: '#fonctionnalites' },
  { label: 'Plans', href: '#plans' },
  { label: 'Tarifs détaillés', href: '/pricing' },
  { label: 'FAQ', href: '#faq' },
];

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
    <header className="sticky top-0 z-50 border-b border-[#d8ccb9]/70 bg-[rgba(244,239,229,0.8)] backdrop-blur-xl supports-[backdrop-filter]:bg-[rgba(244,239,229,0.72)]">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-4 shrink-0">
          <img src="/images/logo_slogan_nexus.png" alt="Nexus Réussite" className="h-11 w-auto object-contain" />
          <div className="hidden xl:flex items-center gap-2 rounded-full border border-[#d8ccb9] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#17324d]">
            <span className="h-2 w-2 rounded-full bg-[#0f766e]" />
            Session 2026
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-8" aria-label="Navigation principale">
          {NAV_LINKS.map((link) =>
            link.href.startsWith('/') ? (
              <Link key={link.href} href={link.href} className="text-sm font-medium text-slate-600 transition-colors hover:text-[#17324d]">
                {link.label}
              </Link>
            ) : (
              <a key={link.href} href={link.href} className="text-sm font-medium text-slate-600 transition-colors hover:text-[#17324d]">
                {link.label}
              </a>
            )
          )}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <Link href="/login" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:text-[#17324d]">
            Se connecter
          </Link>
          <Link
            href="/login?mode=register"
            onClick={() => track({ name: 'cta_click', props: { cta: 'header_register', path: '/' } })}
            className="inline-flex items-center gap-2 rounded-full bg-[#17324d] px-5 py-2.5 text-sm font-bold text-[#f7f2ea] shadow-[0_18px_45px_rgba(23,50,77,0.16)] transition-all hover:-translate-y-0.5 hover:bg-[#0f2740]"
          >
            Créer mon espace
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="lg:hidden rounded-full border border-[#d8ccb9] bg-white/80 p-2 text-[#17324d]"
          aria-label="Menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <nav className="lg:hidden border-t border-[#d8ccb9] bg-[#f8f4ec] px-4 py-4" aria-label="Navigation mobile">
          <div className="mx-auto flex max-w-7xl flex-col gap-2">
            {NAV_LINKS.map((link) => (
              link.href.startsWith('/') ? (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-white hover:text-[#17324d]"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-white hover:text-[#17324d]"
                >
                  {link.label}
                </a>
              )
            ))}

            <div className="mt-2 grid gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-2xl border border-[#d8ccb9] bg-white px-4 py-3 text-center text-sm font-semibold text-[#17324d]"
              >
                Se connecter
              </Link>
              <Link
                href="/login?mode=register"
                onClick={() => {
                  setMobileMenuOpen(false);
                  track({ name: 'cta_click', props: { cta: 'header_register_mobile', path: '/' } });
                }}
                className="rounded-2xl bg-[#17324d] px-4 py-3 text-center text-sm font-bold text-[#f7f2ea]"
              >
                Créer mon espace gratuit
              </Link>
            </div>
          </div>
        </nav>
      )}

    </header>

    {/* Bandeau sticky bas — mobile uniquement */}
    <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-[#d8ccb9] bg-[rgba(244,239,229,0.96)] backdrop-blur-xl px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-8px_30px_rgba(23,50,77,0.12)]">
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#0f766e]">Inscription gratuite</p>
        <p className="truncate text-xs text-slate-600">3 min · aucun paiement requis</p>
      </div>
      <Link
        href="/login?mode=register"
        onClick={() => track({ name: 'cta_click', props: { cta: 'sticky_bottom_register', path: '/' } })}
        className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-[#17324d] px-4 py-2.5 text-sm font-bold text-[#f7f2ea] shadow-[0_10px_30px_rgba(23,50,77,0.22)] transition-all hover:bg-[#0f2740]"
      >
        Commencer <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
    </>
  );
}
