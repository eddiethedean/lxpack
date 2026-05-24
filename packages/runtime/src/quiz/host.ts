import type { CourseProgress } from "../types.js";

/** Minimal surface for quiz UI (ISP). */
export interface AssessmentHost {
  getProgress(): CourseProgress;
  getAssessmentAttemptCount(assessmentId: string): number;
  isAssessmentPassed(assessmentId: string): boolean;
  submitAssessment(
    assessmentId: string,
    score: number,
    passingScore: number,
  ): void;
}
