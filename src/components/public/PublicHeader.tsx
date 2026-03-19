'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, GraduationCap, Menu, X } from 'lucide-react';
import { track } from '@/components/analytics/events';

const NAV_LINKS = [
  { label: 'La méthode', href: '#comment-ca-marche' },
  { label: 'Ateliers', href: '#fonctionnalites' },
  { label: 'Tarifs', href: '#plans' },
  { label: 'FAQ', href: '#faq' },
];

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo + French Flag */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className={`p-2 rounded-lg transition-colors ${isScrolled ? 'bg-[var(--navy)]' : 'bg-white/20'}`}>
              <GraduationCap className={`w-5 h-5 ${isScrolled ? 'text-white' : 'text-white'}`} />
            </div>
            <div className="flex flex-col">
              <span className={`font-bold text-lg leading-tight transition-colors ${isScrolled ? 'text-[var(--navy)]' : 'text-white'}`}>
                Nexus Réussite
              </span>
              <span className={`text-xs transition-colors ${isScrolled ? 'text-[var(--gold)]' : 'text-white/80'}`}>
                Session 2026
              </span>
            </div>
            {/* French Flag */}
            <div className="hidden sm:flex h-5 w-6 rounded overflow-hidden shadow-sm ml-1">
              <span className="w-2 h-full bg-[var(--french-blue)]" />
              <span className="w-2 h-full bg-white" />
              <span className="w-2 h-full bg-[var(--french-red)]" />
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8" aria-label="Navigation principale">
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                type="button"
                onClick={() => scrollToSection(link.href)}
                className={`text-sm font-medium transition-colors hover:text-[var(--gold)] ${
                  isScrolled ? 'text-[var(--text-secondary)]' : 'text-white/90'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/login"
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                isScrolled ? 'text-[var(--navy)] hover:text-[var(--navy-dark)]' : 'text-white hover:text-white hover:bg-white/10'
              }`}
            >
              Se connecter
            </Link>
            <Link
              href="/login?mode=register"
              onClick={() => track({ name: 'cta_click', props: { cta: 'header_register', path: '/' } })}
              className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-all hover:-translate-y-0.5 ${
                isScrolled
                  ? 'bg-gradient-to-r from-[var(--gold)] to-[var(--gold-deep)] text-[var(--navy-dark)] shadow-gold'
                  : 'bg-white text-[var(--navy)] hover:bg-white/90'
              }`}
            >
              Créer mon espace
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className={`lg:hidden rounded-full p-2 transition-colors ${
              isScrolled ? 'text-[var(--navy)] hover:bg-gray-100' : 'text-white hover:bg-white/10'
            }`}
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-white rounded-xl shadow-lg mt-2 mx-4 p-4 animate-fade-up">
            <div className="flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => scrollToSection(link.href)}
                  className="text-left px-4 py-3 text-[var(--text-secondary)] hover:text-[var(--navy)] hover:bg-gray-50 rounded-lg transition-colors"
                >
                  {link.label}
                </button>
              ))}
              <hr className="my-2 border-gray-100" />
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--navy)]"
              >
                Se connecter
              </Link>
              <Link
                href="/login?mode=register"
                onClick={() => {
                  setMobileMenuOpen(false);
                  track({ name: 'cta_click', props: { cta: 'header_register_mobile', path: '/' } });
                }}
                className="btn-gold text-center text-sm"
              >
                Créer mon espace
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Mobile sticky bottom bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden border-t border-[var(--border-strong)] bg-white/96 backdrop-blur-xl px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-8px_30px_rgba(23,50,77,0.12)]">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--gold)]">Inscription gratuite</p>
          <p className="truncate text-xs text-[var(--text-secondary)]">3 min · aucun paiement requis</p>
        </div>
        <Link
          href="/login?mode=register"
          onClick={() => track({ name: 'cta_click', props: { cta: 'sticky_bottom_register', path: '/' } })}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[var(--gold)] to-[var(--gold-deep)] px-4 py-2.5 text-sm font-bold text-[var(--navy-dark)] shadow-gold transition-all hover:-translate-y-0.5"
        >
          Commencer <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </>
  );
}
