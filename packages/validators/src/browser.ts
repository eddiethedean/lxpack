/**
 * Browser-safe subset of @lxpack/validators for the runtime client bundle.
 * Do not import Node-only modules (fs, path, course discovery) from this entry.
 */
export { enumerateActivities, type CourseActivity } from "./activities.js";
export { collectFlowInteractionDoneIds } from "./flow-validate.js";
export type { Condition, FlowRule } from "./conditions.js";
export type {
  CourseManifest,
  Lesson,
  ShowFeedback,
} from "./schemas.js";
export type {
  AssessmentRuntimeConfig,
  LearnerAssessment,
  QuestionFeedback,
  RuntimeAssessmentBundle,
} from "./assessments.js";
