'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, ArrowRight, RotateCcw, ShieldCheck } from 'lucide-react';

const EDITORIAL_HEADING = {
  fontFamily: "'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, serif",
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
        <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-[#17324d] px-6 py-8 text-[#f6efe4] shadow-[0_32px_90px_rgba(23,50,77,0.22)] md:px-8 md:py-10 lg:px-10">
          <div className="absolute inset-y-0 right-[-8%] hidden w-[36%] rounded-full bg-[radial-gradient(circle_at_center,_rgba(221,131,108,0.22),_transparent_72%)] blur-2xl lg:block" />
          <div className="absolute left-[-4%] top-[-22%] h-40 w-40 rounded-full bg-[rgba(216,163,99,0.15)] blur-3xl" />

          <div className="relative grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[#d7c4aa]">
                <AlertTriangle className="h-4 w-4" />
                Paiement refuse
              </div>
              <h1 style={EDITORIAL_HEADING} className="mt-5 text-4xl leading-tight tracking-[-0.03em] text-white md:text-5xl lg:text-6xl">
                Paiement non abouti
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#dfe8f0] md:text-base">
                La transaction n a pas ete validee. Aucun acces premium n est active pour le moment, mais vous pouvez reprendre proprement depuis les offres ou verifier la reference de retour.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <div className="rounded-[26px] border border-[#f1c8c0] bg-[#fff0ed] px-4 py-4 text-[#b24838]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">Statut</p>
                <p className="mt-2 text-xl font-semibold">Paiement refuse</p>
              </div>
              <div className="rounded-[26px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d7c4aa]">Montant</p>
                <p className="mt-2 text-sm font-semibold text-white">Aucun debit confirme</p>
              </div>
              <div className="rounded-[26px] border border-white/12 bg-white/10 px-4 py-4 backdrop-blur-sm">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#d7c4aa]">Reference</p>
                <p className="mt-2 truncate text-sm font-semibold text-white">{displayedRef ?? 'Non transmise'}</p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
          <section className="space-y-6">
            <section className="rounded-[30px] border border-[#f1c8c0] bg-[#fff0ed] p-6 shadow-[0_20px_70px_rgba(23,50,77,0.08)] md:p-7">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-[#b24838]">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#9a6a37]">Lecture du retour</p>
                  <h2 style={EDITORIAL_HEADING} className="mt-2 text-3xl leading-tight tracking-[-0.02em] text-[#17324d]">
                    L abonnement n a pas ete active.
                  </h2>
                </div>
              </div>
              <p className="mt-5 text-sm leading-7 text-[#5c4650]">
                Le prestataire a renvoye un refus ou un echec de transaction. Tant que le statut final n est pas accepte, la plateforme reste sur le plan actuel.
              </p>
              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {[
                  'Verifier la carte ou le moyen de paiement utilise.',
                  'Revenir sur la page tarifaire pour relancer une tentative propre.',
                  'Contacter le support si la reference bloque a plusieurs reprises.',
                ].map((step, index) => (
                  <div key={step} className="rounded-[22px] border border-white/70 bg-white/75 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#9a6a37]">Etape {index + 1}</p>
                    <p className="mt-2 text-sm leading-6 text-[#17324d]">{step}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[30px] border border-[#e7dac6] bg-[linear-gradient(180deg,#fffdfa_0%,#fbf5ec_100%)] p-6 shadow-[0_20px_70px_rgba(23,50,77,0.08)] md:p-7">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#9a6a37]">Actions utiles</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 rounded-[18px] bg-[#17324d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#22486b]"
                >
                  Reessayer
                  <RotateCcw className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-[18px] border border-[#dfd1bc] bg-[#fffaf4] px-5 py-3 text-sm font-semibold text-[#17324d] transition hover:border-[#17324d]/25 hover:bg-white"
                >
                  Se connecter
                </Link>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-[18px] border border-[#dfd1bc] bg-white px-5 py-3 text-sm font-semibold text-[#17324d] transition hover:border-[#17324d]/25"
                >
                  Retour a l accueil
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </section>
          </section>

          <aside className="space-y-6">
            <section className="rounded-[30px] border border-[#e8dcc8] bg-[#f8f1e7] p-5 shadow-[0_18px_55px_rgba(122,75,36,0.08)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#9a6a37]">Reference de retour</p>
              <div className="mt-4 rounded-[20px] border border-[#eadbc5] bg-white/80 p-4 text-sm text-[#33536f]">
                {displayedRef ? (
                  <>
                    <p className="font-semibold text-[#17324d]">Reference transmise</p>
                    <p className="mt-2 break-all">{displayedRef}</p>
                  </>
                ) : (
                  <p>Aucune reference n a ete transmise dans l URL de retour.</p>
                )}
              </div>
            </section>

            <section className="rounded-[30px] border border-[#d7e6e1] bg-[#edf7f3] p-5 shadow-[0_18px_55px_rgba(15,118,110,0.08)]">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0f766e]/10 text-[#0f766e]">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#0f766e]">Reassurance</p>
                  <p className="mt-2 text-sm leading-7 text-[#33536f]">
                    Aucun montant n a ete debite tant que la transaction n est pas acceptee. En cas de doute, la page tarifaire et votre espace connecte restent les deux ecrans de verification utiles.
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
