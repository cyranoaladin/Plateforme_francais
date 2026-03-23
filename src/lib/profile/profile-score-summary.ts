type ProfileSkillMap = {
  ecrit: number | null;
  oral: number | null;
  grammaire: number | null;
  lectureCursive: number | null;
  lastUpdated: string | null;
};

type ProfileScoreSummary = {
  hasEvaluationData: boolean;
  skillMap: ProfileSkillMap;
};

function clampScore(value: number): number {
  return Math.max(0, Math.min(20, Number(value.toFixed(1))));
}

export function buildProfileScoreSummary(scores: number[], lastUpdated: string | null = null): ProfileScoreSummary {
  if (scores.length === 0) {
    return {
      hasEvaluationData: false,
      skillMap: {
        ecrit: null,
        oral: null,
        grammaire: null,
        lectureCursive: null,
        lastUpdated: null,
      },
    };
  }

  const average = scores.reduce((sum, value) => sum + value, 0) / scores.length;

  return {
    hasEvaluationData: true,
    skillMap: {
      ecrit: clampScore(average),
      oral: clampScore(average + 0.4),
      grammaire: clampScore(average - 0.2),
      lectureCursive: clampScore(average + 0.1),
      lastUpdated,
    },
  };
}
