import Link from 'next/link';

export const metadata = {
  title: 'Politique de confidentialité',
  description: 'Politique de confidentialité et traitement des données personnelles de Nexus EAF',
};

const DATA_PROTECTION_ITEMS = [
  {
    label: 'Collecte minimale :',
    body: 'Nous ne collectons que les données strictement nécessaires au fonctionnement du service.',
  },
  {
    label: 'Traitement des mineurs :',
    body: 'Pour les utilisateurs de moins de 15 ans, un consentement parental est requis (email parent).',
  },
  {
    label: "Droit d'accès et de suppression :",
    body: "Vous pouvez à tout moment demander l'accès, la modification ou la suppression de vos données via contact@nexusreussite.academy.",
  },
  {
    label: 'Pas de revente :',
    body: 'Vos données ne sont jamais vendues à des tiers.',
  },
  {
    label: 'Sécurité :',
    body: 'Les mots de passe sont hachés, les sessions sécurisées par cookies HttpOnly.',
  },
];

export default function PolitiqueDeConfidentialitePage() {
  return (
    <div className="min-h-screen bg-[#F4EFE5] px-4 py-12">
      <div className="mx-auto max-w-4xl rounded-3xl border border-[#d8ccb9] bg-white p-8 shadow-lg">
        <h1 className="mb-8 text-4xl font-bold text-[#17324D]" style={{ fontFamily: "'Georgia', serif" }}>
          Politique de confidentialité
        </h1>

        <section className="space-y-6 text-[#17324D]/80">
          <div>
            <h2 className="mb-3 text-2xl font-semibold text-[#17324D]">Protection des données (RGPD)</h2>
            <p className="mb-2">{"Nexus EAF s'engage à protéger vos données personnelles conformément au RGPD :"}</p>
            <ul className="ml-4 list-disc list-inside space-y-2">
              {DATA_PROTECTION_ITEMS.map((item) => (
                <li key={item.label}>
                  <strong>{item.label}</strong> {item.body}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-2xl font-semibold text-[#17324D]">Contact</h2>
            <p>Pour toute question concernant ces mentions légales ou les CGU, contactez-nous à :</p>
            <p className="mt-2 font-semibold">contact@nexusreussite.academy</p>
          </div>
        </section>

        <div className="mt-12 flex flex-wrap gap-4 border-t border-[#d8ccb9] pt-6">
          <Link href="/mentions-legales" className="font-semibold text-[#0F766E] hover:underline">
            {"Mentions légales & Conditions Générales d'Utilisation"}
          </Link>
          <Link href="/" className="font-semibold text-[#0F766E] hover:underline">
            {"← Retour à l'accueil"}
          </Link>
        </div>
      </div>
    </div>
  );
}
