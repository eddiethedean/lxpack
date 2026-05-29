import { normalizePassingThreshold, normalizeScore } from "./normalize.js";
import type { LxpackBridgeRoot, LxpackBridgeV1 } from "./types.js";

export interface BridgeHostRuntime {
  completeLesson: (lessonId: string) => void;
  completeCourse: () => void;
  submitAssessment: (
    assessmentId: string,
    score: number,
    passingScore: number,
  ) => void;
  track: (event: unknown) => void;
}

export function createLxpackBridgeHost(
  runtime: BridgeHostRuntime,
): LxpackBridgeRoot {
  const v1: LxpackBridgeV1 = {
    completeLesson: (lessonId) => runtime.completeLesson(lessonId),
    completeCourse: () => runtime.completeCourse(),
    submitAssessment: (options) => {
      const scaled = normalizeScore({
        score: options.score,
        maxScore: options.maxScore,
      });
      if (scaled === null) return;
      const passing = normalizePassingThreshold({
        passingScore: options.passingScore,
        maxScore: options.maxScore,
      });
      let score = scaled;
      if (options.passed === true) {
        score = Math.max(scaled, passing);
      } else if (options.passed === false) {
        score = Math.min(scaled, Math.max(0, passing - 0.001));
      }
      runtime.submitAssessment(options.id, score, passing);
    },
    track: (event) => runtime.track(event),
  };
  return { v1 };
}
