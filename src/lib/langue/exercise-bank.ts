export type LangueExerciseTheme = 'mixte' | 'subordonnees' | 'relations_logiques' | 'systeme_verbal';

export type LangueExercise = {
  id: string;
  sentence: string;
  question: string;
  correction: string;
  axe: Exclude<LangueExerciseTheme, 'mixte'>;
};

const ALL_EXERCISES: LangueExercise[] = [
  {
    id: 'sub-1',
    sentence: "J\u2019ai vu la mer qui se retirait silencieusement.",
    question: 'Analysez la proposition subordonnée dans cette phrase.',
    correction:
      '\u00AB qui se retirait silencieusement \u00BB est une proposition subordonnée relative. Elle est introduite par le pronom relatif \u00AB qui \u00BB, a pour antécédent \u00AB mer \u00BB et complète ce nom.',
    axe: 'subordonnees',
  },
  {
    id: 'sub-2',
    sentence: "Je me demande s\u2019il viendra demain.",
    question: 'Identifiez et analysez la proposition subordonnée.',
    correction:
      '\u00AB s\u2019il viendra demain \u00BB est une proposition subordonnée interrogative indirecte totale. Elle est introduite par \u00AB si \u00BB et remplit la fonction de COD du verbe \u00AB demande \u00BB.',
    axe: 'subordonnees',
  },
  {
    id: 'sub-3',
    sentence: 'Le poète espère que la nuit lui répondra enfin.',
    question: 'Quelle est la nature et la fonction de la subordonnée ?',
    correction:
      '\u00AB que la nuit lui répondra enfin \u00BB est une proposition subordonnée conjonctive complétive. Introduite par \u00AB que \u00BB, elle est COD du verbe \u00AB espère \u00BB.',
    axe: 'subordonnees',
  },
  {
    id: 'sub-4',
    sentence: 'Voici le livre dont je t\u2019ai parlé hier soir.',
    question: 'Analysez la proposition subordonnée et le lien avec son antécédent.',
    correction:
      '\u00AB dont je t\u2019ai parlé hier soir \u00BB est une proposition subordonnée relative. Le pronom relatif \u00AB dont \u00BB reprend l\u2019antécédent \u00AB livre \u00BB et la subordonnée complète ce nom.',
    axe: 'subordonnees',
  },
  {
    id: 'sub-5',
    sentence: "Quand le jour se leva, la ville paraissait vide.",
    question: 'Identifiez la proposition subordonnée et précisez sa valeur.',
    correction:
      '\u00AB Quand le jour se leva \u00BB est une proposition subordonnée conjonctive circonstancielle de temps. Introduite par \u00AB quand \u00BB, elle situe l\u2019action principale dans le temps.',
    axe: 'subordonnees',
  },
  {
    id: 'log-1',
    sentence: 'Bien qu\u2019il fût épuisé, il continua sa route.',
    question: 'Identifiez et analysez le rapport logique exprimé dans cette phrase.',
    correction:
      '\u00AB Bien qu\u2019il fût épuisé \u00BB exprime la concession. La subordonnée, introduite par \u00AB bien que \u00BB, montre un obstacle qui n\u2019empêche pas l\u2019action principale.',
    axe: 'relations_logiques',
  },
  {
    id: 'log-2',
    sentence: 'Il se tut parce que la foule grondait déjà.',
    question: 'Quel rapport logique relie les deux propositions ?',
    correction:
      'La subordonnée introduite par \u00AB parce que \u00BB exprime la cause. Elle explique la raison pour laquelle le personnage se tait.',
    axe: 'relations_logiques',
  },
  {
    id: 'log-3',
    sentence: 'Il parla plus bas afin que personne ne l\u2019entendît.',
    question: 'Précisez le rapport logique et sa formulation.',
    correction:
      '\u00AB afin que personne ne l\u2019entendît \u00BB exprime le but. La locution conjonctive \u00AB afin que \u00BB introduit la finalité de l\u2019action principale.',
    axe: 'relations_logiques',
  },
  {
    id: 'log-4',
    sentence: 'Il avait tant marché qu\u2019il ne sentait plus ses jambes.',
    question: 'Quel rapport logique est exprimé par la subordonnée ?',
    correction:
      'La structure \u00AB tant\u2026 que \u00BB exprime la conséquence. La subordonnée indique l\u2019effet produit par l\u2019intensité de l\u2019effort.',
    axe: 'relations_logiques',
  },
  {
    id: 'log-5',
    sentence: 'Si la pluie redouble, la fête sera annulée.',
    question: 'Analysez le rapport logique entre les deux propositions.',
    correction:
      'La subordonnée introduite par \u00AB si \u00BB exprime la condition. Elle pose l\u2019hypothèse dont dépend la réalisation de la proposition principale.',
    axe: 'relations_logiques',
  },
  {
    id: 'verb-1',
    sentence: "Si j\u2019avais su, je ne serais pas venu.",
    question: 'Quelle est la valeur du mode et du temps employés dans la subordonnée ?',
    correction:
      '\u00AB Si j\u2019avais su \u00BB est à l\u2019indicatif plus-que-parfait. Dans ce système hypothétique, il exprime une condition irréelle dans le passé.',
    axe: 'systeme_verbal',
  },
  {
    id: 'verb-2',
    sentence: 'Il parlait comme s\u2019il eût connu la réponse depuis toujours.',
    question: 'Analysez le système verbal de cette phrase.',
    correction:
      '\u00AB comme s\u2019il eût connu \u00BB emploie le subjonctif plus-que-parfait, équivalent soutenu d\u2019un irréel du passé dans une comparaison fictive.',
    axe: 'systeme_verbal',
  },
  {
    id: 'verb-3',
    sentence: 'Je doute qu\u2019il puisse soutenir un tel regard.',
    question: 'Pourquoi le verbe de la subordonnée est-il au subjonctif ?',
    correction:
      'Le verbe \u00AB puisse \u00BB est au subjonctif présent parce que le verbe principal \u00AB douter \u00BB exprime l\u2019incertitude. Le mode marque le non-certain.',
    axe: 'systeme_verbal',
  },
  {
    id: 'verb-4',
    sentence: 'Il disait qu\u2019il partirait dès l\u2019aube venue.',
    question: 'Analysez la valeur du conditionnel dans cette phrase.',
    correction:
      '\u00AB partirait \u00BB est un conditionnel présent de futur dans le passé. Il rapporte, depuis un point de vue passé, une action postérieure.',
    axe: 'systeme_verbal',
  },
  {
    id: 'verb-5',
    sentence: 'Il fallait qu\u2019elle vînt avant la nuit.',
    question: 'Identifiez le mode et justifiez son emploi.',
    correction:
      '\u00AB vînt \u00BB est au subjonctif imparfait. Le verbe principal impersonnel \u00AB il fallait que \u00BB impose le subjonctif dans un registre soutenu.',
    axe: 'systeme_verbal',
  },
];

function shuffleExercises(exercises: LangueExercise[]): LangueExercise[] {
  const copy = [...exercises];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

export function getLangueExerciseBank(theme: LangueExerciseTheme): LangueExercise[] {
  if (theme === 'mixte') {
    return [...ALL_EXERCISES];
  }

  return ALL_EXERCISES.filter((exercise) => exercise.axe === theme);
}

export function buildLangueExerciseSeries(theme: LangueExerciseTheme, count: number): LangueExercise[] {
  const safeCount = Math.max(1, Math.min(10, count));
  const primaryPool = getLangueExerciseBank(theme);

  if (primaryPool.length >= safeCount) {
    return shuffleExercises(primaryPool).slice(0, safeCount);
  }

  if (theme === 'mixte') {
    return shuffleExercises(primaryPool).slice(0, safeCount);
  }

  const complementPool = shuffleExercises(
    ALL_EXERCISES.filter((exercise) => exercise.axe !== theme),
  );

  return [...shuffleExercises(primaryPool), ...complementPool].slice(0, safeCount);
}
