import {
  DEFAULT_BRIDGE_PASSING_SCORE,
  normalizePassingThreshold,
  normalizeScore,
} from "./normalize.js";
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
      const scaled =
        normalizeScore({
          score: options.score,
          maxScore: options.maxScore,
        }) ?? options.score;
      const passing =
        normalizePassingThreshold({
          passingScore: options.passingScore,
          maxScore: options.maxScore,
        }) ?? DEFAULT_BRIDGE_PASSING_SCORE;
      runtime.submitAssessment(options.id, scaled, passing);
    },
    track: (event) => runtime.track(event),
  };
  return { v1 };
}
