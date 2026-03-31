/**
 * SocialProofStrip — Quick social proof below the Hero.
 * Single impactful testimonial + global badge.
 * Dependencies: none
 */

function StarIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function TransformationBadge({ before, after }: { before: number; after: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-primary)] bg-brand-subtle px-3 py-1 text-sm font-semibold text-brand">
      {before}/20 → {after}/20
    </span>
  );
}

export function SocialProofStrip() {
  return (
    <section aria-label="Preuve sociale rapide" className="bg-surface px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-2xl">
        {/* Badge global */}
        <div className="mb-6 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-success)] bg-success-subtle px-4 py-1.5 text-sm font-medium text-success">
            <StarIcon />
            98% de mention Assez Bien ou plus
          </span>
        </div>

        {/* Testimonial card */}
        <blockquote className="rounded-2xl border border-[var(--border-default)] bg-page p-6">
          <p className="text-lg font-medium italic leading-relaxed text-heading">
            « J'avais peur de l'oral. Avec Nexus, j'ai fait 8 simulations réelles.
            Le jour J, j'étais habitué au stress — le tuteur me guidait pour que
            JE trouve. Résultat : 16/20 et mention Bien. »
          </p>
          <footer className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <cite className="not-italic font-semibold text-heading">Mehdi K.</cite>
              <span className="ml-2 text-sm text-muted-foreground">
                Lycée Pierre Mendès France, Tunis
              </span>
            </div>
            <TransformationBadge before={8} after={16} />
          </footer>
        </blockquote>
      </div>
    </section>
  );
}
