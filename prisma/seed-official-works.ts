/**
 * Seed OfficialWork table with 2025-2026 EAF programme from cahier des charges V2.
 * Run: npx tsx prisma/seed-official-works.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const WORKS_2025_2026 = [
  {
    anneeScolaire: '2025-2026',
    oeuvre: 'Les Misérables (extraits)',
    auteur: 'Victor Hugo',
    parcours: 'Roman et société',
    objetEtude: 'Roman',
    voie: 'generale',
    urlEduscol: 'https://eduscol.education.fr/document/14060/download',
  },
  {
    anneeScolaire: '2025-2026',
    oeuvre: 'Les Fleurs du Mal',
    auteur: 'Charles Baudelaire',
    parcours: 'Alchimie poétique',
    objetEtude: 'Poésie',
    voie: 'generale',
    urlEduscol: 'https://eduscol.education.fr/document/14060/download',
  },
  {
    anneeScolaire: '2025-2026',
    oeuvre: 'Le Malade imaginaire',
    auteur: 'Molière',
    parcours: 'Spectacle et comédie',
    objetEtude: 'Théâtre',
    voie: 'generale',
    urlEduscol: 'https://eduscol.education.fr/document/14060/download',
  },
  {
    anneeScolaire: '2025-2026',
    oeuvre: 'Les Confessions (extraits)',
    auteur: 'Rousseau',
    parcours: 'La recherche de soi',
    objetEtude: 'Récit autobiographique',
    voie: 'generale',
    urlEduscol: 'https://eduscol.education.fr/document/14060/download',
  },
  {
    anneeScolaire: '2025-2026',
    oeuvre: 'Déclaration des droits de la femme',
    auteur: 'Olympe de Gouges',
    parcours: 'La littérature d\'idées',
    objetEtude: 'Littérature d\'idées',
    voie: 'generale',
    urlEduscol: 'https://eduscol.education.fr/document/14060/download',
  },
  {
    anneeScolaire: '2025-2026',
    oeuvre: 'Mme Bovary (extraits)',
    auteur: 'Flaubert',
    parcours: 'Personnages en marge',
    objetEtude: 'Littérature étrangère',
    voie: 'generale',
    urlEduscol: 'https://eduscol.education.fr/document/14060/download',
  },
];

async function main() {
  console.log('Seeding OfficialWork table for 2025-2026...');

  for (const work of WORKS_2025_2026) {
    await prisma.officialWork.upsert({
      where: {
        anneeScolaire_oeuvre: {
          anneeScolaire: work.anneeScolaire,
          oeuvre: work.oeuvre,
        },
      },
      update: work,
      create: work,
    });
  }

  const count = await prisma.officialWork.count({
    where: { anneeScolaire: '2025-2026' },
  });
  console.log(`Done. ${count} works seeded for 2025-2026.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
