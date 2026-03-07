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
    sentence: "J'ai vu la mer qui se retirait silencieusement.",
    question: 'Analysez la proposition subordonnee dans cette phrase.',
    correction:
      '« qui se retirait silencieusement » est une proposition subordonnee relative. Elle est introduite par le pronom relatif « qui », a pour antecedent « mer » et complete ce nom.',
    axe: 'subordonnees',
  },
  {
    id: 'sub-2',
    sentence: "Je me demande s'il viendra demain.",
    question: 'Identifiez et analysez la proposition subordonnee.',
    correction:
      '« s il viendra demain » est une proposition subordonnee interrogative indirecte totale. Elle est introduite par « si » et remplit la fonction de COD du verbe « demande ».',
    axe: 'subordonnees',
  },
  {
    id: 'sub-3',
    sentence: 'Le poete espere que la nuit lui repondra enfin.',
    question: 'Quelle est la nature et la fonction de la subordonnee ?',
    correction:
      '« que la nuit lui repondra enfin » est une proposition subordonnee conjonctive complétive. Introduite par « que », elle est COD du verbe « espere ».',
    axe: 'subordonnees',
  },
  {
    id: 'sub-4',
    sentence: 'Voici le livre dont je t ai parle hier soir.',
    question: 'Analysez la proposition subordonnee et le lien avec son antecedent.',
    correction:
      '« dont je t ai parle hier soir » est une proposition subordonnee relative. Le pronom relatif « dont » reprend l antecedent « livre » et la subordonnee complete ce nom.',
    axe: 'subordonnees',
  },
  {
    id: 'sub-5',
    sentence: "Quand le jour se leva, la ville paraissait vide.",
    question: 'Identifiez la proposition subordonnee et precisez sa valeur.',
    correction:
      '« Quand le jour se leva » est une proposition subordonnee conjonctive circonstancielle de temps. Introduite par « quand », elle situe l action principale dans le temps.',
    axe: 'subordonnees',
  },
  {
    id: 'log-1',
    sentence: 'Bien qu il fut epuise, il continua sa route.',
    question: 'Identifiez et analysez le rapport logique exprime dans cette phrase.',
    correction:
      '« Bien qu il fut epuise » exprime la concession. La subordonnee, introduite par « bien que », montre un obstacle qui n empeche pas l action principale.',
    axe: 'relations_logiques',
  },
  {
    id: 'log-2',
    sentence: 'Il se tut parce que la foule grondait deja.',
    question: 'Quel rapport logique relie les deux propositions ?',
    correction:
      'La subordonnee introduite par « parce que » exprime la cause. Elle explique la raison pour laquelle le personnage se tait.',
    axe: 'relations_logiques',
  },
  {
    id: 'log-3',
    sentence: 'Il parla plus bas afin que personne ne l entendit.',
    question: 'Precisez le rapport logique et sa formulation.',
    correction:
      '« afin que personne ne l entendit » exprime le but. La locution conjonctive « afin que » introduit la finalite de l action principale.',
    axe: 'relations_logiques',
  },
  {
    id: 'log-4',
    sentence: 'Il avait tant marche qu il ne sentait plus ses jambes.',
    question: 'Quel rapport logique est exprime par la subordonnee ?',
    correction:
      'La structure « tant... que » exprime la consequence. La subordonnee indique l effet produit par l intensite de l effort.',
    axe: 'relations_logiques',
  },
  {
    id: 'log-5',
    sentence: 'Si la pluie redouble, la fete sera annulee.',
    question: 'Analysez le rapport logique entre les deux propositions.',
    correction:
      'La subordonnee introduite par « si » exprime la condition. Elle pose l hypothese dont depend la realisation de la proposition principale.',
    axe: 'relations_logiques',
  },
  {
    id: 'verb-1',
    sentence: "Si j'avais su, je ne serais pas venu.",
    question: 'Quelle est la valeur du mode et du temps employes dans la subordonnee ?',
    correction:
      '« Si j avais su » est a l indicatif plus-que-parfait. Dans ce systeme hypothétique, il exprime une condition irreelle dans le passe.',
    axe: 'systeme_verbal',
  },
  {
    id: 'verb-2',
    sentence: 'Il parlait comme s il eut connu la reponse depuis toujours.',
    question: 'Analysez le systeme verbal de cette phrase.',
    correction:
      '« comme s il eut connu » emploie le subjonctif plus-que-parfait, equivalent soutenu d un irreel du passe dans une comparaison fictive.',
    axe: 'systeme_verbal',
  },
  {
    id: 'verb-3',
    sentence: 'Je doute qu il puisse soutenir un tel regard.',
    question: 'Pourquoi le verbe de la subordonnee est-il au subjonctif ?',
    correction:
      'Le verbe « puisse » est au subjonctif present parce que le verbe principal « douter » exprime l incertitude. Le mode marque le non-certain.',
    axe: 'systeme_verbal',
  },
  {
    id: 'verb-4',
    sentence: 'Il disait qu il partirait des l aube venue.',
    question: 'Analysez la valeur du conditionnel dans cette phrase.',
    correction:
      '« partirait » est un conditionnel present de futur dans le passe. Il rapporte, depuis un point de vue passe, une action posterieure.',
    axe: 'systeme_verbal',
  },
  {
    id: 'verb-5',
    sentence: 'Il fallait qu elle vint avant la nuit.',
    question: 'Identifiez le mode et justifiez son emploi.',
    correction:
      '« vint » est au subjonctif imparfait. Le verbe principal impersonnel « il fallait que » impose le subjonctif dans un registre soutenu.',
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
