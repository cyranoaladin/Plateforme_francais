import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';
import { prisma } from '@/lib/prisma';

export default async function BilanReservationPage({
  params,
}: {
  params: { reservationId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) {
    const { redirect } = await import('next/navigation');
    redirect(`/auth/signin?callbackUrl=/stages/fevrier-2026/bilan/${params.reservationId}`);
  }

  const reservation = await prisma.reservation?.findUnique({
    where: { id: params.reservationId },
    include: { user: true, diagnostic: true },
  }).catch(() => null);

  if (!reservation) notFound();

  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 text-2xl font-semibold text-gray-900">
        Bilan de votre stage — Février 2026
      </h1>
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <p className="text-gray-600">
          Réservation confirmée pour <strong>{reservation.user?.name}</strong>
        </p>
        {reservation.diagnostic && (
          <div className="mt-6">
            <h2 className="mb-3 text-lg font-medium">Résultats du diagnostic</h2>
            <pre className="rounded bg-gray-50 p-3 text-sm">
              {JSON.stringify(reservation.diagnostic, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
