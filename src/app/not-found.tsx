import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold text-[var(--navy)]" style={{ fontFamily: "var(--font-display)" }}>
        404
      </p>
      <p className="mt-3 text-lg text-[var(--navy)]/70">Cette page n'existe pas.</p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[var(--teal)] px-6 py-3 text-sm font-bold text-white hover:bg-[var(--teal)]/90 transition-colors"
      >
        Retour au dashboard
      </Link>
    </div>
  );
}
