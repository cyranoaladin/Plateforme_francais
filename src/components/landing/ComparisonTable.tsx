import React from 'react';

interface Row {
  label: string;
  chatgpt: string;
  nexus: string;
}

const rows: Row[] = [
  {
    label: 'Sources',
    chatgpt: 'Hallucinations fréquentes, pas de sources vérifiables',
    nexus: 'Corpus certifié EAF, chaque réponse sourcée',
  },
  {
    label: 'Correction',
    chatgpt: 'Feedback générique, pas de barème',
    nexus: 'Correction critériée sur le barème officiel EAF',
  },
  {
    label: 'Barème EAF',
    chatgpt: 'Ne connaît pas le barème',
    nexus: 'Intégré nativement, mis à jour chaque session',
  },
  {
    label: 'Anti-copie',
    chatgpt: 'Génère du contenu copiable',
    nexus: 'Anti-copie par design : tu produis, Nexus corrige',
  },
  {
    label: 'Rapidité',
    chatgpt: 'Réponse instantanée mais non fiable',
    nexus: 'Correction sourcée en 3 minutes',
  },
  {
    label: 'Suivi',
    chatgpt: 'Aucun historique ni suivi',
    nexus: 'Tableau de bord élève + parent en temps réel',
  },
  {
    label: 'Expertise',
    chatgpt: 'IA généraliste, pas spécialisée',
    nexus: 'Conçu par des enseignants de Français',
  },
];

export default function ComparisonTable() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-center text-3xl font-bold text-gray-900 sm:text-4xl">
          ChatGPT vs Nexus
        </h2>
        <p className="mt-3 text-center text-gray-600">
          Une IA généraliste ne remplace pas un outil conçu pour l&apos;EAF.
        </p>

        {/* Desktop table */}
        <div className="mt-12 hidden md:block">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr>
                <th className="border-b border-gray-200 pb-3 pr-4 font-semibold text-gray-500">
                  Critère
                </th>
                <th className="border-b border-gray-200 pb-3 pr-4 font-semibold text-red-600">
                  ChatGPT
                </th>
                <th className="border-b border-gray-200 pb-3 font-semibold text-violet-600">
                  Nexus
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-gray-100">
                  <td className="py-4 pr-4 font-medium text-gray-900">{row.label}</td>
                  <td className="py-4 pr-4 text-gray-500">{row.chatgpt}</td>
                  <td className="py-4 font-medium text-gray-900">{row.nexus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile accordion */}
        <div className="mt-10 space-y-3 md:hidden">
          {rows.map((row) => (
            <details
              key={row.label}
              className="group rounded-xl border border-gray-200 bg-gray-50"
            >
              <summary className="cursor-pointer list-none px-4 py-3 font-medium text-gray-900">
                <span className="flex items-center justify-between">
                  {row.label}
                  <svg
                    className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-open:rotate-180"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              </summary>
              <div className="space-y-2 px-4 pb-4 text-sm">
                <div>
                  <span className="font-semibold text-red-600">ChatGPT :&nbsp;</span>
                  <span className="text-gray-600">{row.chatgpt}</span>
                </div>
                <div>
                  <span className="font-semibold text-violet-600">Nexus :&nbsp;</span>
                  <span className="text-gray-900">{row.nexus}</span>
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
