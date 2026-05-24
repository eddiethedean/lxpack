import type { CourseManifest } from "@lxpack/validators";
import type { AssessmentRuntimeConfig } from "@lxpack/validators";
import type { CourseProgress } from "../types.js";
import type { CompletionState } from "../lms/completion-state.js";
import { getAttemptCount } from "../quiz/score.js";

export interface CompletionEvaluatorOptions {
  manifest: CourseManifest;
  completionThreshold: number;
  assessmentConfigs: Record<string, AssessmentRuntimeConfig>;
  defaultPassingScores: Record<string, number>;
  passedAssessments: Set<string>;
}

export function buildCompletionState(
  progress: CourseProgress,
  options: CompletionEvaluatorOptions,
): CompletionState {
  const { manifest, completionThreshold, passedAssessments } = options;
  const lessonCount = manifest.lessons.length;
  const assessmentCount = manifest.assessments?.length ?? 0;
  const total = lessonCount + assessmentCount;
  const completedLessons = progress.completedLessons.filter((id) =>
    manifest.lessons.some((l) => l.id === id),
  ).length;
  const ratio =
    total === 0
      ? 0
      : (completedLessons + passedAssessments.size) / total;

  const allLessonsComplete = manifest.lessons.every((l) =>
    progress.completedLessons.includes(l.id),
  );
  const allAssessmentsPassed =
    !manifest.assessments?.length ||
    manifest.assessments.every((a) => passedAssessments.has(a.id));

  const anyAssessmentFailed = manifest.assessments?.some((a) => {
    if (!(a.id in progress.assessmentScores)) return false;
    if (passedAssessments.has(a.id)) return false;
    const maxAttempts = options.assessmentConfigs[a.id]?.maxAttempts ?? 1;
    return getAttemptCount(progress.suspendData, a.id) >= maxAttempts;
  });

  return {
    ratio,
    scorePercent: Math.round(ratio * 100),
    allLessonsComplete,
    allAssessmentsPassed,
    anyAssessmentFailed: Boolean(anyAssessmentFailed),
    hasAssessments: (manifest.assessments?.length ?? 0) > 0,
    completionThreshold,
  };
}
