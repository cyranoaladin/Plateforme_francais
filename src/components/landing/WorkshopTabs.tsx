/**
 * WorkshopTabs — Interactive tabbed view of the 4 EAF workshops.
 * Dependencies: none (touch swipe implemented manually)
 */
'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

interface Workshop {
  id: string;
  label: string;
  badge: string | null;
  highlights: string[];
  cta: string;
  href: string;
}

const WORKSHOPS: Workshop[] = [
  {
    id: 'oral',
    label: 'Oral',
    badge: 'Recommandé',
    highlights: [
      'Tirage au sort réel des œuvres, comme au bac',
      'Passage enregistrable, noté /2 /8 /2 /8 officiel',
      'Bilan PDF avec points forts et axes de progrès',
    ],
    cta: 'Simuler un oral gratuit →',
    href: ROUTES.registerOral,
  },
  {
    id: 'ecrit',
    label: 'Écrit',
    badge: null,
    highlights: [
      'Sujets issus des annales 2015-2025, conformes au BO',
      'Dépôt de copie (photo ou PDF) — correction en 3 min',
      'Feedback rubrique par rubrique avec note /20',
    ],
    cta: 'Corriger une dissertation →',
    href: ROUTES.registerEcrit,
  },
  {
    id: 'langue',
    label: 'Langue',
    badge: null,
    highlights: [
      'Exercices ciblés sur TES erreurs réelles, pas du générique',
      'Règles du BO 2026 rappelées en contexte',
      'Progression mesurée compétence par compétence',
    ],
    cta: 'Travailler ma grammaire →',
    href: ROUTES.registerLangue,
  },
  {
    id: 'quiz',
    label: 'Quiz',
    badge: null,
    highlights: [
      'Questions sur toutes les œuvres du programme officiel',
      'Niveau adaptatif — plus tu réussis, plus c\'est exigeant',
      'Suivi des erreurs pour cibler tes révisions',
    ],
    cta: 'Tester mes connaissances →',
    href: ROUTES.registerQuiz,
  },
];

function CheckIcon() {
  return (
    <svg className="mt-0.5 h-5 w-5 shrink-0 text-sapphire-700" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
  );
}

export function WorkshopTabs() {
  const [active, setActive] = useState('oral');
  const touchStart = useRef<number | null>(null);

  const activeIndex = WORKSHOPS.findIndex((w) => w.id === active);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      const next = diff > 0 ? activeIndex + 1 : activeIndex - 1;
      if (next >= 0 && next < WORKSHOPS.length) {
        setActive(WORKSHOPS[next].id);
      }
    }
    touchStart.current = null;
  };

  return (
    <section id="ateliers" className="bg-white px-4 py-20" aria-label="Les 4 ateliers EAF">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center text-3xl font-bold leading-tight text-gray-900 sm:text-4xl">
          4 ateliers pour maîtriser chaque épreuve
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-base text-gray-500">
          Chaque atelier reproduit les conditions réelles de l&apos;examen.
        </p>

        {/* Tab list */}
        <div
          role="tablist"
          aria-label="Ateliers disponibles"
          className="mt-8 flex gap-2 overflow-x-auto pb-1 scrollbar-none"
        >
          {WORKSHOPS.map((w) => (
            <button
              key={w.id}
              role="tab"
              aria-selected={active === w.id}
              aria-controls={`panel-${w.id}`}
              id={`tab-${w.id}`}
              onClick={() => setActive(w.id)}
              className={`flex shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                active === w.id
                  ? 'bg-sapphire-700 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {w.label}
              {w.badge && (
                <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-semibold text-yellow-900">
                  {w.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <div
          className="relative mt-8 min-h-[220px]"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {WORKSHOPS.map((w) => {
            const isActive = active === w.id;
            return (
              <div
                key={w.id}
                role="tabpanel"
                id={`panel-${w.id}`}
                aria-labelledby={`tab-${w.id}`}
                aria-hidden={!isActive}
                className={`transition-opacity duration-200 ${
                  isActive ? 'opacity-100 relative' : 'pointer-events-none absolute inset-0 opacity-0'
                }`}
              >
                <ul className="mb-8 space-y-3">
                  {w.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckIcon />
                      <span className="text-base text-gray-700">{h}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={w.href}
                  tabIndex={isActive ? 0 : -1}
                  className="inline-flex items-center gap-2 rounded-full bg-sapphire-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-sapphire-700"
                  aria-label={`${w.cta} — atelier ${w.label}`}
                >
                  {w.cta}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
