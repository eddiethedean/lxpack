import type { CourseManifest } from "@lxpack/validators";
import type { AssessmentRuntimeConfig } from "@lxpack/validators";
import type { CourseProgress } from "../types.js";
import type { CompletionState } from "../lms/completion-state.js";
import { getAttemptCount } from "../quiz/score.js";

export interface ScormActivityScope {
  id: string;
  kind: "lesson" | "assessment";
}

export interface CompletionEvaluatorOptions {
  manifest: CourseManifest;
  completionThreshold: number;
  assessmentConfigs: Record<string, AssessmentRuntimeConfig>;
  defaultPassingScores: Record<string, number>;
  passedAssessments: Set<string>;
  /** SCORM 2004 per-SCO launch: evaluate completion for this activity only. */
  scopeActivity?: ScormActivityScope;
}

export function resolveScormActivityScope(
  manifest: CourseManifest,
  activityId: string,
): ScormActivityScope | undefined {
  if (manifest.lessons.some((l) => l.id === activityId)) {
    return { id: activityId, kind: "lesson" };
  }
  if (manifest.assessments?.some((a) => a.id === activityId)) {
    return { id: activityId, kind: "assessment" };
  }
  return undefined;
}

export function buildCompletionState(
  progress: CourseProgress,
  options: CompletionEvaluatorOptions,
): CompletionState {
  const { manifest, completionThreshold, passedAssessments, scopeActivity } =
    options;

  if (scopeActivity) {
    return buildScopedCompletionState(
      progress,
      manifest,
      scopeActivity,
      completionThreshold,
      options,
      passedAssessments,
    );
  }

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
    hasLearnerProgress: hasLearnerProgress(progress, passedAssessments),
    completionThreshold,
  };
}

function hasLearnerProgress(
  progress: CourseProgress,
  passedAssessments: Set<string>,
): boolean {
  return (
    progress.completedLessons.length > 0 ||
    passedAssessments.size > 0 ||
    Object.keys(progress.assessmentScores).length > 0
  );
}

function buildScopedCompletionState(
  progress: CourseProgress,
  manifest: CourseManifest,
  scope: ScormActivityScope,
  completionThreshold: number,
  options: CompletionEvaluatorOptions,
  passedAssessments: Set<string>,
): CompletionState {
  if (scope.kind === "lesson") {
    const complete = progress.completedLessons.includes(scope.id);
    const ratio = complete ? 1 : 0;
    return {
      ratio,
      scorePercent: Math.round(ratio * 100),
      allLessonsComplete: complete,
      allAssessmentsPassed: true,
      anyAssessmentFailed: false,
      hasAssessments: false,
      hasLearnerProgress: hasLearnerProgress(progress, passedAssessments),
      completionThreshold,
    };
  }

  const id = scope.id;
  const passed = passedAssessments.has(id);
  const attempted = id in progress.assessmentScores;
  const maxAttempts = options.assessmentConfigs[id]?.maxAttempts ?? 1;
  const failed =
    attempted &&
    !passed &&
    getAttemptCount(progress.suspendData, id) >= maxAttempts;
  const ratio = passed ? 1 : 0;

  return {
    ratio,
    scorePercent: Math.round(ratio * 100),
    allLessonsComplete: true,
    allAssessmentsPassed: passed,
    anyAssessmentFailed: failed,
    hasAssessments: Boolean(manifest.assessments?.some((a) => a.id === id)),
    hasLearnerProgress: hasLearnerProgress(progress, passedAssessments),
    completionThreshold,
  };
}
