import React from 'react';
import Link from 'next/link';
import { PUBLIC_PLAN_OFFERS } from '@/lib/billing/public-offers';
import { ROUTES } from '@/lib/routes';

interface FaqItem {
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    question: 'Puis-je changer de formule en cours de mois ?',
    answer:
      'Oui. Après validation du règlement, ton nouvel accès est activé avec un code correspondant au plan choisi.',
  },
  {
    question: 'Y a-t-il un engagement minimum ?',
    answer:
      'Les plans payants sont mensuels. Le renouvellement n’est pas présenté comme un checkout automatique sur le site tant que ce parcours n’est pas actif.',
  },
  {
    question: 'Le Freemium est-il vraiment gratuit ?',
    answer:
      'Oui. Tu peux créer ton compte et utiliser le plan Freemium sans paiement, puis passer à un plan payant plus tard via un code d’activation.',
  },
  {
    question: 'Comment activer un plan payant ?',
    answer:
      'Le go-live actuel fonctionne par virement bancaire ou règlement en espèces. L’équipe Nexus t’envoie ensuite un code d’activation à saisir sur la plateforme.',
  },
];

const PRICING_COPY = {
  heading: 'Tarifs simples, résultats concrets',
  intro: 'Trois plans clairs, des quotas réels et un parcours d’activation fidèle au go-live.',
  recommended: 'Recommandé',
  faqHeading: 'Questions fréquentes',
  bottomLead: 'Besoin d’un plan payant ?',
  bottomCta: 'Commence en Freemium puis active Premium ou Masterium par code →',
} as const;

export function PricingSection() {
  return (
    <section id="tarifs" className="bg-page py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center text-2xl font-bold text-heading sm:text-3xl lg:text-4xl">
          {PRICING_COPY.heading}
        </h2>
        <p className="mt-3 text-center text-body">
          {PRICING_COPY.intro}
        </p>

        {/* Plan cards */}
        <div className="mt-12 flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory sm:grid sm:grid-cols-2 sm:gap-8 sm:overflow-visible sm:pb-0 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
          {PUBLIC_PLAN_OFFERS.map((plan) => (
            <div
              key={plan.publicId}
              className={
                'relative flex min-w-[280px] flex-col rounded-2xl bg-surface p-6 shadow-md snap-center sm:min-w-0 ' +
                (plan.highlighted ? 'ring-2 ring-brand sm:border-2 sm:border-brand sm:ring-0 shadow-lg' : 'border border-[var(--border-default)]')
              }
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand px-4 py-1 text-xs font-semibold text-white">
                  {`⭐ ${PRICING_COPY.recommended}`}
                </span>
              )}

              <h3 className="text-lg font-bold text-heading">{plan.title}</h3>
              <p className="mt-2 text-sm text-body">{plan.tagline}</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-heading">{plan.priceTnd}</span>
                {plan.period && (
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                )}
              </div>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.landingBullets.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-body">
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-brand"
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
                href={plan.publicId === 'FREEMIUM' ? ROUTES.register : '/pricing#activation-et-paiement'}
                className={
                  'mt-6 block rounded-xl py-3 text-center text-sm font-semibold transition-colors ' +
                  (plan.highlighted
                    ? 'bg-brand text-white hover:bg-brand-hover'
                    : 'bg-surface-secondary text-heading hover:bg-muted')
                }
              >
                {plan.publicId === 'FREEMIUM' ? 'Commencer gratuitement' : 'Choisir ' + plan.title}
              </Link>

              <p className="mt-3 text-center text-xs text-muted-foreground">
                {plan.footer}
              </p>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mx-auto mt-16 max-w-2xl">
          <h3 className="text-center text-xl font-bold text-heading">{PRICING_COPY.faqHeading}</h3>
          <div className="mt-6 space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-xl border border-[var(--border-default)] bg-surface"
              >
                <summary className="cursor-pointer list-none px-5 py-4 font-medium text-heading">
                  <span className="flex items-center justify-between">
                    {faq.question}
                    <svg
                      className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
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
                  className="px-5 pb-4 text-sm text-body"
                  dangerouslySetInnerHTML={{ __html: faq.answer }}
                />
              </details>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <p className="mt-10 text-center text-sm text-muted-foreground">
          {`${PRICING_COPY.bottomLead} `}
          <Link
            href={ROUTES.register}
            className="font-medium text-brand underline hover:text-brand-hover"
          >
            {PRICING_COPY.bottomCta}
          </Link>
        </p>
      </div>
    </section>
  );
}
