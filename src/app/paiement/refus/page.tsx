'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowRight, RotateCcw, ShieldCheck } from 'lucide-react';

const EDITORIAL_HEADING = {
  fontFamily: "var(--font-display)",
};

function PaiementRefusContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');
  const orderRef = searchParams.get('orderRef') ?? searchParams.get('orderNumber');
  const orderId = searchParams.get('orderId') ?? searchParams.get('order_id');
  const displayedRef = ref ?? orderRef ?? orderId;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f6efe4_0%,#fbf7f0_46%,#fffdfa_100%)] px-4 py-8 md:px-6 md:py-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <section className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[var(--navy)] px-6 py-8 text-[#f6efe4] shadow-[var(--shadow-xl)] md:px-8 md:py-10 lg:px-10">
          <div className="absolute inset-y-0 right-[-8%] hidden w-[36%] rounded-full bg-[radial-gradient(circle_at_center,_rgba(221,131,108,0.22),_transparent_72%)] blur-2xl lg:block" />
          <div className="absolute left-[-4%] top-[-22%] h-40 w-40 rounded-full bg-[rgba(216,163,99,0.15)] blur-3xl" />

          <div className="relative grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[#d7c4aa]">
                <AlertTriangle className="h-4 w-4" />
                Paiement refusé
              </div>
              <h1 style={EDITORIAL_HEADING} className="mt-5 text-4xl leading-tight tracking-[-0.03em] text-white md:text-5xl lg:text-6xl">
                Paiement non abouti
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#dfe8f0] md:text-base">
                La transaction n&apos;a pas été validée. Aucun abonnement n&apos;est activé pour le moment, mais tu peux reprendre proprement depuis les offres ou vérifier la référence de retour.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-[24px] border border-[#f1c8c0] bg-[var(--error-bg)] px-4 py-4 text-[#b24838]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">Statut</p>
                <p className="mt-2 text-xl font-semibold">Paiement refusé</p>
              </div>
              <div className="rounded-[24px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d7c4aa]">Montant</p>
                <p className="mt-2 text-sm font-semibold text-white">Aucun débit confirmé</p>
              </div>
              <div className="rounded-[24px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d7c4aa]">Référence</p>
                <p className="mt-2 truncate text-sm font-semibold text-white">{displayedRef ?? 'Non transmise'}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="space-y-6">
            <section className="rounded-[24px] border border-[#f1c8c0] bg-[var(--error-bg)] p-6 shadow-[var(--shadow-md)] md:p-7">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-[#b24838]">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#9a6a37]">Lecture du retour</p>
                  <h2 style={EDITORIAL_HEADING} className="mt-2 text-3xl leading-tight tracking-[-0.02em] text-[var(--navy)]">
                    L&apos;abonnement n&apos;a pas été activé.
                  </h2>
                </div>
              </div>
              <p className="mt-5 text-sm leading-7 text-[#5c4650]">
                Le prestataire a renvoyé un refus ou un échec de transaction. Tant que le statut final n&apos;est pas accepté, la plateforme reste sur le plan actuel.
              </p>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {[
                  'Vérifier la carte ou le moyen de paiement utilisé.',
                  'Revenir sur la page tarifaire pour relancer une tentative propre.',
                  'Contacter le support si la référence bloque à plusieurs reprises.',
                ].map((step, index) => (
                  <div key={step} className="rounded-[22px] border border-white/70 bg-white/75 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#9a6a37]">Étape {index + 1}</p>
                    <p className="mt-2 text-sm leading-6 text-[var(--navy)]">{step}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[24px] border border-[var(--border-light)] bg-[linear-gradient(180deg,#fffdfa_0%,#fbf5ec_100%)] p-6 shadow-[var(--shadow-md)] md:p-7">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#9a6a37]">Actions utiles</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/#plans"
                  className="inline-flex items-center gap-2 rounded-[16px] bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#22486b]"
                >
                  Réessayer
                  <RotateCcw className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-[16px] border border-[#dfd1bc] bg-[#fffaf4] px-5 py-3 text-sm font-semibold text-[var(--navy)] transition hover:border-[var(--navy)]/25 hover:bg-white"
                >
                  Se connecter
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-[16px] border border-[#dfd1bc] bg-white px-5 py-3 text-sm font-semibold text-[var(--navy)] transition hover:border-[var(--navy)]/25"
                >
                  Retour à l&apos;accueil
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </section>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[24px] border border-[#e8dcc8] bg-[#f8f1e7] p-5 shadow-[var(--shadow-md)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#9a6a37]">Référence de retour</p>
              <div className="mt-4 rounded-[16px] border border-[#eadbc5] bg-white/80 p-4 text-sm text-[#33536f]">
                {displayedRef ? (
                  <>
                    <p className="font-semibold text-[var(--navy)]">Référence transmise</p>
                    <p className="mt-2 break-all">{displayedRef}</p>
                  </>
                ) : (
                  <p>Aucune référence n&apos;a été transmise dans l&apos;URL de retour.</p>
                )}
              </div>
            </section>

            <section className="rounded-[24px] border border-[#d7e6e1] bg-[var(--success-bg)] p-5 shadow-[var(--shadow-md)]">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--teal)]/10 text-[var(--teal)]">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[var(--teal)]">Réassurance</p>
                  <p className="mt-2 text-sm leading-7 text-[#33536f]">
                    Aucun montant n&apos;a été débité tant que la transaction n&apos;est pas acceptée. En cas de doute, la page tarifaire et ton espace connecté restent les deux écrans de vérification utiles.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default function PaiementRefusPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Chargement…</div>}>
      <PaiementRefusContent />
    </Suspense>
  );
}
