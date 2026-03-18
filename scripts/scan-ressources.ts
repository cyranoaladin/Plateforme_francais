/**
 * Script de scan des ressources EAF avec titres intelligents
 * Génère un fichier JSON structuré avec des titres parlants
 */

import fs from 'fs';
import path from 'path';
import { getRessourcesRoot } from '../src/lib/ressources/path';

const RESSOURCES_DIR = getRessourcesRoot();
const OUTPUT_FILE = path.join(__dirname, '../src/data/ressources-scan.json');

interface ResourceItem {
  id: string;
  title: string;
  originalTitle: string;
  type: 'annales' | 'oeuvre' | 'video' | 'document' | 'rapport_jury';
  category: string;
  filePath: string;
  url: string;
  size?: number;
  ext?: string;
  year?: number;
  subject?: string;
  description?: string;
}

/**
 * Formate les titres des annales EAF
 * Codes: frge = français général, frte = français techno
 *        ag = Asie, an = Amérique du Nord, ge = Métropole, po = Pondichéry, etc.
 */
function formatAnnalesTitle(filename: string): { title: string; year?: number; subject?: string } {
  // Pattern: YY-frgeXXN ou YY-frteXXN
  const match = filename.match(/^(\d{2})-fr(g|t)(e?)([a-z]{2})(\d+)(.*)$/i);
  
  if (match) {
    const year = `20${match[1]}`;
    const voie = match[2] === 'g' ? 'Général' : 'Technologique';
    const zone = match[4];
    const numSujet = match[5];
    
    const zones: Record<string, string> = {
      'ag': 'Asie',
      'an': 'Amérique du Nord',
      'as': 'Asie',
      'ge': 'Métropole',
      'po': 'Pondichéry',
      'me': 'Métropole',
      'ja': 'Japon',
      'nc': 'Nouvelle-Calédonie',
      'g1': 'Groupe 1',
      'em': 'Europe',
    };
    
    const zoneName = zones[zone.toLowerCase()] || zone.toUpperCase();
    const bcg = filename.includes('bcg') ? ' BCG ' : '';
    
    return {
      title: `${year} - Bac ${bcg}Français ${voie} - ${zoneName} - Sujet ${numSujet}`,
      year: parseInt(year),
      subject: `Bac ${year} Français ${voie}`,
    };
  }
  
  // Pattern avec texte descriptif
  if (filename.includes('sujet') && filename.match(/\d{2}-fr/)) {
    const yearMatch = filename.match(/(\d{2})-fr/);
    if (yearMatch) {
      const year = `20${yearMatch[1]}`;
      return {
        title: `${year} - Sujet d'annale (Bac Français)`,
        year: parseInt(year),
        subject: `Bac ${year} Français`,
      };
    }
  }
  
  // Fichiers de liens
  if (filename.includes('liens')) {
    return {
      title: filename.includes('videos') ? 'Liens vers les Vidéos EAF' : 'Liens vers les Documents EAF',
    };
  }
  
  // Pattern simple avec année
  const simpleMatch = filename.match(/^(\d{4})[_-]?(.*)$/);
  if (simpleMatch) {
    return {
      title: `${simpleMatch[1]} - ${simpleMatch[2].replace(/_/g, ' ')}`,
      year: parseInt(simpleMatch[1]),
    };
  }
  
  // Par défaut, nettoyer le titre
  return { 
    title: filename.replace(/_/g, ' ').replace(/-/g, ' '),
  };
}

/**
 * Formate les titres de vidéos
 */
