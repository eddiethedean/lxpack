/** Supported bridge API versions exposed on `window.lxpackBridge`. */
export const LXPACK_BRIDGE_VERSIONS = ["v1"] as const;

export type LxpackBridgeVersion = (typeof LXPACK_BRIDGE_VERSIONS)[number];

export type LxpackBridgeSubmitAssessmentPayload = {
  id: string;
  /** Scaled score in 0–1 when maxScore is omitted; raw points when maxScore is set. */
  score: number;
  /** Passing threshold in 0–1 when maxScore is omitted; absolute points in YAML assessments. */
  passingScore?: number;
  maxScore?: number;
  passed?: boolean;
};

/** Parent shell bridge API (SPA iframe calls via `getLxpackBridge()`). */
export type LxpackBridgeV1 = {
  completeLesson: (lessonId: string) => void;
  /** Marks every lesson in the course complete (host may no-op unknown ids). */
  completeCourse: () => void;
  submitAssessment: (payload: LxpackBridgeSubmitAssessmentPayload) => void;
  track?: (event: unknown) => void;
};

export type LxpackBridgeRoot = {
  v1: LxpackBridgeV1;
};

declare global {
  interface Window {
    lxpackBridge?: LxpackBridgeRoot;
  }
}
