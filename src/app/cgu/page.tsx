import Link from 'next/link';

export const metadata = {
  title: 'CGU',
  description: "Conditions générales d'utilisation de Nexus EAF",
};

const CGU_ITEMS = [
  "Le service est destiné aux élèves de Première préparant l'EAF.",
  "L'utilisation doit respecter le cadre pédagogique et les règles de propriété intellectuelle.",
  'Les contenus générés par IA sont fournis à titre indicatif et ne remplacent pas un enseignement officiel.',
  "Nexus EAF se réserve le droit de suspendre un compte en cas d'usage abusif ou frauduleux.",
  'Les tarifs des plans Réussite et Excellence sont affichés en TND et peuvent être modifiés avec préavis de 30 jours.',
];

export default function CguPage() {
  return (
    <div className="min-h-screen bg-[#F4EFE5] px-4 py-12">
      <div className="mx-auto max-w-4xl rounded-3xl border border-[#d8ccb9] bg-white p-8 shadow-lg">
        <h1 className="mb-8 text-4xl font-bold text-[#17324D]" style={{ fontFamily: "'Georgia', serif" }}>
          {"Conditions Générales d'Utilisation"}
        </h1>

        <section className="space-y-6 text-[#17324D]/80">
          <div>
            <h2 className="mb-3 text-2xl font-semibold text-[#17324D]">{"Conditions Générales d'Utilisation"}</h2>
            <p className="mb-2"><strong>Version :</strong> 2026-03</p>
            <p className="mb-2">En utilisant Nexus EAF, vous acceptez les conditions suivantes :</p>
            <ul className="ml-4 list-disc list-inside space-y-2">
              {CGU_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-2xl font-semibold text-[#17324D]">Propriété intellectuelle</h2>
            <p>
              {"Tous les contenus du site (textes, images, logos, structure) sont protégés par le droit d'auteur. Toute reproduction sans autorisation est interdite."}
            </p>
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
