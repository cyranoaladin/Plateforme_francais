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
      className={`fixed inset-x-0 top-0 z-50 border-b border-gray-200/60 bg-white/90 backdrop-blur-md transition-all duration-200 ease-out will-change-transform ${
        visible ? 'translate-y-0 opacity-100 shadow-sm' : '-translate-y-full opacity-0'
      }`}
      aria-label="Navigation principale"
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6">
        <Link href="/" className="flex items-center gap-2" aria-label="Nexus Réussite — Accueil">
          <span className="text-sapphire-700">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M14 6C14 6 8 5 4 7V22C8 20 14 21 14 21V6Z" fill="currentColor" opacity="0.9"/>
              <path d="M14 6C14 6 20 5 24 7V22C20 20 14 21 14 21V6Z" fill="currentColor" opacity="0.7"/>
              <path d="M14 3L14.6 4.8H16.5L15 5.9L15.6 7.7L14 6.6L12.4 7.7L13 5.9L11.5 4.8H13.4L14 3Z" fill="currentColor"/>
            </svg>
          </span>
          <span className="text-base font-bold text-gray-900 sm:text-lg">
            Nexus Réussite
          </span>
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
            className="rounded-full bg-sapphire-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sapphire-700 hover:scale-105"
          >
            Commencer gratuitement →
          </Link>
        </div>

        {/* Mobile CTA only */}
        <Link
          href={ROUTES.register}
          className="rounded-full bg-sapphire-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sapphire-700 md:hidden"
          aria-label="Commencer gratuitement"
        >
          Commencer
        </Link>
      </div>
    </nav>
  );
}
