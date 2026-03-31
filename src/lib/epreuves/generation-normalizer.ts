import { type EpreuveType } from '@/lib/epreuves/types';

type RawGeneration = {
  sujet?: string;
  texte?: string;
  consignes?: string;
  bareme?: Record<string, number>;
};

type NormalizedGeneration = {
  sujet: string;
  texte: string;
  consignes: string;
  bareme: Record<string, number>;
};

const DEFAULT_BAREMES: Record<EpreuveType, Record<string, number>> = {
  commentaire: {
    comprehension: 4,
    analyse: 8,
    organisation: 4,
    expression: 4,
  },
  dissertation: {
    problematique: 4,
    argumentation: 8,
    references: 4,
    expression: 4,
  },
  contraction_essai: {
    contraction: 10,
    essai: 10,
  },
};

function sumBareme(bareme: Record<string, number> | undefined): number {
  if (!bareme) return 0;
  return Object.values(bareme).reduce((acc, value) => acc + (Number.isFinite(value) ? value : 0), 0);
}

function buildFallbackSujet(type: EpreuveType, oeuvre?: string, theme?: string): string {
  const workRef = oeuvre?.trim() || 'une œuvre du programme';
  const themeRef = theme?.trim();

  if (type === 'commentaire') {
    return themeRef
      ? `Vous commenterez le texte ci-dessous en montrant comment ${workRef} met en scène ${themeRef}.`
      : `Vous commenterez le texte ci-dessous en montrant comment ${workRef} donne à voir une tension décisive entre le personnage et son monde.`;
  }

  if (type === 'dissertation') {
    return themeRef
      ? `Dans quelle mesure ${workRef} permet-elle d'éclairer la question suivante : « ${themeRef} » ? Vous répondrez dans un développement organisé, appuyé sur l'œuvre étudiée et sur votre culture littéraire.`
      : `La fiction permet-elle seulement de raconter, ou aide-t-elle aussi à comprendre le réel ? Vous répondrez à cette question dans un développement organisé en vous appuyant sur ${workRef} et sur votre culture littéraire.`;
  }

  return themeRef
    ? `Vous ferez la contraction du texte ci-dessous puis vous rédigerez un essai répondant à la question suivante : comment ${themeRef} transforme-t-il notre regard sur le monde ?`
    : `Vous ferez la contraction du texte ci-dessous puis vous rédigerez un essai répondant à la question suivante : la littérature peut-elle encore changer notre manière de voir le monde ?`;
}

function buildFallbackTexte(type: EpreuveType, oeuvre?: string): string {
  if (type === 'dissertation') {
    return '';
  }

  const workRef = oeuvre?.trim() || 'l’œuvre au programme';

  if (type === 'commentaire') {
    return [
      `${workRef}`,
      'Extrait reconstitué de secours',
      '',
      'Le jour tombait avec lenteur sur la ville, et chacun continuait sa route comme s’il voulait retarder le moment du face-à-face avec soi-même. Dans cette hésitation diffuse, une parole retenue, un geste presque invisible, suffisaient à faire sentir la faille entre ce que l’on montre et ce que l’on éprouve. Le texte met ainsi en tension le regard social, la conscience intime et la fragilité d’un destin qui bascule.',
    ].join('\n');
  }

  return [
    'Texte argumentatif de secours',
    '',
    'On affirme souvent que la littérature est un luxe du passé. Pourtant, elle reste un lieu où une société apprend à se regarder elle-même. En lisant, nous faisons plus que suivre une intrigue ou admirer un style : nous testons des idées, nous rencontrons d’autres valeurs, nous découvrons les limites de nos certitudes. Les œuvres ne proposent pas des réponses toutes faites, mais elles obligent à reformuler les questions. Elles déplacent notre regard, en rendant sensibles des réalités que l’habitude finit par masquer.',
  ].join('\n');
}

function buildFallbackConsignes(type: EpreuveType): string {
  if (type === 'commentaire') {
    return 'Construisez une lecture organisée du texte, en reliant chaque procédé à un effet précis.';
  }
  if (type === 'dissertation') {
    return 'Formulez une problématique claire, annoncez un plan net et appuyez chaque argument sur des références précises.';
  }
  return 'Respectez les contraintes de la contraction puis rédigez un essai structuré, précis et argumenté.';
}

export function normalizeGeneratedEpreuve(input: {
  type: EpreuveType;
  oeuvre?: string;
  theme?: string;
  generation: RawGeneration | null | undefined;
}): NormalizedGeneration {
  const fallbackBareme = DEFAULT_BAREMES[input.type];
  const fallbackSujet = buildFallbackSujet(input.type, input.oeuvre, input.theme);
  const fallbackTexte = buildFallbackTexte(input.type, input.oeuvre);
  const fallbackConsignes = buildFallbackConsignes(input.type);

  const sujet = input.generation?.sujet?.trim() || fallbackSujet;
  const texte = input.type === 'dissertation'
    ? ''
    : (input.generation?.texte?.trim() || fallbackTexte);
  const consignes = input.generation?.consignes?.trim() || fallbackConsignes;
  const bareme = sumBareme(input.generation?.bareme) === 20 ? input.generation!.bareme! : fallbackBareme;

  return {
    sujet,
    texte,
    consignes,
    bareme,
  };
}
