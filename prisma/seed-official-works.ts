/**
 * Seed OfficialWork table with 2025-2026 EAF programme from cahier des charges V2.
 * Run: npx tsx prisma/seed-official-works.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const WORKS_2025_2026 = [
  // Poésie du XIXe au XXIe siècle
  {
    anneeScolaire: '2025-2026',
    oeuvre: 'Cahier de Douai',
    auteur: 'Arthur Rimbaud',
    parcours: 'Émancipations créatrices',
    objetEtude: 'Poésie',
    voie: 'generale',
    urlEduscol: 'https://eduscol.education.fr/',
  },
  {
    anneeScolaire: '2025-2026',
    oeuvre: 'La rage de l\'expression',
    auteur: 'Francis Ponge',
    parcours: 'Dans l\'atelier du poète',
    objetEtude: 'Poésie',
    voie: 'generale',
    urlEduscol: 'https://eduscol.education.fr/',
  },
  {
    anneeScolaire: '2025-2026',
    oeuvre: 'Mes forêts',
    auteur: 'Hélène Dorion',
    parcours: 'La poésie, la nature, l\'intime',
    objetEtude: 'Poésie',
    voie: 'generale',
    urlEduscol: 'https://eduscol.education.fr/',
  },
  // Littérature d'idées du XVIe au XVIIIe siècle
  {
    anneeScolaire: '2025-2026',
    oeuvre: 'Discours de la servitude volontaire',
    auteur: 'Étienne de La Boétie',
    parcours: '« Défendre » et « entretenir » la liberté',
    objetEtude: 'Littérature d\'idées',
    voie: 'generale',
    urlEduscol: 'https://eduscol.education.fr/',
  },
  {
    anneeScolaire: '2025-2026',
    oeuvre: 'Entretiens sur la pluralité des mondes',
    auteur: 'Bernard Le Bouyer de Fontenelle',
    parcours: 'Le goût de la science',
    objetEtude: 'Littérature d\'idées',
    voie: 'generale',
    urlEduscol: 'https://eduscol.education.fr/',
  },
  {
    anneeScolaire: '2025-2026',
    oeuvre: 'Lettres d\'une Péruvienne',
    auteur: 'Françoise de Graffigny',
    parcours: '« Un nouvel univers s\'est offert à mes yeux »',
    objetEtude: 'Littérature d\'idées',
    voie: 'generale',
    urlEduscol: 'https://eduscol.education.fr/',
  },
  // Théâtre du XVIIe au XXIe siècle
  {
    anneeScolaire: '2025-2026',
    oeuvre: 'Le Menteur',
    auteur: 'Pierre Corneille',
    parcours: 'Mensonge et comédie',
    objetEtude: 'Théâtre',
    voie: 'generale',
    urlEduscol: 'https://eduscol.education.fr/',
  },
  {
    anneeScolaire: '2025-2026',
    oeuvre: 'On ne badine pas avec l\'amour',
    auteur: 'Alfred de Musset',
    parcours: 'Les jeux du cœur et de la parole',
    objetEtude: 'Théâtre',
    voie: 'generale',
    urlEduscol: 'https://eduscol.education.fr/',
  },
  {
    anneeScolaire: '2025-2026',
    oeuvre: 'Pour un oui ou pour un non',
    auteur: 'Nathalie Sarraute',
    parcours: 'Théâtre et dispute',
    objetEtude: 'Théâtre',
    voie: 'generale',
    urlEduscol: 'https://eduscol.education.fr/',
  },
  // Roman et récit du Moyen Âge au XXIe siècle (programme 2025-2026)
  {
    anneeScolaire: '2025-2026',
    oeuvre: 'Manon Lescaut',
    auteur: 'Abbé Prévost',
    parcours: 'Personnages en marge, plaisirs du romanesque',
    objetEtude: 'Roman',
    voie: 'generale',
    urlEduscol: 'https://eduscol.education.fr/',
  },
  {
    anneeScolaire: '2025-2026',
    oeuvre: 'La Peau de chagrin',
    auteur: 'Honoré de Balzac',
    parcours: 'Les romans de l\'énergie : création et destruction',
    objetEtude: 'Roman',
    voie: 'generale',
    urlEduscol: 'https://eduscol.education.fr/',
  },
  {
    anneeScolaire: '2025-2026',
    oeuvre: 'Sido suivi de Les Vrilles de la vigne',
    auteur: 'Colette',
    parcours: 'La célébration du monde',
    objetEtude: 'Roman',
    voie: 'generale',
    urlEduscol: 'https://eduscol.education.fr/',
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
