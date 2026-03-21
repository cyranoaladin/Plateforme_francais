'use client';

import Image from 'next/image';
import { useState } from 'react';

type View = 'student' | 'parent';

export function DashboardToggle() {
  const [view, setView] = useState<View>('student');

  return (
    <section className="bg-gray-50 py-20">
      <div className="mx-auto max-w-4xl px-4">
        <h2 className="text-center text-3xl font-bold text-gray-900 sm:text-4xl">
          Un tableau de bord pour chacun
        </h2>
        <p className="mt-3 text-center text-gray-600">
          L&apos;élève suit sa progression, le parent garde le contrôle.
        </p>

        {/* Toggle pill */}
        <div className="mt-10 flex justify-center">
          <div className="inline-flex rounded-full bg-gray-200 p-1">
            <button
              type="button"
              aria-pressed={view === 'student'}
              aria-label="Vue élève"
              onClick={() => setView('student')}
              className={
                'rounded-full px-6 py-2 text-sm font-medium transition-colors ' +
                (view === 'student'
                  ? 'bg-violet-600 text-white shadow'
                  : 'text-gray-700 hover:text-gray-900')
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
                  ? 'bg-violet-600 text-white shadow'
                  : 'text-gray-700 hover:text-gray-900')
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
              'rounded-2xl bg-white p-6 shadow-lg transition-opacity duration-300 sm:p-8 ' +
              (view === 'student' ? 'opacity-100' : 'pointer-events-none absolute inset-0 opacity-0')
            }
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                SL
              </div>
              <div>
                <p className="font-semibold text-gray-900">Sarah L.</p>
                <p className="text-sm text-gray-500">Première — Français EAF</p>
              </div>
            </div>

            {/* Goal */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">Objectif : 14/20</span>
                <span className="font-semibold text-violet-600">67 %</span>
              </div>
              <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-violet-600 transition-all"
                  style={{ width: '67%' }}
                />
              </div>
            </div>

            {/* Counters grid */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl bg-violet-50 p-4 text-center">
                <p className="text-2xl font-bold text-violet-700">12</p>
                <p className="text-sm text-gray-600">Corrections</p>
              </div>
              <div className="rounded-xl bg-violet-50 p-4 text-center">
                <p className="text-2xl font-bold text-violet-700">5</p>
                <p className="text-sm text-gray-600">Oraux</p>
              </div>
              <div className="rounded-xl bg-violet-50 p-4 text-center">
                <p className="text-2xl font-bold text-green-600">+2.3 pts</p>
                <p className="text-sm text-gray-600">Progression</p>
              </div>
            </div>

            {/* Next session card */}
            <div className="mt-6 rounded-xl border border-violet-200 bg-violet-50/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
                Prochaine séance
              </p>
              <p className="mt-1 font-medium text-gray-900">La Boétie</p>
              <p className="text-sm italic text-gray-600">
                Défendre et entretenir la liberté
              </p>
            </div>
            <Image
              src="/assets/dashboard-student.svg"
              width={640}
              height={420}
              alt="Dashboard élève Nexus Réussite"
              className="mt-4 w-full rounded-xl"
            />
          </div>

          {/* Parent panel */}
          <div
            className={
              'rounded-2xl bg-white p-6 shadow-lg transition-opacity duration-300 sm:p-8 ' +
              (view === 'parent' ? 'opacity-100' : 'pointer-events-none absolute inset-0 opacity-0')
            }
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                SL
              </div>
              <div>
                <p className="font-semibold text-gray-900">Sarah L.</p>
                <p className="text-sm text-gray-500">Suivi parental</p>
              </div>
            </div>

            {/* Mini bar chart SVG */}
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium text-gray-700">Évolution des notes</p>
              <svg
                viewBox="0 0 200 80"
                className="h-20 w-full max-w-xs"
                aria-label="Graphique des notes : 11, 12, 13.5, 14"
                role="img"
              >
                {/* Bars — max value 20, max height 60px, y offset 10 */}
                <rect x="15" y={10 + 60 * (1 - 11 / 20)} width="30" height={60 * (11 / 20)} rx="4" className="fill-violet-200" />
                <rect x="60" y={10 + 60 * (1 - 12 / 20)} width="30" height={60 * (12 / 20)} rx="4" className="fill-violet-200" />
                <rect x="105" y={10 + 60 * (1 - 13.5 / 20)} width="30" height={60 * (13.5 / 20)} rx="4" className="fill-violet-200" />
                <rect x="150" y={10 + 60 * (1 - 14 / 20)} width="30" height={60 * (14 / 20)} rx="4" className="fill-violet-600" />
                {/* Labels */}
                <text x="30" y="78" textAnchor="middle" className="fill-gray-500 text-[9px]">11</text>
                <text x="75" y="78" textAnchor="middle" className="fill-gray-500 text-[9px]">12</text>
                <text x="120" y="78" textAnchor="middle" className="fill-gray-500 text-[9px]">13.5</text>
                <text x="165" y="78" textAnchor="middle" className="fill-gray-600 text-[9px] font-bold">14</text>
              </svg>
            </div>

            {/* Last correction badge */}
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm">
              <span className="font-semibold text-green-700">14/20</span>
              <span className="text-gray-600">Dissertation</span>
              <span className="text-xs text-gray-400">Hier</span>
            </div>

            {/* Grammar gain */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-600">Grammaire&nbsp;:</span>
              <span className="font-bold text-green-600">+20 %</span>
            </div>

            {/* Next step */}
            <p className="mt-4 text-sm italic text-gray-500">
              Prochaine étape : travailler l&apos;introduction de la dissertation
            </p>
            <Image
              src="/assets/dashboard-parent.svg"
              width={640}
              height={420}
              alt="Dashboard parent Nexus Réussite"
              className="mt-4 w-full rounded-xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
