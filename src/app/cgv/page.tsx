import Link from 'next/link';
import { ArrowLeft, ShoppingCart, Scale } from 'lucide-react';

export const metadata = {
  title: 'Conditions Générales de Vente — Nexus Réussite',
  description: 'Conditions générales de vente de Nexus EAF',
};

const CGV_SECTIONS = [
  {
    title: '1. Objet',
    content:
      'Les présentes CGV régissent les conditions de vente des abonnements proposés par Nexus Réussite sur la plateforme eaf.nexusreussite.academy.',
  },
  {
    title: '2. Plans et tarifs',
    content: null,
    table: [
      { plan: 'Découverte (Freemium)', price: 'Gratuit' },
      { plan: 'Régulier (Premium)', price: '99 TND/mois' },
      { plan: 'Intensif (Masterium)', price: '129 TND/mois' },
    ],
    note: 'Tous les prix sont indiqués TTC en Dinar tunisien (TND).',
  },
  {
    title: '3. Modalités de paiement',
    content:
      'Le paiement s\u2019effectue uniquement par virement bancaire ou en espèces, puis via code d\u2019activation transmis par l\u2019administration. Aucun paiement en ligne n\u2019est actif au lancement.',
  },
  {
    title: '4. Activation de l\u2019abonnement',
    content:
      'L\u2019abonnement est activé immédiatement après validation du paiement ou saisie du code d\u2019activation.',
  },
  {
    title: '5. Durée et renouvellement',
    content:
      'Les abonnements mensuels sont valables 30 jours. Le renouvellement n\u2019est pas automatique. L\u2019utilisateur est notifié 7 jours avant l\u2019expiration de son abonnement.',
  },
  {
    title: '6. Droit de rétractation',
    content:
      'Conformément à la législation tunisienne, l\u2019utilisateur dispose d\u2019un délai de 7 jours à compter de la souscription pour exercer son droit de rétractation, sans avoir à justifier de motif.',
  },
  {
    title: '7. Procédure de remboursement',
    content:
      'Les remboursements sont effectués sous 14 jours ouvrés par virement vers le compte d\u2019origine. Pour toute demande, contactez support@nexusreussite.academy.',
  },
  {
    title: '8. Résiliation',
    content:
      'L\u2019utilisateur peut résilier à tout moment depuis son espace ou en contactant le support. L\u2019accès reste actif jusqu\u2019à la fin de la période payée. Les données sont conservées 6 mois après résiliation.',
  },
  {
    title: '9. Limitation de responsabilité',
    content:
      'Nexus Réussite ne garantit pas de résultats aux examens. Le service est un outil pédagogique complémentaire.',
  },
  {
    title: '10. Droit applicable',
    content:
      'Les présentes CGV sont soumises au droit tunisien. Tout litige sera soumis aux tribunaux compétents de Tunis.',
  },
  {
    title: '11. Contact',
    content: null,
    contacts: ['contact@nexusreussite.academy', 'support@nexusreussite.academy'],
  },
];

export default function CgvPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-surface-secondary)] text-[var(--text-heading)] [background-image:linear-gradient(180deg,rgba(255,255,255,0.74),rgba(244,239,229,1))]">
      <main className="relative mx-auto max-w-4xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between rounded-[var(--radius-xl)] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-5 py-4 shadow-[var(--shadow-md)]">
          <Link href="/" className="flex items-center gap-4">
            <img src="/images/logo_slogan_nexus.png" alt="Nexus Réussite" className="h-11 w-auto object-contain" />
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:text-[var(--c-primary)]">
            <ArrowLeft className="h-4 w-4" />
            Retour accueil
          </Link>
        </header>

        <section className="mt-10">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[var(--c-success)]">Cadre contractuel</p>
          <h1
            className="font-display mt-4 text-4xl leading-tight tracking-[-0.03em] text-[var(--c-primary)] sm:text-5xl"
          >
            Conditions générales de vente
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-8 text-[var(--text-secondary)]">
            Ces conditions encadrent la vente des abonnements Nexus Réussite EAF. En souscrivant, vous acceptez les termes ci-dessous.
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Dernière mise à jour : 25 mars 2026
          </p>
        </section>

        <div className="mt-10 space-y-6">
          {CGV_SECTIONS.map((section) => (
            <article
              key={section.title}
              className="rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-md)] md:p-8"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--c-primary)]/8 text-[var(--c-primary)]">
                  {section.title.startsWith('11') ? (
                    <Scale className="h-5 w-5" />
                  ) : (
                    <ShoppingCart className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1">
                  <h2
                    className="font-display text-2xl leading-tight tracking-[-0.02em] text-[var(--c-primary)]"
                  >
                    {section.title}
                  </h2>

                  {section.content && (
                    <p className="mt-4 text-sm leading-7 text-[var(--text-body)]">
                      {section.content}
                    </p>
                  )}

                  {section.table && (
                    <div className="mt-4 space-y-3">
                      {section.table.map((row) => (
                        <div
                          key={row.plan}
                          className="flex items-center justify-between rounded-[22px] border border-[var(--border-strong)] bg-[var(--bg-surface-secondary)] px-4 py-3"
                        >
                          <span className="text-sm font-semibold text-[var(--text-body)]">{row.plan}</span>
                          <span className="text-sm font-bold text-[var(--c-primary)]">{row.price}</span>
                        </div>
                      ))}
                      {section.note && (
                        <p className="mt-2 text-xs text-[var(--text-muted)]">{section.note}</p>
                      )}
                    </div>
                  )}

                  {section.contacts && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      {section.contacts.map((email) => (
                        <a
                          key={email}
                          href={`mailto:${email}`}
                          className="inline-flex items-center gap-2 rounded-full bg-[var(--c-primary)] px-5 py-2.5 text-sm font-bold text-[var(--bg-page)] transition-all hover:-translate-y-0.5 hover:bg-[var(--c-primary-active)]"
                        >
                          {email}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4 rounded-[24px] border border-[var(--border-strong)] bg-[var(--bg-surface)] px-6 py-5 shadow-[var(--shadow-md)]">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--c-primary)] transition-colors hover:text-[var(--c-success)]">
            <ArrowLeft className="h-4 w-4" />
            Retour à l{'\u2019'}accueil
          </Link>
          <span className="text-[var(--text-muted)]">·</span>
          <Link href="/cgu" className="text-sm font-semibold text-[var(--c-success)] transition-colors hover:underline">
            Conditions d{'\u2019'}utilisation
          </Link>
          <span className="text-[var(--text-muted)]">·</span>
          <Link href="/mentions-legales" className="text-sm font-semibold text-[var(--c-success)] transition-colors hover:underline">
            Mentions légales
          </Link>
          <span className="text-[var(--text-muted)]">·</span>
          <Link href="/politique-de-confidentialite" className="text-sm font-semibold text-[var(--c-success)] transition-colors hover:underline">
            Politique de confidentialité
          </Link>
        </div>
      </main>
    </div>
  );
}
