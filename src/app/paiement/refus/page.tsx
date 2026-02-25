'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function PaiementRefusContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get('ref');

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow p-8 text-center">
        <div className="text-5xl mb-4" aria-hidden="true">&#x274C;</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Paiement non abouti</h1>
        <p className="text-gray-600 mb-1">
          Votre paiement n&apos;a pas pu être traité.
        </p>
        {ref && (
          <p className="text-xs text-gray-400 mb-4">
            Référence : {ref}
          </p>
        )}
        <p className="text-gray-600 mb-6">
          Aucun montant n&apos;a été débité. Vous pouvez réessayer ou contacter le support.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/pricing"
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Réessayer
          </Link>
          <Link
            href="/"
            className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
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
