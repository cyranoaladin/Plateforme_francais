import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from '@/components/ui/icons';

export const dynamic = 'force-dynamic';

const PAYMENT_CONFIRMATION_COPY = {
  title: 'Activation confirmée',
  body:
    'Ton règlement a bien été validé par l’équipe Nexus et ton plan est maintenant actif. Tu peux accéder immédiatement aux fonctionnalités débloquées par ton abonnement.',
  dashboardCta: 'Accéder au tableau de bord',
  homeCta: 'Retour accueil',
} as const;

export default function PaiementConfirmationPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="mx-auto max-w-lg text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-subtle text-success">
          <CheckCircle2 className="h-8 w-8" />
        </div>

        <h1 className="font-display mt-6 text-3xl font-bold text-foreground">
          {PAYMENT_CONFIRMATION_COPY.title}
        </h1>

        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {PAYMENT_CONFIRMATION_COPY.body}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--c-primary)] px-6 py-3 text-sm font-semibold text-[var(--text-on-primary)] transition-all hover:bg-[var(--c-primary-hover)]"
          >
            {PAYMENT_CONFIRMATION_COPY.dashboardCta}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            {PAYMENT_CONFIRMATION_COPY.homeCta}
          </Link>
        </div>
      </div>
    </main>
  );
}
