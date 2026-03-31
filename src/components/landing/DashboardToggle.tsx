'use client';

import { useState } from 'react';

type View = 'student' | 'parent';

export function DashboardToggle() {
  const [view, setView] = useState<View>('student');

  return (
    <section className="bg-page py-14 sm:py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-heading sm:text-3xl lg:text-4xl">
          Un tableau de bord pour chacun
        </h2>
        <p className="mt-3 text-center text-body">
          L&apos;élève suit sa progression, le parent garde le contrôle.
        </p>

        {/* Toggle pill */}
        <div className="mt-10 flex justify-center">
          <div className="inline-flex rounded-full bg-surface-secondary p-1">
            <button
              type="button"
              aria-pressed={view === 'student'}
              aria-label="Vue élève"
              onClick={() => setView('student')}
              className={
                'rounded-full px-6 py-2 text-sm font-medium transition-colors ' +
                (view === 'student'
                  ? 'bg-brand text-white shadow'
                  : 'text-body hover:text-heading')
              }
            >
              Élève
            </button>
            <button
              type="button"
              aria-pressed={view === 'parent'}
              aria-label="Vue parent"
              onClick={() => setView('parent')}
              className={
                'rounded-full px-6 py-2 text-sm font-medium transition-colors ' +
                (view === 'parent'
                  ? 'bg-brand text-white shadow'
                  : 'text-body hover:text-heading')
              }
            >
              Parent
            </button>
          </div>
        </div>

        {/* Panels */}
        <div className="relative mt-10">
          {/* Student panel */}
          <div
            className={
              'rounded-2xl bg-surface p-6 shadow-lg transition-opacity duration-300 sm:p-8 ' +
              (view === 'student' ? 'opacity-100' : 'pointer-events-none absolute inset-0 opacity-0')
            }
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-subtle text-sm font-bold text-brand">
                SL
              </div>
              <div>
                <p className="font-semibold text-heading">Sarah L.</p>
                <p className="text-sm text-muted-foreground">Première — Français EAF</p>
              </div>
            </div>

            {/* Goal */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-body">Objectif : 14/20</span>
                <span className="font-semibold text-brand">67 %</span>
              </div>
              <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-surface-secondary">
                <div
                  className="h-full rounded-full bg-brand transition-all"
                  style={{ width: '67%' }}
                />
              </div>
            </div>

            {/* Counters grid */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-brand-subtle p-4 text-center">
                <p className="text-2xl font-bold text-brand">12</p>
                <p className="text-sm text-body">Corrections</p>
              </div>
              <div className="rounded-xl bg-brand-subtle p-4 text-center">
                <p className="text-2xl font-bold text-brand">5</p>
                <p className="text-sm text-body">Oraux</p>
              </div>
              <div className="rounded-xl bg-success-subtle p-4 text-center">
                <p className="text-2xl font-bold text-success">+2.3 pts</p>
                <p className="text-sm text-body">Progression</p>
              </div>
            </div>

            {/* Next session card */}
            <div className="mt-6 rounded-xl border border-[var(--border-primary)] bg-brand-subtle/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand">
                Prochaine séance
              </p>
              <p className="mt-1 font-medium text-heading">La Boétie</p>
              <p className="text-sm italic text-body">
                Défendre et entretenir la liberté
              </p>
            </div>
          </div>

          {/* Parent panel */}
          <div
            className={
              'rounded-2xl bg-surface p-6 shadow-lg transition-opacity duration-300 sm:p-8 ' +
              (view === 'parent' ? 'opacity-100' : 'pointer-events-none absolute inset-0 opacity-0')
            }
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-subtle text-sm font-bold text-brand">
                SL
              </div>
              <div>
                <p className="font-semibold text-heading">Sarah L.</p>
                <p className="text-sm text-muted-foreground">Suivi parental</p>
              </div>
            </div>

            {/* Mini bar chart SVG */}
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium text-body">Évolution des notes</p>
              <svg
                viewBox="0 0 200 80"
                className="h-20 w-full max-w-xs"
                aria-label="Graphique des notes : 11, 12, 13.5, 14"
                role="img"
              >
                {/* Bars — max value 20, max height 60px, y offset 10 */}
                <rect x="15" y={10 + 60 * (1 - 11 / 20)} width="30" height={60 * (11 / 20)} rx="4" className="fill-brand-subtle" />
                <rect x="60" y={10 + 60 * (1 - 12 / 20)} width="30" height={60 * (12 / 20)} rx="4" className="fill-brand-subtle" />
                <rect x="105" y={10 + 60 * (1 - 13.5 / 20)} width="30" height={60 * (13.5 / 20)} rx="4" className="fill-brand-subtle" />
                <rect x="150" y={10 + 60 * (1 - 14 / 20)} width="30" height={60 * (14 / 20)} rx="4" className="fill-brand" />
                {/* Labels */}
                <text x="30" y="78" textAnchor="middle" className="fill-muted-foreground text-[9px]">11</text>
                <text x="75" y="78" textAnchor="middle" className="fill-muted-foreground text-[9px]">12</text>
                <text x="120" y="78" textAnchor="middle" className="fill-muted-foreground text-[9px]">13.5</text>
                <text x="165" y="78" textAnchor="middle" className="fill-body text-[9px] font-bold">14</text>
              </svg>
            </div>

            {/* Last correction badge */}
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-success-subtle px-4 py-2 text-sm">
              <span className="font-semibold text-success">14/20</span>
              <span className="text-body">Dissertation</span>
              <span className="text-xs text-muted-foreground">Hier</span>
            </div>

            {/* Grammar gain */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-body">Grammaire&nbsp;:</span>
              <span className="font-bold text-success">+20 %</span>
            </div>

            {/* Next step */}
            <p className="mt-4 text-sm italic text-muted-foreground">
              Continuer l&apos;entraînement oral pour consolider la fluidité d&apos;expression.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
