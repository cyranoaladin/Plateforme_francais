import Link from 'next/link';

export const metadata = {
  title: 'Mentions légales & CGU',
  description: 'Mentions légales et conditions générales d\'utilisation de Nexus EAF',
};

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-[var(--surface-cream)] py-12 px-4">
      <div className="mx-auto max-w-4xl rounded-3xl border border-[var(--border-strong)] bg-white p-8 shadow-lg">
        <h1 className="text-4xl font-bold text-[var(--navy)] mb-8" style={{ fontFamily: "var(--font-display)" }}>
          Mentions légales & Conditions Générales d'Utilisation
        </h1>

        <section className="space-y-6 text-[var(--navy)]/80">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--navy)] mb-3">Éditeur du site</h2>
            <p><strong>Raison sociale :</strong> STE M&M ACADEMY SUARL</p>
            <p><strong>Email de contact :</strong> contact@nexusreussite.academy</p>
            <p><strong>Site web :</strong> https://eaf.nexusreussite.academy</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-[var(--navy)] mb-3">Hébergement</h2>
            <p>Le site est hébergé par :</p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>OVH SAS - 2 rue Kellermann, 59100 Roubaix, France</li>
              <li>Vercel Inc. - 440 N Barranca Ave #4133, Covina, CA 91723, USA</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-[var(--navy)] mb-3">Protection des données (RGPD)</h2>
            <p className="mb-2">Nexus EAF s'engage à protéger vos données personnelles conformément au RGPD :</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>Collecte minimale :</strong> Nous ne collectons que les données strictement nécessaires au fonctionnement du service.</li>
              <li><strong>Traitement des mineurs :</strong> Pour les utilisateurs de moins de 15 ans, un consentement parental est requis (email parent).</li>
              <li><strong>Droit d'accès et de suppression :</strong> Vous pouvez à tout moment demander l'accès, la modification ou la suppression de vos données via contact@nexusreussite.academy.</li>
              <li><strong>Pas de revente :</strong> Vos données ne sont jamais vendues à des tiers.</li>
              <li><strong>Sécurité :</strong> Les mots de passe sont hashés, les sessions sécurisées par cookies HttpOnly.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-[var(--navy)] mb-3">Conditions Générales d'Utilisation</h2>
            <p className="mb-2"><strong>Version :</strong> 2026-03</p>
            <p className="mb-2">En utilisant Nexus EAF, vous acceptez les conditions suivantes :</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>Le service est destiné aux élèves de Première préparant l'EAF.</li>
              <li>L'utilisation doit respecter le cadre pédagogique et les règles de propriété intellectuelle.</li>
              <li>Les contenus générés par IA sont fournis à titre indicatif et ne remplacent pas un enseignement officiel.</li>
              <li>Nexus EAF se réserve le droit de suspendre un compte en cas d'usage abusif ou frauduleux.</li>
              <li>Les tarifs des plans Premium et Masterium sont affichés en TND et peuvent être modifiés avec préavis de 30 jours.</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-[var(--navy)] mb-3">Propriété intellectuelle</h2>
            <p>Tous les contenus du site (textes, images, logos, structure) sont protégés par le droit d'auteur. Toute reproduction sans autorisation est interdite.</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-[var(--navy)] mb-3">Contact</h2>
            <p>Pour toute question concernant ces mentions légales ou les CGU, contactez-nous à :</p>
            <p className="font-semibold mt-2">contact@nexusreussite.academy</p>
          </div>
        </section>

        <div className="mt-12 pt-6 border-t border-[var(--border-strong)]">
          <Link href="/" className="text-[var(--teal)] hover:underline font-semibold">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
