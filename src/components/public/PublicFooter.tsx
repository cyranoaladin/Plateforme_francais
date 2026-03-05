import Link from 'next/link';

/**
 * Public footer for /bienvenue landing page.
 */
export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-card/80 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <img src="/images/logo_slogan_nexus.png" alt="Nexus Réussite" className="h-10 w-auto object-contain mb-3" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Plateforme IA premium de préparation à l&apos;EAF en Première voie générale.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-bold text-foreground mb-3">Plateforme</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#fonctionnalites" className="hover:text-foreground transition-colors">Fonctionnalités</a></li>
              <li><a href="#tarifs" className="hover:text-foreground transition-colors">Tarifs</a></li>
              <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-foreground mb-3">Légal &amp; sécurité</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><span className="cursor-default">Mentions légales</span></li>
              <li><span className="cursor-default">Politique de confidentialité (RGPD)</span></li>
              <li><span className="cursor-default">CGU</span></li>
              <li><span className="cursor-default">Gestion des cookies</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-foreground mb-3">Contact</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Support : contact@nexusreussite.academy</li>
              <li>
                <Link href="/pricing" className="hover:text-foreground transition-colors">
                  Voir les tarifs
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Nexus Réussite. Tous droits réservés.
          </p>
          <p className="text-xs text-muted-foreground">
            Pas de publicité ciblée sur les comptes mineurs.
          </p>
        </div>
      </div>
    </footer>
  );
}
