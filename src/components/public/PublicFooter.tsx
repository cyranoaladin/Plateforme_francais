import Link from 'next/link';

const editorialHeading = {
  fontFamily: "'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Georgia, serif",
};

export function PublicFooter() {
  return (
    <footer className="border-t border-[#d8ccb9] bg-[#efe7da]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <img src="/images/logo_slogan_nexus.png" alt="Nexus Réussite" className="mb-4 h-11 w-auto object-contain" />
            <h3 style={editorialHeading} className="max-w-sm text-2xl leading-tight tracking-[-0.02em] text-[#17324d]">
              Une préparation EAF exigeante, lisible et commercialement honnête.
            </h3>
            <p className="mt-4 max-w-md text-sm leading-7 text-slate-600">
              Nexus Réussite rassemble écrit, oral, langue et corpus documentaire dans un parcours structuré cohérent avec le programme officiel, conçu
              pour faire produire l&apos;élève, pas pour le remplacer.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Navigation</h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              <li><a href="#comment-ca-marche" className="transition-colors hover:text-[#17324d]">La méthode</a></li>
              <li><a href="#fonctionnalites" className="transition-colors hover:text-[#17324d]">Ateliers</a></li>
              <li><a href="#plans" className="transition-colors hover:text-[#17324d]">Plans</a></li>
              <li><a href="#faq" className="transition-colors hover:text-[#17324d]">FAQ</a></li>
              <li><Link href="/mentions-legales" className="transition-colors hover:text-[#17324d]">Mentions légales</Link></li>
              <li><a href="mailto:contact@nexusreussite.academy" className="transition-colors hover:text-[#17324d]">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Engagements</h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              <li>Anti-copie par design</li>
              <li>Sources internes visibles</li>
              <li>RGPD et comptes mineurs protégés</li>
              <li>Pas de publicité ciblée</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Contact</h4>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              <li>contact@nexusreussite.academy</li>
              <li>
                <Link href="/#plans" className="transition-colors hover:text-[#17324d]">
                  Voir les plans et tarifs
                </Link>
              </li>
              <li>
                <Link href="/login?mode=register" className="transition-colors hover:text-[#17324d]">
                  Créer un compte gratuit
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-[#d8ccb9] pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Nexus Réussite. Tous droits réservés.</p>
          <p>Produit pédagogique commercial, sans publicité ciblée sur les comptes mineurs.</p>
        </div>
      </div>
    </footer>
  );
}
