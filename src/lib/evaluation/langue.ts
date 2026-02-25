export type LangueExerciseId = 1 | 2;

export type LangueEvaluation = {
  score: number;
  max: 2;
  status: "success" | "warning" | "error";
  message: string;
  missing: string[];
};

type Rule = {
  requiredKeywords: string[];
  missingHints: string[];
};

const RULES: Record<LangueExerciseId, Rule> = {
  1: {
    requiredKeywords: ["relative", "pronom", "antécédent", "fonction"],
    missingHints: [
      "nature de la subordonnée relative",
      "mot introducteur (pronom relatif)",
      "antécédent",
      "fonction de la subordonnée",
    ],
  },
  2: {
    requiredKeywords: [
      "plus-que-parfait",
      "indicatif",
      "condition",
      "irréel",
    ],
    missingHints: [
      "mode verbal (indicatif)",
      "temps verbal (plus-que-parfait)",
      "valeur de condition",
      "valeur d'irréel du passé",
    ],
  },
};

function normalize(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function evaluateLangueAnswer(
  exerciseId: LangueExerciseId,
  answer: string,
): LangueEvaluation {
  const normalized = normalize(answer.trim());

  if (normalized.length < 20) {
    return {
      score: 0.5,
      max: 2,
      status: "error",
      message:
        "Réponse trop brève. Développez avec nature, marques grammaticales et justification.",
      missing: RULES[exerciseId].missingHints,
    };
  }

  const rule = RULES[exerciseId];
  const matchedKeywords = rule.requiredKeywords.filter((keyword) =>
    normalized.includes(keyword),
  );

  const ratio = matchedKeywords.length / rule.requiredKeywords.length;
  const missing = rule.missingHints.filter((_, index) => {
    return !normalized.includes(rule.requiredKeywords[index]);
  });

  if (ratio >= 0.75) {
    return {
      score: 2,
      max: 2,
      status: "success",
      message:
        "Réponse solide: identification juste et justification conforme à la terminologie officielle.",
      missing,
    };
  }

  if (ratio >= 0.5) {
    return {
      score: 1,
      max: 2,
      status: "warning",
      message:
        "Réponse partiellement juste: ajoutez les éléments manquants pour sécuriser les 2 points.",
      missing,
    };
  }

  return {
    score: 0.5,
    max: 2,
    status: "error",
    message:
      "Réponse insuffisante ou hors-terminologie. Reprenez la méthode officielle pas à pas.",
    missing,
  };
}
