/**
 * StickyNav — Sticky navigation bar that appears on scroll.
 * Dependencies: none (pure React + Tailwind)
 */
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
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
          <Image
            src="/images/logo_nexus_reussite.png"
            alt=""
            width={32}
            height={32}
            className="h-7 w-7 object-contain sm:h-8 sm:w-8"
            aria-hidden="true"
          />
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