function formatVideoTitle(filename: string): string {
  let title = filename;
  
  // Enlever l'extension
  title = title.replace(/\.(webm|mkv|mp4|avi)$/i, '');
  
  // Enlever les préfixes emoji
  title = title.replace(/^⏱️\s*/g, '')
               .replace(/^🎧\s*/g, '')
               .replace(/^📚\s*/g, '')
               .replace(/^📜\s*/g, '')
               .replace(/^📣\s*/g, '')
               .replace(/^🔎\s*/g, '')
               .replace(/^🗝️\s*/g, '')
               .replace(/^🧠\s*/g, '')
               .replace(/^🎬\s*/g, '')
               .trim();
  
  // Nettoyer les espaces multiples
  title = title.replace(/\s+/g, ' ').trim();
  
  // Enlever les séparateurs doubles
  title = title.replace(/\s*[-–—]\s*/g, ' - ').trim();
  title = title.replace(/\s*:\s*/g, ' : ').trim();
  
  // Formater les noms d'auteurs
  const auteurs = [
    'BALZAC', 'RIMBAUD', 'MUSSET', 'COLETTE', 'CORNEILLE', 
    'MOLIÈRE', 'RACINE', 'HUGO', 'VOLTAIRE', 'ZOLA',
    'LA BOÉTIE', 'FONTENELLE', 'GRAFFIGNY', 'PRÉVOST',
    'BAUDELAIRE', 'VERLAINE', 'APOLLINAIRE', 'GIDE',
    'SARRAUTE', 'PONGE', 'DORION', 'RABELAIS', 'LAGARCE',
    'MARIVAUX', 'BEAUMARCHAIS', 'LA FAYETTE', 'LA BRUYÈRE',
    'LA FONTAINE', 'MONTAIGNE', 'MONTESQUIEU', 'ROUGET DE LISLE',
    'DESBORDES-VALMORE', 'DE GOUGES', 'CHRÉTIEN de TROYES',
    'SCHWARZ-BART', 'CAMUS', 'CÉLINE', 'FLAUBERT', 'MAUPASSANT',
    'STENDHAL', 'TOLSTOÏ', 'KAFKA', 'ORWELL', 'BRADBURY',
    'HEMINGWAY', 'ZOLA', 'DUMAS', 'SAND', 'GAUTIER',
  ];
  
  for (const auteur of auteurs) {
    const regex = new RegExp(`\\b${auteur.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*,`, 'g');
    title = title.replace(regex, `${auteur.charAt(0) + auteur.slice(1).toLowerCase()},`);
  }
  
  // Capitaliser les premières lettres
  title = title.split(' ').map(word => {
    if (word.length <= 2 && word !== 'Le' && word !== 'La' && word !== 'Les' && word !== 'De' && word !== 'Du') {
      return word.toLowerCase();
    }
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
  
  return title;
}

/**
 * Formate les titres de documents
 */
function formatDocumentTitle(filename: string): string {
  let title = filename.replace(/\.(pdf|doc|docx|png|jpg|jpeg|php)$/gi, '');
  
  // Gestion spéciale pour les documents Eduscol (RA19, RA23, RA24, etc.)
  const raMatch = title.match(/^RA(\d+)_Lycee_(GT|T|G)_([0-9A-Z_-]+)_FRA_(.+?)(_\d+)?$/i);
  if (raMatch) {
    const annee = raMatch[1];
    const filiere = raMatch[2].toUpperCase();
    const sujet = raMatch[4]
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Mapping des sujets Eduscol
    const sujetsMapping: Record<string, string> = {
      'explication lineaire': 'Explication Linéaire',
      'explicationLineaire': 'Explication Linéaire',
      'dissertation presentation': 'La Dissertation',
      'essai presentation': 'L\'Essai',
      'etude langue': 'Étude de la Langue',
      'parcours associe': 'Parcours Associé',
      'contractiontexte': 'Contraction de Texte',
      'contraction texte': 'Contraction de Texte',
      'exemple outil appropriation': 'Outils d\'Appropriation',
      'carnet lecture': 'Carnet de Lecture',
      'ressources histoire litteraire': 'Histoire Littéraire',
      'etude transversale': 'Étude Transversale',
      'syntaxe interrogation': 'Syntaxe : Interrogation',
      'juxtaposition coordination': 'Juxtaposition et Coordination',
      'subjonctif': 'Le Subjonctif',
      'conditionnel futur': 'Conditionnel et Futur',
      'valeurs temporelles modales': 'Valeurs Temporelles et Modales',
      'concordance temps': 'Concordance des Temps',
      'propositions relatives': 'Propositions Relatives',
      'relations logiques': 'Relations Logiques',
      'presentation ressources': 'Ressources Pédagogiques',
      'competences orales': 'Compétences Orales',
      'peau de chagrin': 'La Peau de Chagrin',
      'discours de la servitude': 'Discours de la Servitude Volontaire',
      'lettres peruviennes': 'Lettres d\'une Péruvienne',
      'on ne badine': 'On ne badine pas avec l\'amour',
      'le menteur': 'Le Menteur',
      'cahiers douai': 'Cahiers de Douai - Rimbaud',
      'mes forets': 'Mes Forêts - Hélène Dorion',
      'rage expression': 'La Rage de l\'Expression - Ponge',
      'manon lescaut': 'Manon Lescaut',
      'sido': 'Sido - Colette',
      'vrilles vigne': 'Les Vrilles de la Vigne',
    };
    
    let sujetFormate = sujet;
    for (const [key, value] of Object.entries(sujetsMapping)) {
      if (sujet.toLowerCase().includes(key.toLowerCase())) {
        sujetFormate = value;
        break;
      }
    }
    
    // Si le sujet n'a pas été mappé, essayer de le formater
    if (sujetFormate === sujet) {
      sujetFormate = sujet
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
    
    return `Ressource Eduscol ${2000 + parseInt(annee)} - ${filiere} - ${sujetFormate}`;
  }
  
  // Remplacer les underscores par des espaces
  title = title.replace(/_/g, ' ');
  
  // Nettoyer les tirets multiples
  title = title.replace(/\s*-\s*/g, ' - ');
  
  // Nettoyer les codes numériques
  title = title.replace(/^\d+[-_\s]*/g, '');
  title = title.replace(/_\d+$/g, '');
  title = title.replace(/\s+\d{6,}$/g, ''); // Enlever les longs codes à la fin
  
  // Titres spéciaux
  const specialTitles: Record<string, string> = {
    'programme eaf': 'Programme Officiel EAF',
    'bareme oral': 'Barème Officiel de l\'Oral',
    'bareme ecrit': 'Barème Officiel de l\'Écrit',
    'descriptif lecture': 'Règles du Descriptif de Lecture',
    'grammaire programme': 'Programme de Grammaire Première',
    'explication lineaire': 'Méthode de l\'Explication Linéaire',
    'dissertation': 'Méthode de la Dissertation',
    'commentaire': 'Méthode du Commentaire Littéraire',
    'oral': 'Préparation de l\'Oral',
    'question de grammaire': 'Question de Grammaire - Méthode',
    'attente': 'Attendus Pédagogiques',
    'rapport': 'Rapport de Jury',
    'bilan': 'Bilan des Épreuves EAF',
    'charte': 'Charte EAF',
    'francais premiere': 'Programme de Français - Première',
    'grammaire cp 6e': 'Grammaire CP - 6ème',
    'grammaire terminologie': 'Terminologie Grammaticale',
    'intervention anne vibert': 'Intervention d\'Anne Vibert - La Lecture',
    'la peau de chagrin': 'La Peau de Chagrin (Texte intégral)',
    'manon lescaut': 'Manon Lescaut (Texte intégral)',
    'musset badine': 'On ne badine pas avec l\'amour - Musset',
    'les epreuves anticipees': 'Les Épreuves Anticipées de Français',
    'certificat qualiopi': 'Certificat Qualiopi',
    'cged': 'CGED - Conditions Générales',
    'memento cadre': 'Mémo Cadre Réglementaire des Évaluations',
    'dossier musset': 'Dossier Pédagogique - Musset',
  };
  
  const lowerTitle = title.toLowerCase();
  for (const [key, value] of Object.entries(specialTitles)) {
    if (lowerTitle.includes(key)) {
      return value;
    }
  }
  
  // Nettoyer les espaces multiples
  title = title.replace(/\s+/g, ' ').trim();
  
  // Capitaliser intelligemment
  title = title.split(' - ').map(part => {
    return part.split(' ').map((word, i) => {
      if (word.length <= 2 && i > 0) return word.toLowerCase();
      if (['de', 'du', 'des', 'le', 'la', 'les', 'un', 'une', 'et', 'ou', 'à', 'au', 'aux'].includes(word.toLowerCase())) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  }).join(' - ');
  
  return title;
}

/**
 * Formate les titres d'oeuvres
 */
function formatOeuvreTitle(filename: string): string {
  const title = filename.replace(/\.(pdf|epub|fb2)$/gi, '');
  
  const oeuvresConnues: Record<string, string> = {
    'discours.*servitude.*volontaire': 'Discours de la servitude volontaire - La Boétie',
    'entretiens.*pluralite.*mondes': 'Entretiens sur la pluralité des mondes - Fontenelle',
    'lettres.*peruvienne': 'Lettres d\'une Péruvienne - Françoise de Graffigny',
    'menteur': 'Le Menteur - Corneille',
    'on.*badine.*amour': 'On ne badine pas avec l\'amour - Musset',
    'manon.*lescaut': 'Manon Lescaut - Abbé Prévost',
    'peau.*chagrin': 'La Peau de chagrin - Balzac',
    'sido': 'Sido - Colette',
    'vrilles.*vigne': 'Les Vrilles de la vigne - Colette',
    'cahier.*douai': 'Cahiers de Douai - Rimbaud',
    'rage.*expression': 'La Rage de l\'expression - Francis Ponge',
    'mes.*forets': 'Mes Forêts - Hélène Dorion',
  };
  
  const lowerFilename = filename.toLowerCase();
  for (const [pattern, titre] of Object.entries(oeuvresConnues)) {
    if (new RegExp(pattern).test(lowerFilename)) {
      return titre;
    }
  }
  
  return title.replace(/_/g, ' ');
}

/**
 * Formate les titres de rapports de jury
 */
function formatRapportTitle(filename: string): string {
  // Extraire l'année
  const yearMatch = filename.match(/20\d{2}/);
  const year = yearMatch ? yearMatch[0] : '';
  
  // Déterminer le type
  let type = 'Document';
  if (filename.toLowerCase().includes('bilan')) type = 'Bilan';
  else if (filename.toLowerCase().includes('rapport')) type = 'Rapport';
  else if (filename.toLowerCase().includes('charte')) type = 'Charte';
  
  // Extraire l'académie
  const academies: Record<string, string> = {
    'nantes': 'Académie de Nantes',
    'lille': 'Académie de Lille',
    'versailles': 'Académie de Versailles',
    'creteil': 'Académie de Créteil',
    'paris': 'Académie de Paris',
    'lyon': 'Académie de Lyon',
    'bordeaux': 'Académie de Bordeaux',
    'toulouse': 'Académie de Toulouse',
    'grenoble': 'Académie de Grenoble',
    'montpellier': 'Académie de Montpellier',
    'nice': 'Académie de Nice',
    'aix': 'Académie d\'Aix-Marseille',
  };
  
  let academie = '';
  for (const [key, value] of Object.entries(academies)) {
    if (filename.toLowerCase().includes(key)) {
      academie = value;
      break;
    }
  }
  
  const parts = [type];
  if (type === 'Bilan' || type === 'Rapport') {
    parts.push('EAF');
    if (year) parts.push(year);
  }
  if (academie) parts.push(academie);
  
  return parts.join(' - ');
}

function scanDirectory(dirPath: string, category: string): ResourceItem[] {
  const items: ResourceItem[] = [];
  
  if (!fs.existsSync(dirPath)) {
    console.warn(`⚠️  Dossier non trouvé: ${dirPath}`);
    return items;
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'env_scraping') continue;

    const fullPath = path.join(dirPath, entry.name);
    const relativePath = path.relative(RESSOURCES_DIR, fullPath);
    const ext = path.extname(entry.name).toLowerCase();

    if (entry.isDirectory()) {
      items.push(...scanDirectory(fullPath, `${category}/${entry.name}`));
    } else if (entry.isFile()) {
      // Déterminer le type
      let type: ResourceItem['type'] = 'document';
      if (category.includes('Annales')) type = 'annales';
      else if (category.includes('Oeuvres')) type = 'oeuvre';
      else if (category.includes('Videos')) type = 'video';
      else if (category.includes('eaf_rapport_jury')) type = 'rapport_jury';

      // Formater le titre selon le type
      let formattedTitle = entry.name;
      let metadata = {};
      
      switch (type) {
        case 'annales':
          const annalesMeta = formatAnnalesTitle(entry.name.replace(ext, ''));
          formattedTitle = annalesMeta.title;
          metadata = { year: annalesMeta.year, subject: annalesMeta.subject };
          break;
        case 'video':
          formattedTitle = formatVideoTitle(entry.name);
          break;
        case 'oeuvre':
          formattedTitle = formatOeuvreTitle(entry.name);
          break;
        case 'document':
          formattedTitle = formatDocumentTitle(entry.name);
          break;
        case 'rapport_jury':
          formattedTitle = formatRapportTitle(entry.name);
          break;
      }

      items.push({
        id: `${category}/${entry.name}`.replace(/\//g, '_').replace(/\.pdf$/i, '').replace(/\.webm$/i, '').replace(/\.mkv$/i, ''),
        title: formattedTitle,
        originalTitle: entry.name,
        type,
        category,
        filePath: path.posix.join('ressources', relativePath.split(path.sep).join('/')),
        url: `/ressources/${relativePath}`,  // URL publique via symlink
        size: fs.statSync(fullPath).size,
        ext: ext || undefined,
        ...metadata,
      });
    }
  }

  return items;
}

function main() {
  console.log('🔍 Scan des ressources EAF avec titres intelligents...\n');

  const categories = [
    'Annales_EAF',
    'Oeuvres',
    'Videos',
    'Documents_Extraits',
    'eaf_rapport_jury',
  ];

  const allResources: ResourceItem[] = [];

  for (const category of categories) {
    const categoryPath = path.join(RESSOURCES_DIR, category);
    const items = scanDirectory(categoryPath, category);
    console.log(`📁 ${category}: ${items.length} fichiers`);
    allResources.push(...items);
  }

  // ─── Post-processing : nettoyage des titres ───────────────────────────────

  // 1. Table de titres corrigés pour les fichiers à intitulé garbled
  const TITLE_OVERRIDES: Record<string, string> = {
    '04-annexe1_francais_2e_bomodifie.pdf': 'Programme de Français — Seconde (BO modifié 2024)',
    '04_annexe2_francais_1egt_bomodifie.pdf': 'Programme de Français — Première (BO modifié 2024)',
    'baccalaur-at-technologique-2025-fran-ais-preuve-anticip-e-227685.pdf': 'Baccalauréat Technologique 2025 — Épreuve anticipée de Français',
    'intervention-anne-vibert-lecture-vf-20-11-13.pdf': 'Intervention d\'Anne Vibert — La lecture littéraire (2013)',
    'LES-EPREUVES-ANTICIPEES-DE-FRANCAIS.pdf': 'Les Épreuves Anticipées de Français — Guide complet',
    'RA20_Lycee_GT_1_FRA_preparation-epreuve-orale_Fiche1 1.pdf.pdf': 'Ressource Eduscol 2020 — Préparation de l\'épreuve orale (Fiche 1)',
    'sga14_979-10-231-1562-8.pdf': 'Terminologie grammaticale — Édition de référence',
    'voie-g_-ses_version-consolidee_sept.-2024.pdf': 'Programme SES — Voie générale (version consolidée 2024)',
    'voie-g_llca_-version-consolidee-2024.pdf': 'Programme LLCA — Voie générale (version consolidée 2024)',
    'voie-g_philo_-version-consolidee-2024_0.pdf': 'Programme Philosophie — Voie générale (version consolidée 2024)',
    'voies-gt_eaf_version-consolidee-2024-avec-annexe.pdf': 'Programme EAF — Voies GT (version consolidée 2024, avec annexe)',
    'Entretiens_sur_la_pluralité_des_mondes.pdf': 'Entretiens sur la pluralité des mondes — Fontenelle',
    "Lettres_d\u2019une_P\u00e9ruvienne.pdf": 'Lettres d\u2019une Péruvienne — Françoise de Graffigny',
    "Lettres_d'une_P\u00e9ruvienne.pdf": 'Lettres d\u2019une Péruvienne — Françoise de Graffigny',
    'servitude.pdf': 'Discours de la servitude volontaire — La Boétie (édition abrégée)',
  };

  for (const r of allResources) {
    const override = TITLE_OVERRIDES[r.originalTitle];
    if (override) {
      r.title = override;
    }
  }

  // 2. Nettoyer les extensions résiduelles dans les titres
  for (const r of allResources) {
    r.title = r.title.replace(/\.(pdf|ppsx|doc|docx|webm|mkv|mp4)$/i, '').trim();
  }

  // 3. Différencier les titres dupliqués (ajouter numéro de partie)
  const titleCounts = new Map<string, number>();
  const titleIndexes = new Map<string, number>();
  for (const r of allResources) {
    const key = `${r.category}:${r.title}`;
    titleCounts.set(key, (titleCounts.get(key) ?? 0) + 1);
  }
  for (const r of allResources) {
    const key = `${r.category}:${r.title}`;
    const total = titleCounts.get(key) ?? 1;
    if (total > 1) {
      const idx = (titleIndexes.get(key) ?? 0) + 1;
      titleIndexes.set(key, idx);
      r.title = `${r.title} (${idx}/${total})`;
    }
  }

  // 4. Enrichir les rapports de jury : préciser Charte ÉAF avec année
  for (const r of allResources) {
    if (r.category === 'eaf_rapport_jury') {
      const orig = r.originalTitle.toLowerCase();
      // Préciser l'année dans le titre Charte avant le numérotage
      if (/^Charte(\s|$)/.test(r.title) || /^Charte ÉAF(\s|$)/.test(r.title)) {
        if (orig.includes('2025')) {
          r.title = r.title.replace(/^Charte(\s+ÉAF)?/, 'Charte ÉAF 2025');
        } else if (orig.includes('2020')) {
          r.title = r.title.replace(/^Charte(\s+ÉAF)?/, 'Charte ÉAF 2020');
        } else {
          r.title = r.title.replace(/^Charte(\s|$)/, 'Charte ÉAF ');
        }
        r.title = r.title.trim();
      }
    }
  }

  // 5. Re-numéroter les doublons par année/source pour un groupement plus clair
  //    Reset de la numérotation car l'étape 4 a modifié les titres
  const titleCounts2 = new Map<string, number>();
  const titleIndexes2 = new Map<string, number>();
  for (const r of allResources) {
    // Retirer le suffixe (x/y) existant pour re-calculer
    r.title = r.title.replace(/\s*\(\d+\/\d+\)$/, '');
    const key = `${r.category}:${r.title}`;
    titleCounts2.set(key, (titleCounts2.get(key) ?? 0) + 1);
  }
  for (const r of allResources) {
    const key = `${r.category}:${r.title}`;
    const total = titleCounts2.get(key) ?? 1;
    if (total > 1) {
      const idx = (titleIndexes2.get(key) ?? 0) + 1;
      titleIndexes2.set(key, idx);
      r.title = `${r.title} (${idx}/${total})`;
    }
  }

  // Trier par catégorie puis par titre
  allResources.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return a.title.localeCompare(b.title);
  });

  // Écrire le JSON
  const output = {
    generatedAt: new Date().toISOString(),
    totalResources: allResources.length,
    byCategory: categories.reduce((acc, cat) => {
      acc[cat] = allResources.filter(r => r.category.startsWith(cat)).length;
      return acc;
    }, {} as Record<string, number>),
    resources: allResources,
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');

  console.log(`\n✅ ${allResources.length} ressources indexées avec titres intelligents`);
  console.log(`📄 Fichier généré: ${OUTPUT_FILE}`);
  console.log('\n📊 Répartition:');
  for (const [cat, count] of Object.entries(output.byCategory)) {
    console.log(`   ${cat}: ${count}`);
  }
  
  // Afficher quelques exemples
  console.log('\n📝 Exemples de titres formatés:');
  const examples = allResources.slice(0, 5);
  for (const ex of examples) {
    console.log(`   "${ex.originalTitle}" → "${ex.title}"`);
  }
}

main();
