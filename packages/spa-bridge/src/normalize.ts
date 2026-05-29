/** Scale raw score to 0–1 when maxScore is provided; otherwise clamp to 0–1. */
export function normalizeScore(raw: {
  score: number;
  maxScore?: number;
}): number | null {
  const { score, maxScore } = raw;
  if (!Number.isFinite(score)) return null;
  if (typeof maxScore === "number" && maxScore > 0) {
    if (score > 1) {
      return Math.min(1, Math.max(0, score / maxScore));
    }
    return Math.min(1, Math.max(0, score));
  }
  if (score > 1 && score <= 100) {
    return Math.min(1, Math.max(0, score / 100));
  }
  return Math.min(1, Math.max(0, score));
}

/** Default passing threshold for bridge submitAssessment (0–1). */
export const DEFAULT_BRIDGE_PASSING_SCORE = 0.7;

export function normalizePassingThreshold(raw: {
  passingScore?: number;
  maxScore?: number;
}): number {
  const { passingScore, maxScore } = raw;
  if (typeof passingScore !== "number" || !Number.isFinite(passingScore)) {
    return DEFAULT_BRIDGE_PASSING_SCORE;
  }
  if (typeof maxScore === "number" && maxScore > 0) {
    if (passingScore > 1) {
      return Math.min(1, Math.max(0, passingScore / maxScore));
    }
    return Math.min(1, Math.max(0, passingScore));
  }
  if (passingScore > 1 && passingScore <= 100) {
    return Math.min(1, Math.max(0, passingScore / 100));
  }
  return Math.min(1, Math.max(0, passingScore));
}
