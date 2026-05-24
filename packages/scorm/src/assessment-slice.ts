import type { RuntimeAssessmentBundle } from "@lxpack/validators";

/** Omit embedded quiz data from lesson SCOs; limit assessment SCOs to one quiz. */
export function sliceAssessmentBundleForActivity(
  bundle: RuntimeAssessmentBundle,
  activityId: string,
  activityKind: "lesson" | "assessment",
): RuntimeAssessmentBundle {
  if (activityKind === "assessment") {
    const assessment = bundle.assessments[activityId];
    if (!assessment) {
      return { assessments: {}, answerKeys: {}, configs: {}, feedback: {} };
    }
    return {
      assessments: { [activityId]: assessment },
      answerKeys: bundle.answerKeys[activityId]
        ? { [activityId]: bundle.answerKeys[activityId]! }
        : {},
      configs: bundle.configs[activityId]
        ? { [activityId]: bundle.configs[activityId]! }
        : {},
      feedback: bundle.feedback[activityId]
        ? { [activityId]: bundle.feedback[activityId]! }
        : {},
    };
  }

  return {
    assessments: {},
    answerKeys: {},
    configs: {},
    feedback: {},
  };
}
