/**
 * Footer — 4-column site footer with links, contact, and legal.
 * Dependencies: next/link
 */

import Image from 'next/image';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

const QUICK_LINKS = [
  { label: 'Accueil', href: '/' },
  { label: 'Tarifs', href: '/pricing' },
  { label: 'Connexion', href: ROUTES.login },
  { label: 'Inscription', href: ROUTES.register },
  { label: 'Contact', href: '/contact' },
];

const WORKSHOP_LINKS = [
  { label: 'Atelier Oral', href: ROUTES.registerOral },
  { label: 'Atelier Écrit', href: ROUTES.registerEcrit },
  { label: 'Atelier Langue', href: ROUTES.registerLangue },
  { label: 'Quiz adaptatif', href: ROUTES.registerQuiz },
  { label: 'Tuteur IA', href: ROUTES.register },
  { label: 'Bibliothèque', href: ROUTES.register },
];

const LEGAL_LINKS = [
  { label: 'Mentions légales', href: ROUTES.legal },
  { label: 'CGU', href: ROUTES.terms },
  { label: 'Politique de confidentialité', href: ROUTES.privacy },
];

function EmailIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z" />
      <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.223a1.5 1.5 0 01-.65 1.548l-.988.592a.019.019 0 00-.005.017 12.77 12.77 0 005.764 5.764c.007.003.013 0 .017-.005l.592-.988a1.5 1.5 0 011.548-.65l3.223.716A1.5 1.5 0 0118 14.852V16.5a1.5 1.5 0 01-1.5 1.5H15c-7.18 0-13-5.82-13-13V3.5z" clipRule="evenodd" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="bg-ink-950 px-4 py-16 text-slate-400">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Col 1: Brand */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Image
                src="/images/logo_nexus_reussite_nav.webp"
                alt=""
                width={40}
                height={40}
                className="h-9 w-9 object-contain"
                aria-hidden="true"
              />
              <span className="text-lg font-bold text-white">Nexus Réussite</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed">
              IA pédagogique entraînée sur le corpus officiel EAF.
              Préparation complète au Bac de Français 2026 pour les élèves
              du réseau AEFE et de Tunisie.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[var(--border-success)] bg-[var(--color-emerald-800)] px-3 py-1 text-xs font-medium text-[var(--color-emerald-300)]">
              <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              98% mention AB+ (session 2025*)
            </div>
          </div>

          {/* Col 2: Quick links */}
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">Liens rapides</p>
            <ul className="space-y-2">
              {QUICK_LINKS.map((link) => (
                <li key={link.href + link.label}>
                  <Link href={link.href} className="text-sm transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Workshops */}
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">Les ateliers</p>
            <ul className="space-y-2">
              {WORKSHOP_LINKS.map((link) => (
                <li key={link.href + link.label}>
                  <Link href={link.href} className="text-sm transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Contact & Legal */}
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">Contact &amp; Légal</p>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <EmailIcon />
                <a href="mailto:contact@nexusreussite.academy" className="transition-colors hover:text-white">
                  contact@nexusreussite.academy
                </a>
              </li>
              <li className="flex items-center gap-2">
                <PhoneIcon />
                <a href={ROUTES.whatsapp} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-white">
                  {process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '+216 99 19 28 29'} (WhatsApp)
                </a>
              </li>
              <li className="flex items-center gap-2">
                <ClockIcon />
                <span>Lun–Sam, 9h–18h (Tunis)</span>
              </li>
            </ul>
            <ul className="mt-4 space-y-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
          © 2026 Nexus Réussite. Tous droits réservés. — Préparation EAF Session 2026.
        </div>
      </div>
    </footer>
  );
}
