/**
 * StickyNav — Sticky navigation bar that appears on scroll.
 * Dependencies: none (pure React + Tailwind)
 */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

export function StickyNav() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-50 border-b border-gray-200/60 bg-white/90 backdrop-blur-md transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100 shadow-sm' : '-translate-y-full opacity-0'
      }`}
      aria-label="Navigation principale"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="text-lg font-bold text-gray-900" aria-label="Nexus Réussite — Accueil">
          Nexus Réussite
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-6 md:flex">
          <a href="#ateliers" className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900">
            Ateliers
          </a>
          <a href="#tarifs" className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900">
            Tarifs
          </a>
          <Link href={ROUTES.login} className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900">
            Connexion
          </Link>
          <Link
            href={ROUTES.register}
            className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-violet-700 hover:scale-105"
            aria-label="Commencer gratuitement"
          >
            Commencer gratuitement →
          </Link>
        </div>

        {/* Mobile CTA only */}
        <Link
          href={ROUTES.register}
          className="rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-violet-700 md:hidden"
          aria-label="Commencer gratuitement"
        >
          Commencer →
        </Link>
      </div>
    </nav>
  );
}
