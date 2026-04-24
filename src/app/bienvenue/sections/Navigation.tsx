'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, User, Sparkles, Zap, Shield, BookOpen, ArrowRight } from '@/components/ui/icons';
import { track } from '@/components/analytics/events';

const NAV_LINKS = [
  { label: 'Fonctionnalités', href: '#fonctionnalites', icon: Sparkles },
  { label: 'Méthode', href: '#comment-ca-marche', icon: Zap },
  { label: 'Tarifs', href: '#tarifs', icon: Shield },
  { label: 'FAQ', href: '#faq', icon: BookOpen },
];

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (href: string, label: string) => {
    track({ name: 'cta_click', props: { cta: `nav_${label.toLowerCase()}`, path: '/' } });
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-[var(--eaf-bg0)]/95 backdrop-blur-md border-b border-[var(--eaf-border)]'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 text-[var(--eaf-orange)] transition-opacity hover:opacity-80"
              onClick={() => track({ name: 'cta_click', props: { cta: 'nav_logo', path: '/' } })}
            >
              <span
                className="text-xl font-bold tracking-tight"
                style={{ fontFamily: 'var(--eaf-font-display)' }}
              >
                Nexus Réussite
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => handleNavClick(link.href, link.label)}
                  className="group flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-[var(--eaf-text-secondary)] transition-all hover:bg-[var(--eaf-bg2)] hover:text-[var(--eaf-text-primary)]"
                >
                  <link.icon className="h-4 w-4 transition-colors group-hover:text-[var(--eaf-orange)]" />
                  {link.label}
                </a>
              ))}
            </div>

            {/* Desktop CTA Buttons */}
            <div className="hidden md:flex md:items-center md:gap-3">
              <Link
                href="/login"
                onClick={() => track({ name: 'cta_click', props: { cta: 'nav_login', path: '/' } })}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-[var(--eaf-text-secondary)] transition-all hover:bg-[var(--eaf-bg2)] hover:text-[var(--eaf-text-primary)]"
              >
                <User className="h-4 w-4" />
                Connexion
              </Link>
              <Link
                href="/login?mode=register"
                onClick={() => track({ name: 'cta_click', props: { cta: 'nav_register', path: '/' } })}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--eaf-orange)] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[var(--eaf-orange)]/20 transition-all hover:-translate-y-0.5 hover:bg-[var(--eaf-orange-hover)] hover:shadow-xl hover:shadow-[var(--eaf-orange)]/30"
              >
                Commencer
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--eaf-bg2)] text-[var(--eaf-text-secondary)] transition-colors hover:bg-[var(--eaf-bg3)] hover:text-[var(--eaf-text-primary)] md:hidden"
              aria-label={isMobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 transform transition-transform duration-300 md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Menu Panel */}
        <div className="absolute right-0 top-0 h-full w-[280px] bg-[var(--eaf-bg0)] p-6 pt-20 shadow-2xl">
          <div className="flex flex-col gap-2">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => handleNavClick(link.href, link.label)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-[var(--eaf-text-secondary)] transition-all hover:bg-[var(--eaf-bg2)] hover:text-[var(--eaf-text-primary)]"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ background: 'var(--eaf-bg3)' }}
                >
                  <link.icon className="h-5 w-5 text-[var(--eaf-orange)]" />
                </div>
                {link.label}
              </a>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-[var(--eaf-border)] pt-6">
            <Link
              href="/login"
              onClick={() => track({ name: 'cta_click', props: { cta: 'nav_mobile_login', path: '/' } })}
              className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-semibold text-[var(--eaf-text-secondary)] transition-all hover:bg-[var(--eaf-bg2)] hover:text-[var(--eaf-text-primary)]"
            >
              <User className="h-5 w-5" />
              Connexion
            </Link>
            <Link
              href="/login?mode=register"
              onClick={() => track({ name: 'cta_click', props: { cta: 'nav_mobile_register', path: '/' } })}
              className="flex items-center justify-center gap-2 rounded-xl bg-[var(--eaf-orange)] px-4 py-3 text-base font-bold text-white shadow-lg shadow-[var(--eaf-orange)]/20 transition-all hover:bg-[var(--eaf-orange-hover)]"
            >
              Commencer gratuitement
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          {/* Mobile PC Notice */}
          <div className="mt-6 rounded-xl bg-[var(--eaf-bg2)] p-4 text-center">
            <p className="text-xs text-[var(--eaf-text-tertiary)]">
              🖥️ Pour utiliser les ateliers, ouvre cette page sur ton ordinateur
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
