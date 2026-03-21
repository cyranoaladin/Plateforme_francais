import React from 'react';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';

interface Plan {
  name: string;
  price: string;
  period: string;
  featured: boolean;
  features: string[];
}

const plans: Plan[] = [
  {
    name: 'Freemium',
    price: '0 TND',
    period: '',
    featured: false,
    features: [
      'Diagnostic express initial',
      '3 corrections par mois',
      'Accès fiches de révision',
      'Tableau de bord basique',
    ],
  },
  {
    name: 'Premium',
    price: '99 TND',
    period: '/mois',
    featured: true,
    features: [
      'Corrections illimitées',
      'Simulations d&apos;oral avec feedback',
      'Atelier Langue complet',
      'Tableau de bord élève + parent',
      'Sources vérifiées EAF',
      'Suivi de progression avancé',
    ],
  },
  {
    name: 'Masterium',
    price: '129 TND',
    period: '/mois',
    featured: false,
    features: [
      'Tout Premium inclus',
      'Séances de coaching en visio',
      'Corrections prioritaires',
      'Plan de révision personnalisé',
      'Accès anticipé aux nouveautés',
      'Support prioritaire WhatsApp',
    ],
  },
];

interface FaqItem {
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    question: 'Puis-je changer de formule en cours de mois ?',
    answer:
      'Oui, vous pouvez passer d&apos;une formule à l&apos;autre à tout moment. Le changement prend effet immédiatement et le prorata est calculé automatiquement.',
  },
  {
    question: 'Y a-t-il un engagement minimum ?',
    answer:
      'Aucun engagement. Vous pouvez résilier à tout moment depuis votre espace, en un clic. Pas de frais cachés.',
  },
  {
    question: 'Le Freemium est-il vraiment gratuit ?',
    answer:
      'Oui, le Freemium est gratuit pour toujours. Pas de carte bancaire requise, pas de période d&apos;essai. Vous pouvez l&apos;utiliser aussi longtemps que vous le souhaitez.',
  },
];

export function PricingSection() {
  return (
    <section id="tarifs" className="bg-gray-50 py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl lg:text-4xl">
          Tarifs simples, résultats concrets
        </h2>
        <p className="mt-3 text-center text-gray-600">
          Choisissez la formule adaptée à vos objectifs.
        </p>

        {/* Plan cards */}
        <div className="mt-12 flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory sm:grid sm:grid-cols-2 sm:gap-8 sm:overflow-visible sm:pb-0 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={
                'relative flex min-w-[280px] flex-col rounded-2xl bg-white p-6 shadow-md snap-center sm:min-w-0 ' +
                (plan.featured ? 'ring-2 ring-sapphire-700 sm:border-2 sm:border-sapphire-700 sm:ring-0 shadow-lg' : 'border border-gray-200')
              }
            >
              {plan.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-sapphire-700 px-4 py-1 text-xs font-semibold text-white">
                  &#11088; Recommandé
                </span>
              )}

              <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-gray-900">{plan.price}</span>
                {plan.period && (
                  <span className="text-sm text-gray-500">{plan.period}</span>
                )}
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-sapphire-700"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span dangerouslySetInnerHTML={{ __html: feature }} />
                  </li>
                ))}
              </ul>

              <Link
                href={ROUTES.register}
                className={
                  'mt-6 block rounded-xl py-3 text-center text-sm font-semibold transition-colors ' +
                  (plan.featured
                    ? 'bg-sapphire-700 text-white hover:bg-sapphire-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200')
                }
              >
                {plan.price === '0 TND' ? 'Commencer gratuitement' : 'Choisir ' + plan.name}
              </Link>

              <p className="mt-3 text-center text-xs text-gray-500">
                Sans engagement &bull; Résiliation immédiate
              </p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mx-auto mt-16 max-w-2xl">
          <h3 className="text-center text-xl font-bold text-gray-900">Questions fréquentes</h3>
          <div className="mt-6 space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-xl border border-gray-200 bg-white"
              >
                <summary className="cursor-pointer list-none px-5 py-4 font-medium text-gray-900">
                  <span className="flex items-center justify-between">
                    {faq.question}
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
                <p
                  className="px-5 pb-4 text-sm text-gray-600"
                  dangerouslySetInnerHTML={{ __html: faq.answer }}
                />
              </details>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <p className="mt-10 text-center text-sm text-gray-500">
          Pas encore prêt ?{' '}
          <Link
            href={ROUTES.register}
            className="font-medium text-sapphire-700 underline hover:text-sapphire-700"
          >
            Le Freemium est gratuit pour toujours &rarr;
          </Link>
        </p>
      </div>
    </section>
  );
}
