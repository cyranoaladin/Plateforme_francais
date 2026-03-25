'use client';

import Link from 'next/link';

const FOOTER_COPY = {
  brand: 'Plateforme Français',
  copyright: '© 2024 Plateforme Français. Tous droits réservés.',
  links: {
    product: {
      label: 'Produit',
      items: [
        { label: 'Fonctionnalités', href: '#method' },
        { label: 'Tarification', href: '#pricing' },
        { label: 'Sécurité', href: '#' },
      ],
    },
    company: {
      label: 'Entreprise',
      items: [
        { label: 'À propos', href: '#' },
        { label: 'Blog', href: '#' },
        { label: 'Careers', href: '#' },
      ],
    },
    legal: {
      label: 'Légal',
      items: [
        { label: 'Confidentialité', href: '#' },
        { label: 'Conditions', href: '#' },
        { label: 'Cookies', href: '#' },
      ],
    },
  },
} as const;

export function PremiumFooter() {
  return (
    <footer className="border-t border-slate-200/60 bg-gradient-to-b from-white to-slate-50 px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-6xl">
        {/* Top Section */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <h3 className="font-playfair text-lg font-700 text-slate-900">
              {FOOTER_COPY.brand}
            </h3>
            <p className="mt-3 text-sm text-slate-600">
              Plateforme d'apprentissage du français pour parents responsables et
              élèves ambitieux.
            </p>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_COPY.links).map(([key, section]) => (
            <div key={key}>
              <h4 className="font-semibold text-slate-900">
                {section.label}
              </h4>
              <ul className="mt-4 space-y-3">
                {section.items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-sm text-slate-600 transition-colors hover:text-indigo-600"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="my-8 border-t border-slate-200/60 sm:my-10" />

        {/* Bottom Section */}
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-slate-500">{FOOTER_COPY.copyright}</p>
          <div className="flex gap-4">
            <a
              href="#"
              className="text-sm text-slate-600 transition-colors hover:text-indigo-600"
            >
              Twitter
            </a>
            <a
              href="#"
              className="text-sm text-slate-600 transition-colors hover:text-indigo-600"
            >
              LinkedIn
            </a>
            <a
              href="#"
              className="text-sm text-slate-600 transition-colors hover:text-indigo-600"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
