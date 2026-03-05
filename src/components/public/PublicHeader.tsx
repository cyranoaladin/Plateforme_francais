'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { track } from '@/components/analytics/events';

const NAV_LINKS = [
  { label: 'Fonctionnalités', href: '#fonctionnalites' },
  { label: 'Tarifs', href: '#tarifs' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Sécurité', href: '#securite' },
];

/**
 * Sticky public header for /bienvenue and /login.
 */
export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-gray-950/80 border-b border-border/50">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        <Link href="/bienvenue" className="flex items-center gap-2.5 shrink-0">
          <img src="/images/logo_slogan_nexus.png" alt="Nexus Réussite" className="h-10 w-auto object-contain" />
        </Link>

        <nav className="hidden md:flex items-center gap-6" aria-label="Navigation principale">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Se connecter
          </Link>
          <Link
            href="/login?mode=register"
            onClick={() => track({ name: 'cta_click', props: { cta: 'header_register', path: '/bienvenue' } })}
            className="px-4 py-2 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-colors shadow-md"
          >
            Commencer gratuitement
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="md:hidden p-2 text-foreground"
          aria-label="Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-border bg-card px-4 py-4 space-y-3" aria-label="Navigation mobile">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm text-muted-foreground hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <Link href="/login" className="text-sm font-medium text-foreground text-center py-2">Se connecter</Link>
            <Link href="/login?mode=register" className="px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold text-center">
              Commencer gratuitement
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
