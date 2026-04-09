import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tarifs — Nexus Réussite EAF',
  description:
    'Choisis le plan adapté à ta préparation EAF : Freemium gratuit, Premium ou Masterium. Simulations orales, ateliers écrits, tuteur IA.',
  openGraph: {
    title: 'Plans tarifaires — Nexus Réussite EAF',
    description:
      '3 plans flexibles pour réussir ton EAF : simulations orales, correction de copies, tuteur IA personnalisé.',
    url: 'https://eaf.nexusreussite.academy/pricing',
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
