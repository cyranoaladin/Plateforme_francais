import Link from 'next/link';
import { ArrowRight, CheckCircle2, Clock3, ShieldCheck, Sparkles, TriangleAlert, XCircle } from 'lucide-react';
import { resolvePublicPaymentStatus } from '@/lib/payments/clictopay';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function pickValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}

const EDITORIAL_HEADING = {
  fontFamily: "var(--font-display)",
};

export default async function PaiementConfirmationPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const orderRef = pickValue(params.orderRef) ?? pickValue(params.orderNumber) ?? pickValue(params.ref);
  const orderId = pickValue(params.orderId) ?? pickValue(params.order_id);

  const payment = await resolvePublicPaymentStatus({
    orderRef: orderRef ?? undefined,
    orderId: orderId ?? undefined,
  });

  const statusUrl = orderRef
    ? `/api/v1/payments/clictopay/public-status?orderRef=${encodeURIComponent(orderRef)}`
    : orderId
      ? `/api/v1/payments/clictopay/public-status?orderId=${encodeURIComponent(orderId)}`
      : null;

  const refreshHref = orderRef
    ? `/paiement/confirmation?orderRef=${encodeURIComponent(orderRef)}`
    : orderId
      ? `/paiement/confirmation?orderId=${encodeURIComponent(orderId)}`
      : '/paiement/confirmation';

  const status = payment?.status ?? 'UNKNOWN';

  const statusMap = {
    ACCEPTED: {
      label: 'Paiement accepté',
      icon: CheckCircle2,
      chip: 'border-[#d6e8df] bg-[var(--success-bg)] text-[var(--teal)]',
      panel: 'border-[#d6e8df] bg-[var(--success-bg)]',
      title: 'Le plan est en cours d\u2019activation sur ton espace.',
      body: 'Ton paiement a été validé. Tu peux retourner dans le produit et poursuivre l\u2019onboarding ou reprendre ton travail là où tu l\u2019avais laissé.',
      steps: ['Vérifier ton tableau de bord', 'Relancer l\u2019atelier voulu', 'Contrôler le plan actif dans la page tarifaire'],
    },
    PENDING: {
      label: 'Paiement en cours de confirmation',
      icon: Clock3,
      chip: 'border-[#efd9b4] bg-[#fff7ea] text-[var(--gold-deep)]',
      panel: 'border-[#efd9b4] bg-[#fff7ea]',
      title: 'La transaction est revenue, mais l\u2019activation n\u2019est pas encore fermée.',
      body: 'Le prestataire de paiement traite encore la confirmation finale. Ce cas est normal quand la redirection revient plus vite que la mise à jour interne.',
      steps: ['Rafraîchir cette page dans quelques secondes', 'Vérifier ensuite la page tarifaire', 'Revenir au dashboard si l\u2019activation apparaît'],
    },
    REFUSED: {
      label: 'Paiement refusé',
      icon: XCircle,
      chip: 'border-[#f1c8c0] bg-[var(--error-bg)] text-[#b24838]',
      panel: 'border-[#f1c8c0] bg-[var(--error-bg)]',
      title: 'La transaction n\u2019a pas été validée.',
      body: 'Aucun abonnement n\u2019est activé pour le moment. Tu peux relancer un essai depuis la page tarifaire ou revenir sur une offre existante.',
      steps: ['Vérifier les informations de paiement', 'Relancer la souscription depuis la page tarifaire', 'Contacter le support si le refus se répète'],
    },
    ERROR: {
      label: 'Erreur de paiement',
      icon: TriangleAlert,
      chip: 'border-[#f1c8c0] bg-[var(--error-bg)] text-[#b24838]',
      panel: 'border-[#f1c8c0] bg-[var(--error-bg)]',
      title: 'Le retour du paiement est incomplet ou contradictoire.',
      body: 'La redirection a bien atteint la plateforme, mais le statut final reste incohérent. Mieux vaut vérifier avant toute nouvelle tentative.',
      steps: ['Recharger cette page une fois', 'Vérifier la page tarifaire', 'Contacter le support avec la référence de commande'],
    },
    UNKNOWN: {
      label: 'Vérification en cours',
      icon: Sparkles,
      chip: 'border-[var(--border-sand)] bg-[#fffaf4] text-[var(--text-warm)]',
      panel: 'border-[var(--border-sand)] bg-[#fffaf4]',
      title: 'Le retour est bien reçu, mais le statut définitif n\u2019est pas encore exposé.',
      body: 'Si tu as déjà réglé la transaction, il suffit souvent de rafraîchir puis de vérifier ton espace quelques secondes plus tard.',
      steps: ['Rafraîchir cette page', 'Vérifier la page tarifaire', 'Se connecter puis contrôler le dashboard'],
    },
  } as const;

  const current = statusMap[status as keyof typeof statusMap] ?? statusMap.UNKNOWN;
  const StatusIcon = current.icon;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f6efe4_0%,#fbf7f0_46%,#fffdfa_100%)] px-4 py-8 md:px-6 md:py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[var(--navy)] px-6 py-8 text-[#f6efe4] shadow-[var(--shadow-xl)] md:px-8 md:py-10 lg:px-10">
          <div className="absolute inset-y-0 right-[-8%] hidden w-[36%] rounded-full bg-[radial-gradient(circle_at_center,_rgba(126,212,194,0.24),_transparent_72%)] blur-2xl lg:block" />
          <div className="absolute left-[-4%] top-[-22%] h-40 w-40 rounded-full bg-[rgba(216,163,99,0.15)] blur-3xl" />

          <div className="relative grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[var(--border-warm)]">
                <ShieldCheck className="h-4 w-4" />
                Retour paiement ClicToPay
              </div>
              <h1 style={EDITORIAL_HEADING} className="mt-5 text-4xl leading-tight tracking-[-0.03em] text-white md:text-5xl lg:text-6xl">
                Paiement confirmé
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#dfe8f0] md:text-base">
                La transaction est revenue sur la plateforme. Cet écran t&apos;indique immédiatement si ton plan est actif, en attente, ou s&apos;il faut relancer proprement.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className={`rounded-[24px] border px-4 py-4 ${current.chip}`}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">Statut</p>
                <p className="mt-2 text-xl font-semibold">{current.label}</p>
              </div>
              <div className="rounded-[24px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--border-warm)]">Référence</p>
                <p className="mt-2 truncate text-sm font-semibold text-white">{orderRef ?? orderId ?? 'Non transmise'}</p>
              </div>
              <div className="rounded-[24px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--border-warm)]">API publique</p>
                <p className="mt-2 text-sm font-semibold text-white">{statusUrl ? 'Disponible' : 'Aucune référence'}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="space-y-6">
            <section className={`rounded-[24px] border p-6 shadow-[var(--shadow-md)] md:p-7 ${current.panel}`}>
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-[var(--navy)]">
                  <StatusIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--accent-bronze)]">Lecture du retour</p>
                  <h2 style={EDITORIAL_HEADING} className="mt-2 text-3xl leading-tight tracking-[-0.02em] text-[var(--navy)]">
                    {current.title}
                  </h2>
                </div>
              </div>
              <p className="mt-5 text-sm leading-7 text-[var(--navy-mid)]">{current.body}</p>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {current.steps.map((step, index) => (
                  <div key={step} className="rounded-[22px] border border-white/60 bg-white/70 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[var(--accent-bronze)]">Étape {index + 1}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--navy)]">{step}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[24px] border border-[var(--border-light)] bg-[linear-gradient(180deg,#fffdfa_0%,#fbf5ec_100%)] p-6 shadow-[var(--shadow-md)] md:p-7">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--accent-bronze)]">Actions utiles</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={status === 'ACCEPTED' ? '/' : '/pricing'}
                  className="inline-flex items-center gap-2 rounded-[16px] bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#22486b]"
                >
                  {status === 'ACCEPTED' ? 'Accéder au dashboard' : 'Retourner aux offres'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={refreshHref}
                  className="inline-flex items-center gap-2 rounded-[16px] border border-[var(--border-sand)] bg-[#fffaf4] px-5 py-3 text-sm font-semibold text-[var(--navy)] transition hover:border-[var(--navy)]/25 hover:bg-white"
                >
                  Rafraîchir le statut
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-[16px] border border-[var(--border-sand)] bg-white px-5 py-3 text-sm font-semibold text-[var(--navy)] transition hover:border-[var(--navy)]/25"
                >
                  Se connecter
                </Link>
              </div>
            </section>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[24px] border border-[#e8dcc8] bg-[#f8f1e7] p-5 shadow-[var(--shadow-md)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--accent-bronze)]">Trace technique</p>
              <div className="mt-4 space-y-3 text-sm text-[var(--navy-mid)]">
                <div className="rounded-[16px] border border-[var(--surface-sand)] bg-white/80 p-4">
                  <p className="font-semibold text-[var(--navy)]">Référence de commande</p>
                  <p className="mt-2 break-all">{orderRef ?? orderId ?? 'Aucune référence transmise dans l\u2019URL.'}</p>
                </div>
                {statusUrl && (
                  <div className="rounded-[16px] border border-[var(--surface-sand)] bg-white/80 p-4">
                    <p className="font-semibold text-[var(--navy)]">Endpoint de vérification</p>
                    <p className="mt-2 break-all font-mono text-xs text-[#5b6f82]">{statusUrl}</p>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-[24px] border border-[#d7e6e1] bg-[var(--success-bg)] p-5 shadow-[var(--shadow-md)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--teal)]">Ce qui suit</p>
              <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--navy-mid)]">
                <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--teal)]" /> Le dashboard et la page tarifaire restent la source de vérité côté produit.</li>
                <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--teal)]" /> En cas de statut en attente, la situation se débloque en général sans nouvelle action bancaire.</li>
                <li className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-[var(--teal)]" /> Si le statut reste incohérent, conserve la référence et passe par le support.</li>
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
