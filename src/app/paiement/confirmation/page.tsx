import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

const EDITORIAL_HEADING = {
  fontFamily: "var(--font-display)",
};

export default function PaiementConfirmationPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <h1 style={EDITORIAL_HEADING} className="mt-6 text-3xl font-bold text-foreground">
          Paiement confirmé
        </h1>

        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Ton plan a été activé avec succès. Tu peux maintenant accéder
          à toutes les fonctionnalités de ton abonnement.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-sapphire-700 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-sapphire-600"
          >
            Accéder au tableau de bord
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Retour accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
