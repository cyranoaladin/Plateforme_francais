/**
 * Données des ressources EAF générées automatiquement depuis /ressources
 * 
 * Ce fichier est généré par: npx tsx scripts/scan-ressources.ts
 * 
 * Categories:
 * - Annales_EAF: Sujets et documents d'annales (PDF)
 * - Oeuvres: Œuvres intégrales au programme (PDF)
 * - Videos: Vidéos pédagogiques (webm, mkv)
 * - Documents_Extraits: Documents pédagogiques, rapports de jury, guides (PDF)
 * - eaf_rapport_jury: Rapports de jury EAF (PDF)
 */

export type ResourceCategory =
  | 'Annales_EAF'
  | 'Oeuvres'
  | 'Videos'
  | 'Documents_Extraits'
  | 'eaf_rapport_jury';

export type ResourceType =
  | 'annales'
  | 'oeuvre'
  | 'video'
  | 'document'
  | 'rapport_jury';

export interface EafResource {
  id: string;
  title: string;
  originalTitle?: string;
  type: ResourceType;
  category: ResourceCategory;
  filePath: string;
  url: string;
  size?: number;
  ext?: string;
  year?: number;
  subject?: string;
  description?: string;
}

export interface RessourcesData {
  generatedAt: string;
  totalResources: number;
  byCategory: Record<ResourceCategory, number>;
  resources: EafResource[];
}

// Données brutes importées
import rawRessources from './ressources-scan.json';
export const RESSOURCES_DATA = rawRessources as RessourcesData;

/**
 * IDs de ressources Documents_Extraits à reléguer en fin de liste.
 * Ces documents administratifs ne doivent pas occuper les slots FREE
 * à la place de contenus pédagogiques utiles aux élèves.
 */
const DEMOTED_DOCUMENT_IDS = new Set([
  'Documents_Extraits_Certificat_QualiopiCned_20242027',
  'Documents_Extraits_certification-qualiopi-digischool',
  'Documents_Extraits_CNED_CGV_CGU_2026_V01',
  'Documents_Extraits_Consignes_Mannequin_Challenge',
  'Documents_Extraits_Document_Extrait_-',
]);

function editorialSort(resources: EafResource[]): EafResource[] {
  const byCategory: Record<string, EafResource[]> = {};
  for (const r of resources) {
    (byCategory[r.category] ??= []).push(r);
  }
  for (const cat of Object.keys(byCategory)) {
    byCategory[cat].sort((a, b) => {
      const aD = DEMOTED_DOCUMENT_IDS.has(a.id) ? 1 : 0;
      const bD = DEMOTED_DOCUMENT_IDS.has(b.id) ? 1 : 0;
      if (aD !== bD) return aD - bD;
      return a.title.localeCompare(b.title, 'fr');
    });
  }
  const ordered: EafResource[] = [];
  for (const cat of ['Annales_EAF', 'Oeuvres', 'Videos', 'Documents_Extraits', 'eaf_rapport_jury']) {
    if (byCategory[cat]) ordered.push(...byCategory[cat]);
  }
  return ordered;
}

/** Toutes les ressources triées par catégorie avec pondération éditoriale */
export const RESSOURCES: EafResource[] = editorialSort(RESSOURCES_DATA.resources);

/** Ressources filtrées par catégorie */
export function getRessourcesByCategory(category: ResourceCategory): EafResource[] {
  return RESSOURCES.filter(r => r.category === category);
}

/** Recherche de ressources */
export function searchRessources(query: string): EafResource[] {
  const q = query.toLowerCase();
  return RESSOURCES.filter(r => 
    r.title.toLowerCase().includes(q) ||
    r.category.toLowerCase().includes(q) ||
    r.id.toLowerCase().includes(q)
  ).slice(0, 50);
}

/** Formatage de la taille */
export function formatFileSize(bytes?: number): string {
  if (!bytes) return '';
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} Ko`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} Mo`;
}

/** Formatage du titre pour affichage */
export function formatResourceTitle(title: string, _ext?: string): string {
  // Enlever l'extension si présente dans le titre
  let formatted = title.replace(/\.(pdf|webm|mkv|mp4)$/i, '');
  
  // Pour les annales, essayer de formater l'année
  if (formatted.match(/^\d{2}-fr/)) {
    const yearMatch = formatted.match(/^(\d{2})-fr/);
    if (yearMatch) {
      const year = `20${yearMatch[1]}`;
      formatted = formatted.replace(/^\d{2}-fr/, `${year} - `);
    }
  }
  
  return formatted;
}

/** Icône par type de ressource */
export function getResourceIcon(type: ResourceType): string {
  switch (type) {
    case 'annales': return '📝';
    case 'oeuvre': return '📚';
    case 'video': return '🎬';
    case 'document': return '📄';
    case 'rapport_jury': return '📊';
    default: return '📁';
  }
}

/** Label par catégorie */
export function getCategoryLabel(category: ResourceCategory): string {
  switch (category) {
    case 'Annales_EAF': return 'Annales EAF';
    case 'Oeuvres': return 'Œuvres';
    case 'Videos': return 'Vidéos';
    case 'Documents_Extraits': return 'Documents';
    case 'eaf_rapport_jury': return 'Rapports de jury';
    default: return category;
  }
}
