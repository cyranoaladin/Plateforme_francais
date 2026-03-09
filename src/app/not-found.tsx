import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold text-[#17324D]" style={{ fontFamily: "'Georgia', serif" }}>
        404
      </p>
      <p className="mt-3 text-lg text-[#17324D]/70">Cette page n'existe pas.</p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#0F766E] px-6 py-3 text-sm font-bold text-white hover:bg-[#0F766E]/90 transition-colors"
      >
        Retour au dashboard
      </Link>
    </div>
  );
}
