import Link from 'next/link';
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

export default async function PaiementConfirmationPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const orderRef = pickValue(params.orderRef) ?? pickValue(params.orderNumber);
  const orderId = pickValue(params.orderId) ?? pickValue(params.order_id);
  const payment = await resolvePublicPaymentStatus({
    orderRef: orderRef ?? undefined,
    orderId: orderId ?? undefined,
  });
  const statusUrl = orderRef
    ? `/api/payments/clictopay/public-status?orderRef=${encodeURIComponent(orderRef)}`
    : orderId
      ? `/api/payments/clictopay/public-status?orderId=${encodeURIComponent(orderId)}`
      : null;

  const statusLabel =
    payment?.status === 'ACCEPTED'
      ? 'Paiement accepté'
      : payment?.status === 'PENDING'
        ? 'Paiement en cours de confirmation'
        : payment?.status === 'REFUSED'
          ? 'Paiement refusé'
          : payment?.status === 'ERROR'
            ? 'Erreur de paiement'
            : null;

  const message =
    payment?.status === 'ACCEPTED'
      ? 'Votre paiement a été validé et votre plan est activé.'
      : payment?.status === 'PENDING'
        ? 'Le paiement est en cours de confirmation. Revenez dans quelques instants.'
        : payment?.status === 'REFUSED' || payment?.status === 'ERROR'
          ? 'Le paiement n’est pas validé. Vous pouvez relancer la transaction.'
          : statusUrl
            ? 'Le paiement est confirmé. Vérification de l’activation en cours.'
            : 'Paiement confirmé. Connectez-vous pour vérifier l’activation de votre plan.';

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <section className="rounded-2xl border border-success/30 bg-success/10 p-8">
        <h1 className="text-2xl font-bold text-foreground">Paiement confirmé</h1>
        {statusLabel && (
          <p className="mt-2 inline-flex rounded-full border border-success/40 bg-success/20 px-3 py-1 text-xs font-semibold text-success">
            {statusLabel}
          </p>
        )}
        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
        {statusUrl && (
          <p className="mt-2 text-xs text-muted-foreground">
            Vérifier le statut: <code>{statusUrl}</code>
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Accéder au dashboard
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium"
          >
            Se connecter
          </Link>
        </div>
      </section>
    </main>
  );
}
