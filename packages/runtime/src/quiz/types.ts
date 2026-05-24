import type {
  AssessmentRuntimeConfig,
  LearnerAssessment,
  QuestionFeedback,
} from "@lxpack/validators";

export type { AssessmentRuntimeConfig, QuestionFeedback };

export const DEFAULT_ASSESSMENT_CONFIG: AssessmentRuntimeConfig = {
  maxAttempts: 1,
  shuffleChoices: false,
  showFeedback: "never",
};

export interface RuntimeAssessmentPayload extends LearnerAssessment {
  config?: Partial<AssessmentRuntimeConfig>;
  feedback?: QuestionFeedback;
}
