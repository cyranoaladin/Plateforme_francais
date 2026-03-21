import React from 'react';

interface Step {
  title: string;
  description: string;
  badge?: string;
  icon: React.ReactNode;
}

const steps: Step[] = [
  {
    title: 'Diagnostic express',
    description:
      'Un test rapide identifie tes forces et lacunes pour personnaliser ton parcours.',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  {
    title: 'Tu produis, pas l&apos;IA',
    description:
      'Tu rédiges toi-même. Nexus ne génère jamais de contenu à ta place.',
    badge: 'Anti-copie par design',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
      </svg>
    ),
  },
  {
    title: 'Correction sourcée en 3 min',
    description:
      'Feedback détaillé avec le barème EAF officiel et des sources vérifiées.',
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export function MethodSteps() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-center text-3xl font-bold text-gray-900 sm:text-4xl">
          La méthode en 3 étapes
        </h2>
        <p className="mt-3 text-center text-gray-600">
          Simple, efficace, sans triche.
        </p>

        {/* Desktop: horizontal with dotted connector */}
        <div className="mt-14 hidden items-start justify-between md:flex">
          {steps.map((step, i) => (
            <div key={step.title} className="flex flex-1 items-start">
              <div className="flex flex-col items-center text-center">
                {/* Icon circle */}
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                  {step.icon}
                </div>

                <h3
                  className="mt-4 text-base font-bold text-gray-900"
                  dangerouslySetInnerHTML={{ __html: step.title }}
                />

                {step.badge && (
                  <span className="mt-2 inline-block rounded-full bg-violet-100 px-3 py-0.5 text-xs font-semibold text-violet-700">
                    {step.badge}
                  </span>
                )}

                <p className="mt-2 max-w-[200px] text-sm text-gray-600">
                  {step.description}
                </p>
              </div>

              {/* Dotted connector */}
              {i < steps.length - 1 && (
                <div className="mt-7 flex flex-1 items-center px-2">
                  <div className="h-0 w-full border-t-2 border-dashed border-violet-200" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile: vertical */}
        <div className="mt-10 space-y-8 md:hidden">
          {steps.map((step, i) => (
            <div key={step.title} className="flex gap-4">
              {/* Icon + vertical line */}
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                  {step.icon}
                </div>
                {i < steps.length - 1 && (
                  <div className="mt-2 h-full w-0 border-l-2 border-dashed border-violet-200" />
                )}
              </div>

              {/* Content */}
              <div className="pb-2">
                <h3
                  className="text-base font-bold text-gray-900"
                  dangerouslySetInnerHTML={{ __html: step.title }}
                />
                {step.badge && (
                  <span className="mt-1 inline-block rounded-full bg-violet-100 px-3 py-0.5 text-xs font-semibold text-violet-700">
                    {step.badge}
                  </span>
                )}
                <p className="mt-1 text-sm text-gray-600">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
