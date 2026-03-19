import Link from 'next/link';
import { GraduationCap, ShieldCheck, BookOpen, Lock, Eye } from 'lucide-react';

const editorialHeading = {
  fontFamily: "var(--font-display)",
};

export function PublicFooter() {
  return (
    <footer className="border-t border-[var(--border-strong)] bg-[var(--surface-light)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-[var(--navy)]">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-[var(--navy)]">Nexus Réussite</span>
                <span className="text-xs text-[var(--gold)]">Session 2026</span>
              </div>
              <div className="flex h-5 w-6 rounded overflow-hidden shadow-sm ml-1">
                <span className="w-2 h-full bg-[var(--french-blue)]" />
                <span className="w-2 h-full bg-white" />
                <span className="w-2 h-full bg-[var(--french-red)]" />
              </div>
            </div>
            <h3 style={editorialHeading} className="max-w-sm text-2xl leading-tight tracking-[-0.02em] text-[var(--navy)]">
              Une préparation EAF exigeante, lisible et commercialement honnête.
            </h3>
            <p className="mt-4 max-w-md text-sm leading-7 text-[var(--text-secondary)] font-serif">
              Nexus Réussite rassemble écrit, oral, langue et corpus documentaire dans un parcours structuré cohérent avec le programme officiel, conçu
              pour faire produire l&#x2019;élève, pas pour le remplacer.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Navigation</h4>
            <ul className="mt-4 space-y-3 text-sm text-[var(--text-body)]">
              <li><a href="#comment-ca-marche" className="transition-colors hover:text-[var(--navy)]">La méthode</a></li>
              <li><a href="#fonctionnalites" className="transition-colors hover:text-[var(--navy)]">Ateliers</a></li>
              <li><a href="#plans" className="transition-colors hover:text-[var(--navy)]">Plans</a></li>
              <li><a href="#faq" className="transition-colors hover:text-[var(--navy)]">FAQ</a></li>
              <li><Link href="/mentions-legales" className="transition-colors hover:text-[var(--navy)]">Mentions légales</Link></li>
              <li><Link href="/contact" className="transition-colors hover:text-[var(--navy)]">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Engagements</h4>
            <ul className="mt-4 space-y-3 text-sm text-[var(--text-body)]">
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[var(--teal)]" />Anti-copie par design</li>
              <li className="flex items-center gap-2"><Eye className="h-4 w-4 text-[var(--teal)]" />Sources internes visibles</li>
              <li className="flex items-center gap-2"><Lock className="h-4 w-4 text-[var(--teal)]" />RGPD et comptes mineurs protégés</li>
              <li className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-[var(--teal)]" />Pas de publicité ciblée</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Contact</h4>
            <ul className="mt-4 space-y-3 text-sm text-[var(--text-body)]">
              <li>contact@nexusreussite.academy</li>
              <li>
                <Link href="/#plans" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--gold)] to-[var(--gold-deep)] px-4 py-2 text-xs font-bold text-[var(--navy-dark)] shadow-gold transition-all hover:-translate-y-0.5">
                  Voir les tarifs
                </Link>
              </li>
              <li>
                <Link href="/login?mode=register" className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--navy)] px-4 py-2 text-xs font-bold text-[var(--navy)] transition-colors hover:bg-[var(--navy)] hover:text-white">
                  Créer un compte gratuit
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-[var(--border-strong)] pt-6 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Nexus Réussite. Tous droits réservés.</p>
          <p>Produit pédagogique commercial, sans publicité ciblée sur les comptes mineurs.</p>
        </div>
      </div>
    </footer>
  );
}
